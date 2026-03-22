import React from 'react';
import { Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Channel } from '@/types';

interface ChannelCardProps {
  channel: Channel;
  onPlay: (channel: Channel) => void;
  onInfo?: (channel: Channel) => void;
  variant?: 'default' | 'compact';
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onPlay,
  onInfo,
  variant = 'default'
}) => {
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay(channel);
  };

  const handleInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInfo?.(channel);
  };

  if (variant === 'compact') {
    return (
      <div
        className="group relative flex-shrink-0 w-40 cursor-pointer transition-transform duration-300 hover:scale-105"
        onClick={() => onPlay(channel)}
      >
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800">
          {channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-channel.png';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
              <span className="text-2xl font-bold text-gray-500">
                {channel.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="icon"
              className="bg-red-600 hover:bg-red-700 text-white rounded-full"
              onClick={handlePlay}
            >
              <Play className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
        </div>
        
        <p className="mt-2 text-sm text-gray-300 truncate group-hover:text-white transition-colors">
          {channel.name}
        </p>
        <p className="text-xs text-gray-500">{channel.category}</p>
      </div>
    );
  }

  return (
    <div
      className="group relative flex-shrink-0 w-56 cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10"
      onClick={() => onPlay(channel)}
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 shadow-lg">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-channel.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
            <span className="text-4xl font-bold text-gray-500">
              {channel.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Hover Controls */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            className="bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12"
            onClick={handlePlay}
          >
            <Play className="w-5 h-5 ml-0.5" />
          </Button>
          
          {onInfo && (
            <Button
              size="icon"
              variant="outline"
              className="border-white/50 text-white hover:bg-white/20 rounded-full w-10 h-10"
              onClick={handleInfo}
            >
              <Info className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Category Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
          {channel.category}
        </div>
      </div>
      
      {/* Channel Info */}
      <div className="mt-3 px-1">
        <h3 className="text-sm font-medium text-white truncate group-hover:text-red-400 transition-colors">
          {channel.name}
        </h3>
        {channel.country && (
          <p className="text-xs text-gray-500 mt-0.5">{channel.country}</p>
        )}
      </div>
    </div>
  );
};

export default ChannelCard;
