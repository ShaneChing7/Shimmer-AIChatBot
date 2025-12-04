export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  try {
    const backend = process.env.REAL_API_URL;
    if (!backend) {
      return res.status(500).json({ message: 'Backend URL not configured' });
    }

    // ===============================================
    // 1. 智能处理 URL 拼接 (防止 /api 重复)
    // ===============================================
    
    // 获取请求路径，例如: "/api/auth/token/"
    const requestPath = req.url;

    // 清理后端地址：
    // 1. 去掉末尾斜杠
    // 2. 如果用户手误在环境变量里写了 /api，也去掉，防止变成 /api/api/...
    let targetBase = backend.replace(/\/$/, ''); 
    if (targetBase.endsWith('/api')) {
        targetBase = targetBase.slice(0, -4);
    }

    // 最终拼接：http://8.137...:8000 + /api/auth/token/
    const targetURL = targetBase + requestPath;

    // 打印日志 (去 Vercel Dashboard -> Logs 查看)
    console.log(`[Proxy] Forwarding: ${requestPath} -> ${targetURL}`);

    // ===============================================
    // 2. 转发逻辑
    // ===============================================

    if (requestPath.includes('messages-stream') || requestPath.includes('regenerate')) {
      return handleSSE(req, res, targetURL);
    }

    const headers = { ...req.headers };
    delete headers.host; 
    // 覆盖 Origin/Referer，骗过 Django 的 CSRF 检查 (如果需要)
    // headers['origin'] = targetBase;
    // headers['referer'] = targetBase;

    const init = {
      method: req.method,
      headers: headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      init.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(targetURL, init);

    // 转发响应头
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status);

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));

  } catch (err) {
    console.error('[Proxy Error]', err);
    res.status(500).json({ message: 'Proxy Error', error: err.toString() });
  }
}

// SSE 处理函数保持不变
async function handleSSE(req, res, targetURL) {
  const headers = { ...req.headers };
  delete headers.host;
  headers['Accept'] = 'text/event-stream';
  
  const init = {
    method: 'POST',
    headers: headers,
    body: typeof req.body === 'object' ? JSON.stringify(req.body) : req.body
  };

  try {
    const response = await fetch(targetURL, init);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); 

    if (!response.body) { res.end(); return; }
    
    // @ts-ignore
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error) {
    console.error('SSE Error:', error);
    res.end();
  }
}