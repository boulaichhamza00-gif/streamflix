const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const decodedUrl = decodeURIComponent(url);
    const isM3U8 = decodedUrl.includes('.m3u8') || decodedUrl.includes('playlist');
    
    const response = await axios({
      method: 'get',
      url: decodedUrl,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      },
      timeout: 30000,
      maxRedirects: 5
    });

    let data = response.data;
    
    // If it's an M3U8 playlist, rewrite segment URLs to use proxy
    if (isM3U8 && data.includes('#EXTM3U')) {
      const baseUrl = decodedUrl.substring(0, decodedUrl.lastIndexOf('/') + 1);
      const proxyBase = `${req.protocol}://${req.get('host')}/api/proxy/stream?url=`;
      
      // Replace relative URLs with proxied URLs
      data = data.replace(/(^(?!#)(?!http).*\.ts|^(?!#)(?!http).*\.m3u8)/gm, (match) => {
        const fullUrl = encodeURIComponent(baseUrl + match);
        return proxyBase + fullUrl;
      });
      
      // Replace absolute URLs that aren't already proxied
      data = data.replace(/(https?:\/\/[^"\s]+\.(ts|m3u8))/g, (match) => {
        if (match.includes(req.get('host'))) return match;
        return proxyBase + encodeURIComponent(match);
      });
    }

    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.set('Cache-Control', 'no-cache');
    res.send(data);
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Stream failed', message: error.message });
  }
});

module.exports = router;
