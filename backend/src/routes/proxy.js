const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const decodedUrl = decodeURIComponent(url);
    
    const response = await axios({
      method: 'get',
      url: decodedUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      },
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: () => true // Accept any status
    });

    // Forward headers
    const contentType = response.headers['content-type'];
    if (contentType) res.set('Content-Type', contentType);
    res.set('Cache-Control', 'no-cache');

    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
