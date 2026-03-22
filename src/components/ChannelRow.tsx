import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChannelCard from './ChannelCard';
import type { Channel } from '@/types';

interface ChannelRowProps {
  title: string;
  channels: Channel[];
  onPlayChannel: (channel: Channel) => void;
}

const ChannelRow: React.FC<ChannelRowProps> = ({ title, channels, onPlayChannel }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (channels.length === 0) return null;

  return (
    <div className="py-6 group/row">
      {/* Row Header */}
      <div className="flex items-center justify-between px-4 md:px-12 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-white">{title}</h2>
        <Button
          variant="ghost"
          className="text-sm text-gray-400 hover:text-white opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          View All
        </Button>
      </div>

      {/* Channel Slider */}
      <div className="relative">
        {/* Left Arrow */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-none h-full w-12 opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>

        {/* Channels Container */}
        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {channels.map((channel) => (
            <ChannelCard
              key={channel._id}
              channel={channel}
              onPlay={onPlayChannel}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-none h-full w-12 opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
};

export default ChannelRow;
