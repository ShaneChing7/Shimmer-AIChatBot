export const config = {
  runtime: 'nodejs', 
  api: {
    bodyParser: false, // 禁用 Vercel 自动解析，保留原始数据流
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  try {
    const backend = process.env.REAL_API_URL;
    if (!backend) {
      res.statusCode = 500;
      res.end('Backend URL not configured');
      return;
    }

    //  URL 拼接逻辑 (保持稳健)
    const requestUrl = req.url;
    let targetBase = backend.replace(/\/$/, '');
    // 如果环境变量误写了 /api 结尾，去掉它，防止重复
    if (targetBase.endsWith('/api')) {
        targetBase = targetBase.slice(0, -4);
    }
    const targetURL = targetBase + requestUrl;

    console.log(`[Proxy] ${req.method} ${requestUrl} -> ${targetURL}`);

    // 准备 Headers
    const headers = { ...req.headers };
    // 移除可能引起问题的头
    delete headers.host;
    delete headers.connection; 
    delete headers['content-length']; // 长度由流自动控制
    
    // <--- 强制禁用 Nginx/Vercel 缓冲，确保流式输出流畅 --->
    headers['X-Accel-Buffering'] = 'no';

    // 配置 Fetch
    const fetchOptions = {
      method: req.method,
      headers: headers,
      // <--- 直接将原始请求流 (req) 转发，不进行任何解析 --->
      // 这完美支持 文件上传(Multipart) 和 JSON
      // duplex: 'half' 是 Node.js 18+ fetch 的新特性，必须加
      duplex: 'half', 
    };

    // GET/HEAD 请求不能有 body
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        fetchOptions.body = req;
    }

    // 发起请求
    const response = await fetch(targetURL, fetchOptions);

    // 转发状态码
    res.statusCode = response.status;

    //  转发响应头
    for (const [key, value] of response.headers) {
      // 过滤掉传输层专用的头，其他全部保留
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    //  管道式转发响应体 (解决流式输出问题)
    if (!response.body) {
        res.end();
        return;
    }

    // 将 Web Stream 转换为 Node Stream 并通过管道直接发给客户端
    // @ts-ignore
    const reader = response.body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // 实时写入，实现打字机效果
      res.write(value);
    }
    res.end();

  } catch (err) {
    console.error('[Proxy Error]', err);
    // 只有在没发过头的情况下才发错误响应
    if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Proxy Error: ' + err.toString());
    }
  }
}