import React from 'react';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { BarChartCard } from '../components/BarChartCard';
import { LineChartCard } from '../components/LineChartCard';
import { BookOpen, Clock, Flame, Plus, ArrowRight } from 'lucide-react';
import { listeningSessionsData, sleepScoreData } from '../data/mock';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { activeChild } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page header with active-child context */}
      {activeChild && (
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: activeChild.avatar_color }}
          >
            {activeChild.name[0].toUpperCase()}
          </span>
          <p className="text-sm text-gray-500">
            Showing stats for <span className="font-semibold text-gray-700">{activeChild.name}</span>
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Tonight's Stories"
          value="5"
          icon={BookOpen}
          trend="+2 from yesterday"
        />
        <StatCard
          title="Minutes Listened"
          value="47"
          icon={Clock}
          trend="This week"
        />
        <StatCard
          title="Sleep Streak"
          value="12"
          icon={Flame}
          trend="Days in a row"
        />
        <StatCard
          title="New Stories Added"
          value="3"
          icon={Plus}
          trend="This month"
        />
      </div>

      {/* Hero Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Welcome Card */}
        <Card className="p-8">
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Welcome to HushTales
            </h2>
            <p className="text-gray-600 mb-6 flex-1">
              Create magical bedtime moments with our collection of calming stories. 
              Each tale is carefully crafted to help your little ones drift peacefully 
              into dreamland. Choose from adventures, nature stories, or gentle fantasy 
              worlds designed to soothe and inspire.
            </p>
            <button className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium transition-colors self-start">
              Explore Stories
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>

        {/* Tonight's Calm Mode Card */}
        <Card className="relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-indigo-900"
            style={{
              backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)'
            }}
          />
          <div className="relative p-8 text-white h-full flex flex-col">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                Featured
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-3">
              Tonight's Calm Mode
            </h2>
            <p className="text-white/80 mb-6 flex-1">
              Experience our specially curated sleep mode with gentle background sounds, 
              dimmed visuals, and stories selected for maximum relaxation. Perfect for 
              winding down after a busy day.
            </p>
            <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-navy font-medium rounded-lg hover:bg-white/90 transition-colors self-start">
              Start Calm Mode
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Listening Sessions (Last 7 days)"
          data={listeningSessionsData}
          dataKey="sessions"
          xAxisKey="day"
        />
        <LineChartCard
          title="Sleep Calm Score (Last 30 days)"
          data={sleepScoreData}
        />
      </div>
    </div>
  );
};
