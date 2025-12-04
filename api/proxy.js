export const config = {
  runtime: 'nodejs20.x',
  regions: ['sin1', 'hnd1', 'icn1'], // 亚洲节点更快，可选
};

export default async function handler(req, res) {
  try {
    const backend = process.env.REAL_API_URL; 
    if (!backend) {
      return res.status(500).json({ message: 'Backend URL not configured' });
    }

    // 去掉 /api 前缀
    const path = req.url.replace(/^\/api/, '');

    const targetURL = backend + path;

    // 如果是 SSE（流式响应）
    if (path.includes('messages-stream')) {
      return handleSSE(req, res, targetURL);
    }

    // 处理普通 JSON 和文件
    const headers = { ...req.headers };
    delete headers.host; // 不允许转发 host

    const init = {
      method: req.method,
      headers
    };

    // 处理 body
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = req.body;
    }

    const response = await fetch(targetURL, init);

    // 转发 Headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // 状态码
    res.status(response.status);

    // 转发内容
    const buf = Buffer.from(await response.arrayBuffer());
    res.send(buf);

  } catch (err) {
    res.status(500).json({ message: 'Proxy Error', error: err.toString() });
  }
}


// ======================
//    SSE 流式代理
// ======================
async function handleSSE(req, res, targetURL) {
  const headers = {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Content-Type': req.headers['content-type'] || 'application/json',
    'Authorization': req.headers['authorization'] || '',
  };

  const init = {
    method: 'POST',
    headers,
    body: req.body
  };

  const response = await fetch(targetURL, init);

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const reader = response.body.getReader();

  // 持续读取数据（保持流）
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    res.write(value);
  }

  res.end();
}
