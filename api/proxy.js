export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  try {
    const backend = process.env.REAL_API_URL; 
    
    if (!backend) {
      return res.status(500).json({ message: 'Backend URL not configured' });
    }

    // req.url 在 Vercel 中通常是 "/api/auth/token/"
    const path = req.url; 

    // 拼接目标 URL
    // 确保 backend 没有尾部斜杠，防止出现 //api/...
    const targetBackend = backend.replace(/\/$/, '');
    const targetURL = targetBackend + path;

    console.log(`[Proxy] Forwarding: ${path} -> ${targetURL}`);

    // --- SSE 流式处理 (保持不变) ---
    if (path.includes('messages-stream') || path.includes('regenerate')) {
      return handleSSE(req, res, targetURL);
    }

    // --- 普通请求处理 ---
    const headers = { ...req.headers };
    // 删除 host，否则 Nginx 会以为你是直接访问 IP，可能会拦截
    delete headers.host; 
    // 删除 referer 和 origin，避免 Django CSRF/CORS 校验失败 (视情况而定)
    // headers['origin'] = targetBackend;
    // headers['referer'] = targetBackend;

    const init = {
      method: req.method,
      headers: headers,
    };

    // 处理 Body
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      // Vercel 解析后的 body 是对象，fetch 需要字符串
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

// ... (handleSSE 函数保持之前的代码不变) ...
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