import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize, Minimize, Volume2, VolumeX, Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import Hls from 'hls.js';
import axios from 'axios';
import type { Channel } from '@/types';

interface VideoPlayerProps {
  channel: Channel;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingStream, setIsStartingStream] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start FFmpeg transcoding when component mounts
  useEffect(() => {
    const startStream = async () => {
      try {
        setIsStartingStream(true);
        setError(null);
        
        // Call API to start FFmpeg transcoding
        const response = await axios.post('/api/streams/start', {
          url: channel.streamUrl,
          channelId: channel._id
        });
        
        if (response.data.success) {
          const { proxyUrl } = response.data.data;
          console.log('Stream started:', proxyUrl);
          setStreamUrl(proxyUrl);
        } else {
          setError('Failed to start stream');
        }
      } catch (err: any) {
        console.error('Start stream error:', err);
        setError(err.response?.data?.message || 'Failed to start stream');
      } finally {
        setIsStartingStream(false);
      }
    };
    
    startStream();
    
    // Cleanup: stop stream when component unmounts
    return () => {
      if (channel._id) {
        axios.post('/api/streams/stop', {
          streamId: channel.streamUrl // or use the actual streamId
        }).catch(console.error);
      }
    };
  }, [channel.streamUrl, channel._id]);

  // Setup HLS player when stream URL is ready
  useEffect(() => {
    if (!streamUrl) return;
    
    const video = videoRef.current;
    if (!video) return;

    // Wait a moment for FFmpeg to generate first segments
    const setupDelay = setTimeout(() => {
      console.log('Setting up HLS player with URL:', streamUrl);
      
      if (Hls.isSupported()) {
        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
        });
        
        hlsRef.current = hls;
        
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log('HLS media attached');
          hls.loadSource(streamUrl);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed');
          setIsLoading(false);
          video.play().catch((e) => {
            console.log('Autoplay blocked:', e);
          });
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('HLS Error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, retrying...');
                setTimeout(() => hls.startLoad(), 2000);
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, recovering...');
                hls.recoverMediaError();
                break;
              default:
                setError('Unable to play this stream.');
                hls.destroy();
                break;
            }
          }
        });

        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          video.play().catch(() => {});
        });
        video.addEventListener('error', () => {
          setError('Unable to play this stream.');
        });
      } else {
        setError('HLS not supported in this browser.');
      }
    }, 3000); // Wait 3 seconds for FFmpeg to start
    
    return () => {
      clearTimeout(setupDelay);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // Handle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen?.().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  // Handle mouse movement for controls visibility
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Update playing state when video events fire
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onMouseMove={handleMouseMove}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {/* Starting Stream Spinner */}
      {isStartingStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <Loader2 className="w-16 h-16 text-red-600 animate-spin mb-4" />
          <p className="text-white text-lg">Starting stream...</p>
          <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
        </div>
      )}

      {/* Loading Spinner */}
      {!isStartingStream && isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center p-8">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <Button onClick={onClose} variant="outline">
              Close Player
            </Button>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {!isStartingStream && (
        <div
          className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Top Bar */}
          <div className="bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {channel.logo && (
                  <img
                    src={channel.logo}
                    alt={channel.name}
                    className="w-12 h-12 object-contain rounded"
                  />
                )}
                <div>
                  <h2 className="text-white text-lg font-semibold">{channel.name}</h2>
                  <p className="text-gray-400 text-sm">{channel.category}</p>
                  {streamUrl && (
                    <p className="text-green-400 text-xs">Stream active</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Center Play Button (when paused) */}
          {!isPlaying && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="icon"
                onClick={togglePlay}
                className="w-20 h-20 bg-red-600/90 hover:bg-red-700 text-white rounded-full"
              >
                <Play className="w-10 h-10 ml-1" />
              </Button>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="w-24"
                />
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
