import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChannels } from '@/hooks/useChannels';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import ChannelRow from '@/components/ChannelRow';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Play, Info, Loader2 } from 'lucide-react';
import type { Channel } from '@/types';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { channels, isLoading, error, fetchChannels } = useChannels();
  const [searchParams] = useSearchParams();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [featuredChannel, setFeaturedChannel] = useState<Channel | null>(null);

  // Get search and category from URL
  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';

  useEffect(() => {
    fetchChannels({
      search: searchQuery || undefined,
      category: categoryFilter || undefined
    });
  }, [searchQuery, categoryFilter, fetchChannels]);

  // Set a random featured channel
  useEffect(() => {
    if (channels.length > 0 && !featuredChannel) {
      const randomIndex = Math.floor(Math.random() * Math.min(5, channels.length));
      setFeaturedChannel(channels[randomIndex]);
    }
  }, [channels, featuredChannel]);

  // Group channels by category
  const channelsByCategory = channels.reduce((acc, channel) => {
    const cat = channel.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(channel);
    return acc;
  }, {} as Record<string, Channel[]>);

  const handlePlayChannel = (channel: Channel) => {
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return;
    }
    
    // Check subscription
    if (!user?.hasValidSubscription && !user?.isAdmin) {
      // Show subscription required modal
      return;
    }
    
    setSelectedChannel(channel);
  };

  const closePlayer = () => {
    setSelectedChannel(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <Button onClick={() => fetchChannels()} className="bg-red-600 hover:bg-red-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* Hero Section */}
      {!searchQuery && !categoryFilter && featuredChannel && (
        <div className="relative h-[70vh] w-full">
          {/* Background Image/Gradient */}
          <div className="absolute inset-0">
            {featuredChannel.logo ? (
              <img
                src={featuredChannel.logo}
                alt={featuredChannel.name}
                className="w-full h-full object-cover opacity-40"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative h-full flex items-end pb-20 px-4 md:px-12">
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded mb-4">
                FEATURED
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                {featuredChannel.name}
              </h1>
              <p className="text-gray-300 text-lg mb-2">
                {featuredChannel.category}
              </p>
              {featuredChannel.description && (
                <p className="text-gray-400 mb-6 line-clamp-2">
                  {featuredChannel.description}
                </p>
              )}
              <div className="flex gap-4">
                <Button
                  size="lg"
                  onClick={() => handlePlayChannel(featuredChannel)}
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Play Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-500 text-white hover:bg-white/10 px-8"
                >
                  <Info className="w-5 h-5 mr-2" />
                  More Info
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Title for Search/Category */}
      {(searchQuery || categoryFilter) && (
        <div className="pt-24 pb-8 px-4 md:px-12">
          <h1 className="text-3xl font-bold text-white">
            {searchQuery ? `Search: "${searchQuery}"` : categoryFilter}
          </h1>
          <p className="text-gray-400 mt-2">{channels.length} channels found</p>
        </div>
      )}

      {/* Channel Rows */}
      <div className={`${searchQuery || categoryFilter ? 'pt-4' : '-mt-10'} relative z-10`}>
        {searchQuery || categoryFilter ? (
          // Grid view for search results
          <div className="px-4 md:px-12 pb-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {channels.map((channel) => (
                <div
                  key={channel._id}
                  onClick={() => handlePlayChannel(channel)}
                  className="cursor-pointer group"
                >
                  <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
                    {channel.logo ? (
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                        <span className="text-2xl font-bold text-gray-500">
                          {channel.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-300 truncate group-hover:text-white">
                    {channel.name}
                  </p>
                  <p className="text-xs text-gray-500">{channel.category}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Row view for homepage
          Object.entries(channelsByCategory).map(([category, categoryChannels]) => (
            <ChannelRow
              key={category}
              title={category}
              channels={categoryChannels}
              onPlayChannel={handlePlayChannel}
            />
          ))
        )}
      </div>

      {/* Empty State */}
      {channels.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-400 text-lg">No channels found</p>
          <Button
            onClick={() => fetchChannels()}
            variant="outline"
            className="mt-4 border-gray-600 text-gray-300"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedChannel && (
        <VideoPlayer
          channel={selectedChannel}
          onClose={closePlayer}
        />
      )}
    </div>
  );
};

export default Home;
