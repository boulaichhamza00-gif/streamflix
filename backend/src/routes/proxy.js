const express = require('express');
const axios = require('axios');
const router = express.Router();

// Helper to get base URL
const getBaseUrl = (url) => {
  const lastSlash = url.lastIndexOf('/');
  return lastSlash > 0 ? url.substring(0, lastSlash + 1) : url;
};

// Helper to make absolute URL
const makeAbsolute = (base, path) => {
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) {
    const urlObj = new URL(base);
    return `${urlObj.protocol}//${urlObj.host}${path}`;
  }
  return base + path;
};

router.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const decodedUrl = decodeURIComponent(url);
    const isM3U8 = decodedUrl.includes('.m3u8');
    const baseUrl = getBaseUrl(decodedUrl);
    const proxyBase = `/api/proxy/stream?url=`;

    const response = await axios({
      method: 'get',
      url: decodedUrl,
      responseType: 'text',
      headers: {
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        'Accept': '*/*'
      },
      timeout: 30000,
      maxRedirects: 10
    });

    let data = response.data;

    // Rewrite all URLs in M3U8 to use proxy
    if (isM3U8 || data.includes('#EXTM3U')) {
      // Split into lines and process each
      const lines = data.split('\n');
      const rewritten = lines.map(line => {
        // Skip comments and empty lines
        if (!line.trim() || line.startsWith('#')) return line;
        
        // This is a URL line - rewrite it
        const absoluteUrl = makeAbsolute(baseUrl, line.trim());
        return proxyBase + encodeURIComponent(absoluteUrl);
      });
      
      data = rewritten.join('\n');
    }

    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.set('Cache-Control', 'no-cache');
    res.send(data);
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
