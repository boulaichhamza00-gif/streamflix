const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const decodedUrl = decodeURIComponent(url);
    
    // Get base URL
    const lastSlash = decodedUrl.lastIndexOf('/');
    const baseUrl = lastSlash > 0 ? decodedUrl.substring(0, lastSlash + 1) : decodedUrl;
    
    // Use RELATIVE URL for proxy (fixes mixed content)
    const proxyBase = '/api/proxy/stream?url=';

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

    // Rewrite ALL URLs in the playlist to use RELATIVE proxy
    if (data.includes('#EXTM3U')) {
      const lines = data.split('\n');
      const rewritten = lines.map(line => {
        line = line.trim();
        
        // Skip comments and empty lines
        if (!line || line.startsWith('#')) return line;
        
        // Make absolute URL if relative
        let absoluteUrl;
        if (line.startsWith('http')) {
          absoluteUrl = line;
        } else if (line.startsWith('/')) {
          const urlObj = new URL(baseUrl);
          absoluteUrl = `${urlObj.protocol}//${urlObj.host}${line}`;
        } else {
          absoluteUrl = baseUrl + line;
        }
        
        // Return RELATIVE proxied URL (no http/https)
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
