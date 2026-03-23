const express = require('express');
const router = express.Router();
const { startStream, stopStream, isStreamActive, getActiveStreams } = require('../utils/streamManager');
const crypto = require('crypto');

// Store stream mappings
const streamMappings = new Map();

/**
 * @route   POST /api/streams/start
 * @desc    Start transcoding a stream
 * @access  Private (requires subscription)
 */
router.post('/start', async (req, res) => {
  try {
    const { url, channelId } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Stream URL is required'
      });
    }

    // Generate unique stream ID based on URL
    const streamId = crypto.createHash('md5').update(url).digest('hex').substring(0, 16);
    
    // Check if already running
    if (isStreamActive(streamId)) {
      return res.json({
        success: true,
        message: 'Stream already active',
        data: {
          streamId,
          playlistUrl: `/streams/${streamId}/playlist.m3u8`,
          proxyUrl: `/api/streams/${streamId}/playlist.m3u8`
        }
      });
    }

    // Start the stream
    const playlistPath = startStream(url, streamId);
    
    // Store mapping
    streamMappings.set(streamId, {
      originalUrl: url,
      channelId,
      startedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Stream started successfully',
      data: {
        streamId,
        playlistUrl: playlistPath,
        proxyUrl: `/api/streams/${streamId}/playlist.m3u8`
      }
    });

  } catch (error) {
    console.error('Start stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start stream',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/streams/stop
 * @desc    Stop a transcoding stream
 * @access  Private
 */
router.post('/stop', (req, res) => {
  try {
    const { streamId } = req.body;
    
    if (!streamId) {
      return res.status(400).json({
        success: false,
        message: 'Stream ID is required'
      });
    }

    const stopped = stopStream(streamId);
    streamMappings.delete(streamId);

    res.json({
      success: true,
      message: stopped ? 'Stream stopped' : 'Stream was not active',
      data: { streamId }
    });

  } catch (error) {
    console.error('Stop stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop stream'
    });
  }
});

/**
 * @route   GET /api/streams/active
 * @desc    Get list of active streams
 * @access  Private
 */
router.get('/active', (req, res) => {
  const active = getActiveStreams().map(id => ({
    streamId: id,
    ...streamMappings.get(id)
  }));

  res.json({
    success: true,
    data: { streams: active }
  });
});

/**
 * @route   GET /api/streams/:streamId/playlist.m3u8
 * @desc    Proxy HLS playlist (for CORS)
 * @access  Public
 */
router.get('/:streamId/playlist.m3u8', async (req, res) => {
  try {
    const { streamId } = req.params;
    const fs = require('fs');
    const path = require('path');
    
    const playlistPath = path.join(__dirname, '../../streams', streamId, 'playlist.m3u8');
    
    // Wait for file to exist (max 10 seconds)
    let attempts = 0;
    while (!fs.existsSync(playlistPath) && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (!fs.existsSync(playlistPath)) {
      return res.status(404).json({
        success: false,
        message: 'Stream not ready yet'
      });
    }

    // Read and modify playlist to use proxy URLs
    let playlist = fs.readFileSync(playlistPath, 'utf8');
    
    // Replace segment URLs with proxy URLs
    playlist = playlist.replace(/segment_(\d+)\.ts/g, (match, num) => {
      return `/api/streams/${streamId}/segment/${num}`;
    });

    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.set('Cache-Control', 'no-cache');
    res.send(playlist);

  } catch (error) {
    console.error('Playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get playlist'
    });
  }
});

/**
 * @route   GET /api/streams/:streamId/segment/:segmentNum
 * @desc    Proxy TS segment (for CORS)
 * @access  Public
 */
router.get('/:streamId/segment/:segmentNum', (req, res) => {
  try {
    const { streamId, segmentNum } = req.params;
    const fs = require('fs');
    const path = require('path');
    
    const segmentPath = path.join(__dirname, '../../streams', streamId, `segment_${segmentNum}.ts`);
    
    if (!fs.existsSync(segmentPath)) {
      return res.status(404).json({
        success: false,
        message: 'Segment not found'
      });
    }

    res.set('Content-Type', 'video/mp2t');
    res.set('Cache-Control', 'no-cache');
    
    const stream = fs.createReadStream(segmentPath);
    stream.pipe(res);

  } catch (error) {
    console.error('Segment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get segment'
    });
  }
});

module.exports = router;
