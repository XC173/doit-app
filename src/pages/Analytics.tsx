import { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { TrendingUp, Calendar, Target, Clock, ArrowDown, ArrowUp, Heart, ThumbsUp } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import type { TimeEntry } from '@/types';
import { selfForgivenessContent, encouragementContent } from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend);

type TimeRange = 'day' | 'week' | 'week-compare';

export function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const userProgress = useTaskStore((state) => state.userProgress);
  const tasks = useTaskStore((state) => state.tasks);
  const dailyTimeLogs = useTaskStore((state) => state.dailyTimeLogs);
  const getWeeklyDuration = useTaskStore((state) => state.getWeeklyDuration);

  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;

  const doughnutData = {
    labels: ['待处理', '进行中', '已完成'],
    datasets: [
      {
        data: [pendingTasks, inProgressTasks, completedTasks],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
        borderWidth: 0,
        cutout: '65%',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
  };

  interface TimeEntryWithDate extends TimeEntry {
    date?: string;
  }
  
  const getAllEntries = (): TimeEntryWithDate[] => {
    if (timeRange === 'day') {
      const today = new Date().toISOString().split('T')[0];
      const log = dailyTimeLogs.find((l) => l.date === today);
      return log ? log.entries.map((entry) => ({ ...entry, date: log.date })) : [];
    } else {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      return dailyTimeLogs
        .filter((log) => log.date >= weekAgoStr)
        .flatMap((log) => log.entries.map((entry) => ({ ...entry, date: log.date })));
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const currentEntries: TimeEntryWithDate[] = getAllEntries();
  const totalDuration = currentEntries.reduce((sum, entry) => sum + entry.duration, 0);

  const getThisWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const getLastWeekStart = () => {
    const thisWeekStart = new Date(getThisWeekStart());
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    return thisWeekStart.toISOString().split('T')[0];
  };

  const thisWeekDuration = getWeeklyDuration(getThisWeekStart());
  const lastWeekDuration = getWeeklyDuration(getLastWeekStart());
  const weekDiff = thisWeekDuration - lastWeekDuration;
  const weekDiffPercent = lastWeekDuration > 0 ? Math.round((weekDiff / lastWeekDuration) * 100) : 0;
  const showSelfForgiveness = weekDiff < 0;
  const showEncouragement = weekDiff >= 0;

  const randomSelfForgiveness = selfForgivenessContent[Math.floor(Math.random() * selfForgivenessContent.length)];
  const randomEncouragement = encouragementContent[Math.floor(Math.random() * encouragementContent.length)];

  const getWeekDaysData = () => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const currentWeekData = userProgress.slice(-7);
    
    return {
      labels: days.slice(0, dayOfWeek === 0 ? 7 : dayOfWeek),
      data: currentWeekData.map(d => d.tasksCompleted),
    };
  };

  const weekDaysData = getWeekDaysData();

  const weeklyTaskTrendData = {
    labels: weekDaysData.labels,
    datasets: [
      {
        label: '完成任务数',
        data: weekDaysData.data,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const getActivitySummary = () => {
    const activityMap: { [key: string]: number } = {};
    currentEntries.forEach(entry => {
      activityMap[entry.activity] = (activityMap[entry.activity] || 0) + entry.duration;
    });
    return Object.entries(activityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const activitySummary = getActivitySummary();

  const activityChartData = {
    labels: activitySummary.map(a => a[0]),
    datasets: [
      {
        label: '时长(分钟)',
        data: activitySummary.map(a => a[1]),
        backgroundColor: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
        borderRadius: 8,
      },
    ],
  };

  const weekCompareChartData = {
    labels: ['上周', '本周'],
    datasets: [
      {
        label: '工作时长(分钟)',
        data: [lastWeekDuration, thisWeekDuration],
        backgroundColor: ['#3b82f6', '#10b981'],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const renderDailyView = () => (
    <>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总任务数</p>
              <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">完成任务数</p>
              <p className="text-2xl font-bold text-gray-800">{completedTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待处理</p>
              <p className="text-2xl font-bold text-gray-800">{pendingTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">专注时长</p>
              <p className="text-2xl font-bold text-gray-800">{formatDuration(totalDuration)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">今日完成任务数</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <p className="text-6xl font-bold text-primary">{completedTasks}</p>
              <p className="text-gray-500 mt-2">个任务</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">任务状态分布</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="font-semibold text-gray-800 mb-4">今日时间记录</h3>
        {currentEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">暂无时间记录</p>
            <p className="text-sm text-gray-400 mt-1">开始工作后会自动记录你的时间使用</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentEntries.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Clock size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{entry.activity}</p>
                    <p className="text-sm text-gray-500">
                      {entry.date && `${entry.date} `}{entry.startTime} - {entry.endTime}
                    </p>
                  </div>
                </div>
                <span className="text-primary font-bold">{formatDuration(entry.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderWeeklyView = () => (
    <>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总任务数</p>
              <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">完成任务数</p>
              <p className="text-2xl font-bold text-gray-800">{completedTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待处理</p>
              <p className="text-2xl font-bold text-gray-800">{pendingTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">周专注时长</p>
              <p className="text-2xl font-bold text-gray-800">{formatDuration(thisWeekDuration)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">每日完成任务趋势</h3>
          <div className="h-64">
            <Line data={weeklyTaskTrendData} options={chartOptions} />
          </div>
        </div>
        
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">任务时长分布</h3>
          <div className="h-64">
            <Bar data={activityChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">任务时长概览</h3>
        {activitySummary.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">暂无时间记录</p>
            <p className="text-sm text-gray-400 mt-1">开始工作后会自动记录你的时间使用</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activitySummary.map(([activity, duration], index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'][index % 5] }}>
                    <Clock size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{activity}</p>
                  </div>
                </div>
                <span className="text-primary font-bold">{formatDuration(duration)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderWeekCompareView = () => (
    <>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">上周工作时长</p>
              <p className="text-2xl font-bold text-blue-600">{formatDuration(lastWeekDuration)}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">本周工作时长</p>
              <p className="text-2xl font-bold text-green-600">{formatDuration(thisWeekDuration)}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${weekDiff >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {weekDiff >= 0 ? (
                <ArrowUp className={`w-6 h-6 text-green-600`} />
              ) : (
                <ArrowDown className={`w-6 h-6 text-red-600`} />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">变化</p>
              <p className={`text-2xl font-bold ${weekDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {weekDiff >= 0 ? '+' : ''}{weekDiffPercent}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">本周与上周对比</h3>
        <div className="h-64">
          <Bar data={weekCompareChartData} options={barChartOptions} />
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">每周完成任务趋势</h3>
        <div className="h-64">
          <Line data={weeklyTaskTrendData} options={chartOptions} />
        </div>
      </div>

      {(showSelfForgiveness || showEncouragement) && (
        <div className={`p-6 rounded-xl border ${
          showSelfForgiveness 
            ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200' 
            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {showSelfForgiveness ? (
              <Heart className="w-5 h-5 text-pink-500" />
            ) : (
              <ThumbsUp className="w-5 h-5 text-green-500" />
            )}
            <h4 className="font-semibold text-gray-800">
              {showSelfForgiveness ? '自我宽恕' : '继续加油'}
            </h4>
          </div>
          <p className="text-gray-600">
            {showSelfForgiveness ? randomSelfForgiveness : randomEncouragement}
          </p>
        </div>
      )}
    </>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">数据统计</h1>
          <p className="text-gray-500 mt-1">查看你的任务完成情况和时间使用统计</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeRange === 'day'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            今日
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeRange === 'week'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            本周
          </button>
          <button
            onClick={() => setTimeRange('week-compare')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeRange === 'week-compare'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            周对比
          </button>
        </div>
      </div>

      {timeRange === 'day' && renderDailyView()}
      {timeRange === 'week' && renderWeeklyView()}
      {timeRange === 'week-compare' && renderWeekCompareView()}
    </div>
  );
}
