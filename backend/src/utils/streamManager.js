const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Store active streams
const activeStreams = new Map();

/**
 * Start FFmpeg transcoding for a stream
 * @param {string} originalUrl - The original IPTV stream URL
 * @param {string} streamId - Unique identifier for this stream
 * @returns {string} - Path to the HLS playlist
 */
function startStream(originalUrl, streamId) {
  const outputDir = path.join(__dirname, '../../streams', streamId);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Stop existing stream if any
  if (activeStreams.has(streamId)) {
    console.log(`Stopping existing stream: ${streamId}`);
    activeStreams.get(streamId).kill('SIGTERM');
    activeStreams.delete(streamId);
  }

  const outputPath = path.join(outputDir, 'playlist.m3u8');

  // FFmpeg arguments for HLS transcoding
  const ffmpegArgs = [
    '-re',                          // Read input at native frame rate
    '-i', originalUrl,              // Input URL
    '-c:v', 'libx264',              // Video codec: H.264
    '-preset', 'veryfast',          // Encoding speed (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
    '-tune', 'zerolatency',         // Tune for low latency
    '-b:v', '2000k',                // Video bitrate
    '-maxrate', '2500k',            // Max video bitrate
    '-bufsize', '4000k',            // Buffer size
    '-vf', 'scale=1280:720',        // Scale to 720p
    '-c:a', 'aac',                  // Audio codec: AAC
    '-b:a', '128k',                 // Audio bitrate
    '-ar', '48000',                 // Audio sample rate
    '-ac', '2',                     // Audio channels (stereo)
    '-f', 'hls',                    // Output format: HLS
    '-hls_time', '4',               // Segment duration (seconds)
    '-hls_list_size', '10',         // Number of segments in playlist
    '-hls_delete_threshold', '5',   // Delete segments after this many new ones
    '-hls_flags', 'delete_segments+omit_endlist', // Delete old segments, don't add end tag
    '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'), // Segment naming
    outputPath                      // Output playlist file
  ];

  console.log(`Starting FFmpeg for stream: ${streamId}`);
  console.log(`Command: ffmpeg ${ffmpegArgs.join(' ')}`);

  // Start FFmpeg process
  const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
    detached: false
  });

  // Log FFmpeg output
  ffmpeg.stdout.on('data', (data) => {
    console.log(`[FFmpeg ${streamId}] ${data}`);
  });

  ffmpeg.stderr.on('data', (data) => {
    // FFmpeg outputs to stderr even for normal operation
    const output = data.toString();
    if (output.includes('Error') || output.includes('error')) {
      console.error(`[FFmpeg ${streamId} ERROR] ${output}`);
    }
  });

  ffmpeg.on('error', (err) => {
    console.error(`[FFmpeg ${streamId}] Process error:`, err);
    activeStreams.delete(streamId);
  });

  ffmpeg.on('exit', (code, signal) => {
    console.log(`[FFmpeg ${streamId}] Exited with code ${code}, signal ${signal}`);
    activeStreams.delete(streamId);
  });

  // Store the process
  activeStreams.set(streamId, ffmpeg);
  
  // Return the public path to the playlist
  return `/streams/${streamId}/playlist.m3u8`;
}

/**
 * Stop a running stream
 * @param {string} streamId - The stream identifier
 */
function stopStream(streamId) {
  if (activeStreams.has(streamId)) {
    console.log(`Stopping stream: ${streamId}`);
    const ffmpeg = activeStreams.get(streamId);
    
    // Send SIGTERM to gracefully stop
    ffmpeg.kill('SIGTERM');
    
    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (!ffmpeg.killed) {
        console.log(`Force killing stream: ${streamId}`);
        ffmpeg.kill('SIGKILL');
      }
    }, 5000);
    
    activeStreams.delete(streamId);
    
    // Clean up stream files
    const outputDir = path.join(__dirname, '../../streams', streamId);
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    
    return true;
  }
  return false;
}

/**
 * Check if a stream is active
 * @param {string} streamId - The stream identifier
 * @returns {boolean}
 */
function isStreamActive(streamId) {
  return activeStreams.has(streamId);
}

/**
 * Get all active streams
 * @returns {Array}
 */
function getActiveStreams() {
  return Array.from(activeStreams.keys());
}

/**
 * Clean up old stream files on startup
 */
function cleanupOldStreams() {
  const streamsDir = path.join(__dirname, '../../streams');
  if (fs.existsSync(streamsDir)) {
    fs.rmSync(streamsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(streamsDir, { recursive: true });
}

// Cleanup on module load
cleanupOldStreams();

module.exports = {
  startStream,
  stopStream,
  isStreamActive,
  getActiveStreams,
  cleanupOldStreams
};
