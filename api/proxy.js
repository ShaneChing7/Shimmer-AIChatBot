// api/proxy.js
export const config = {
  runtime: 'nodejs', // 推荐使用标准 Node.js 运行时
  maxDuration: 60,   // 设置最大超时时间 (秒)，免费版限制 10s (Vercel 函数有时候会超时，Pro版可更高)
};

export default async function handler(req, res) {
  try {
    const backend = process.env.REAL_API_URL;
    if (!backend) {
      return res.status(500).json({ message: 'Backend URL not configured' });
    }

    // 1. 去掉 /api 前缀，保留后续路径
    // 例如：/api/sessions/ -> /sessions/
    const path = req.url.replace(/^\/api/, '');
    
    // 2. 拼接真实后端地址
    // 确保 backend 没有尾部斜杠，path 确保有头部斜杠
    const targetURL = backend.replace(/\/$/, '') + path;

    console.log(`[Proxy] Forwarding to: ${targetURL}`);

    // 3. 专门处理 SSE 流式响应 (AI 对话核心)
    if (path.includes('messages-stream') || path.includes('regenerate')) {
      return handleSSE(req, res, targetURL);
    }

    // 4. 处理普通请求 (GET, POST, etc.)
    const headers = { ...req.headers };
    delete headers.host;         // 删除 host，避免后端 Nginx 报错
    delete headers['content-length']; // 删除长度，重新计算

    const init = {
      method: req.method,
      headers: headers,
    };

    // Vercel 会自动解析 body 为对象，但 fetch 需要 string
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      init.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(targetURL, init);

    // 转发响应头
    response.headers.forEach((value, key) => {
      // 某些头会导致 Vercel 报错，过滤掉
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status);

    // 转发响应体
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));

  } catch (err) {
    console.error('[Proxy Error]', err);
    res.status(500).json({ message: 'Proxy Error', error: err.toString() });
  }
}

// ======================
//    SSE 流式代理核心
// ======================
async function handleSSE(req, res, targetURL) {
  const headers = { ...req.headers };
  delete headers.host;
  
  // 强制设置为 SSE 相关的头，防止缓存
  headers['Accept'] = 'text/event-stream';
  
  const init = {
    method: 'POST',
    headers: headers,
    body: typeof req.body === 'object' ? JSON.stringify(req.body) : req.body
  };

  try {
    const response = await fetch(targetURL, init);

    // 设置响应给前端的头
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 关键：禁用 Nginx 缓冲

    if (!response.body) {
      res.end();
      return;
    }

    // 使用 Node.js 的原生流管道
    // @ts-ignore
    const { body } = response;
    // 将 fetch 的 web stream 转换为 node stream 并 pipe 给 res
    const reader = body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value); // 实时写入数据，不要用 res.send
    }
    res.end();

  } catch (error) {
    console.error('SSE Proxy Error:', error);
    res.end(); // 结束流
  }
}