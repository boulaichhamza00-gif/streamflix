const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const decodedUrl = decodeURIComponent(url);
    const isM3U8 = decodedUrl.includes('.m3u8');
    const isTS = decodedUrl.includes('.ts');

    // For binary files (.ts), stream directly without processing
    if (isTS) {
      const response = await axios({
        method: 'get',
        url: decodedUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18'
        },
        timeout: 30000,
        maxRedirects: 10
      });

      res.set('Content-Type', 'video/mp2t');
      res.set('Cache-Control', 'no-cache');
      response.data.pipe(res);
      return;
    }

    // For M3U8 playlists, fetch as text and rewrite URLs
    const response = await axios({
      method: 'get',
      url: decodedUrl,
      responseType: 'text',
      headers: {
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18'
      },
      timeout: 30000,
      maxRedirects: 10
    });

    let data = response.data;

    // Rewrite URLs in M3U8
    if (isM3U8 || data.includes('#EXTM3U')) {
      const lastSlash = decodedUrl.lastIndexOf('/');
      const baseUrl = lastSlash > 0 ? decodedUrl.substring(0, lastSlash + 1) : decodedUrl;
      const proxyBase = '/api/proxy/stream?url=';

      const lines = data.split('\n');
      const rewritten = lines.map(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return line;
        
        let absoluteUrl;
        if (line.startsWith('http')) {
          absoluteUrl = line;
        } else if (line.startsWith('/')) {
          const urlObj = new URL(baseUrl);
          absoluteUrl = `${urlObj.protocol}//${urlObj.host}${line}`;
        } else {
          absoluteUrl = baseUrl + line;
        }
        
        return proxyBase + encodeURIComponent(absoluteUrl);
      });
      
      data = rewritten.join('\n');
    }

    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.set('Cache-Control', 'no-cache');
    res.send(data);
    
  } catch (error) {
    console.error('Proxy error:', error.message, 'URL:', req.query.url);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
