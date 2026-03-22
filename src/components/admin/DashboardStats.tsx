import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Tv, ListMusic, CreditCard, TrendingUp, Activity } from 'lucide-react';
import type { AdminStats } from '@/types';

interface DashboardStatsProps {
  stats: AdminStats | null;
  isLoading: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-800 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total,
      subtitle: `${stats.users.active} active`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Total Channels',
      value: stats.channels.total,
      subtitle: `${stats.channels.active} active`,
      icon: Tv,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Playlists',
      value: stats.playlists,
      subtitle: 'Total playlists',
      icon: ListMusic,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Premium Users',
      value: stats.subscriptions.premium,
      subtitle: 'Paying customers',
      icon: CreditCard,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400">{card.title}</p>
                  <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Subscription Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Premium', value: stats.subscriptions.premium, color: 'bg-yellow-500' },
                { label: 'Basic', value: stats.subscriptions.basic, color: 'bg-blue-500' },
                { label: 'None', value: stats.subscriptions.none, color: 'bg-gray-500' },
                { label: 'Expired', value: stats.subscriptions.expired, color: 'bg-red-500' }
              ].map((item) => {
                const total = stats.users.total || 1;
                const percentage = Math.round((item.value / total) * 100);
                
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{item.label}</span>
                      <span className="text-gray-400">{item.value} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">Active Channels</span>
                <span className="text-green-400 font-semibold">
                  {Math.round((stats.channels.active / (stats.channels.total || 1)) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">Active Users</span>
                <span className="text-green-400 font-semibold">
                  {Math.round((stats.users.active / (stats.users.total || 1)) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">Premium Conversion</span>
                <span className="text-yellow-400 font-semibold">
                  {Math.round((stats.subscriptions.premium / (stats.users.total || 1)) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
