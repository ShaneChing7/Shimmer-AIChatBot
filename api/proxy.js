export default async function handler(req, res) {
  try {
    const apiUrl = process.env.REAL_API_URL; // 真实后端地址（不会泄露）
    
    const response = await fetch(apiUrl + req.url.replace('/api', ''), {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method)
        ? JSON.stringify(req.body)
        : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({ message: 'Proxy Error', error: err.toString() });
  }
}
