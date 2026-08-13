import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useTaskStore } from '@/store/taskStore';
import styles from './index.module.scss';

type TimeRange = 'day' | 'week' | 'week-compare';

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const tasks = useTaskStore((state) => state.tasks);
  const dailyTimeLogs = useTaskStore((state) => state.dailyTimeLogs);
  const getWeeklyDuration = useTaskStore((state) => state.getWeeklyDuration);
  const userProgress = useTaskStore((state) => state.userProgress);

  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];

  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;

  // 获取时间范围的数据
  const getEntries = () => {
    if (timeRange === 'day') {
      const log = dailyTimeLogs.find((l) => l.date === todayStr);
      return log ? log.entries : [];
    } else {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      return dailyTimeLogs
        .filter((log) => log.date >= weekAgoStr)
        .flatMap((log) => log.entries);
    }
  };

  const currentEntries = getEntries();
  const totalDuration = currentEntries.reduce((sum, entry) => sum + entry.duration, 0);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  // 获取本周和上周的起始日期
  const getWeekStart = (date: Date) => {
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  const thisWeekStart = getWeekStart(todayDate);
  const lastWeekDate = new Date(todayDate);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekStart = getWeekStart(lastWeekDate);

  const thisWeekDuration = getWeeklyDuration(thisWeekStart);
  const lastWeekDuration = getWeeklyDuration(lastWeekStart);
  const weekDiff = thisWeekDuration - lastWeekDuration;
  const weekDiffPercent = lastWeekDuration > 0
    ? Math.round((weekDiff / lastWeekDuration) * 100)
    : thisWeekDuration > 0
      ? 100
      : 0;

  // 活动统计
  const activityMap: Record<string, number> = {};
  currentEntries.forEach((entry) => {
    activityMap[entry.activity] = (activityMap[entry.activity] || 0) + entry.duration;
  });

  const activitySummary = Object.entries(activityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 周任务趋势
  const weekDaysData = useMemo(() => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const currentWeekData = userProgress.slice(-7);

    return {
      labels: days.slice(0, dayOfWeek === 0 ? 7 : dayOfWeek),
      data: currentWeekData.map((d) => d.tasksCompleted),
    };
  }, [userProgress]);

  const maxTasks = Math.max(...weekDaysData.data, 1);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>数据统计</Text>
        <Text className={styles.headerSubtitle}>查看任务完成情况和时间使用统计</Text>
      </View>

      <View className={styles.rangeToggle}>
        <View
          className={`${styles.rangeBtn} ${timeRange === 'day' ? styles.rangeBtnActive : ''}`}
          onClick={() => setTimeRange('day')}
        >
          <Text className={`${styles.rangeBtnText} ${timeRange === 'day' ? styles.rangeBtnTextActive : ''}`}>
            今日
          </Text>
        </View>
        <View
          className={`${styles.rangeBtn} ${timeRange === 'week' ? styles.rangeBtnActive : ''}`}
          onClick={() => setTimeRange('week')}
        >
          <Text className={`${styles.rangeBtnText} ${timeRange === 'week' ? styles.rangeBtnTextActive : ''}`}>
            本周
          </Text>
        </View>
        <View
          className={`${styles.rangeBtn} ${timeRange === 'week-compare' ? styles.rangeBtnActive : ''}`}
          onClick={() => setTimeRange('week-compare')}
        >
          <Text className={`${styles.rangeBtnText} ${timeRange === 'week-compare' ? styles.rangeBtnTextActive : ''}`}>
            周对比
          </Text>
        </View>
      </View>

      {timeRange === 'day' && (
        <ScrollView scrollY className={styles.contentScroll}>
          <View className={styles.statsGrid}>
            <View className={styles.statCard}>
              <View className={styles.statIconPrimary}>
                <Text className={styles.statEmoji}>📋</Text>
              </View>
              <View className={styles.statInfo}>
                <Text className={styles.statLabel}>总任务数</Text>
                <Text className={styles.statValue}>{tasks.length}</Text>
              </View>
            </View>

            <View className={styles.statCard}>
              <View className={styles.statIconSuccess}>
                <Text className={styles.statEmoji}>✅</Text>
              </View>
              <View className={styles.statInfo}>
                <Text className={styles.statLabel}>已完成</Text>
                <Text className={styles.statValue}>{completedTasks}</Text>
              </View>
            </View>

            <View className={styles.statCard}>
              <View className={styles.statIconWarning}>
                <Text className={styles.statEmoji}>⏳</Text>
              </View>
              <View className={styles.statInfo}>
                <Text className={styles.statLabel}>待处理</Text>
                <Text className={styles.statValue}>{pendingTasks}</Text>
              </View>
            </View>

            <View className={styles.statCard}>
              <View className={styles.statIconInfo}>
                <Text className={styles.statEmoji}>⏱️</Text>
              </View>
              <View className={styles.statInfo}>
                <Text className={styles.statLabel}>专注时长</Text>
                <Text className={styles.statValueSmall}>{formatDuration(totalDuration)}</Text>
              </View>
            </View>
          </View>

          <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>今日完成任务数</Text>
            <View className={styles.bigNumberCard}>
              <Text className={styles.bigNumber}>{completedTasks}</Text>
              <Text className={styles.bigNumberLabel}>个任务</Text>
            </View>
          </View>

          <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>任务状态分布</Text>
            <View className={styles.statusDistribution}>
              <View className={styles.statusItem}>
                <View className={styles.statusBar}>
                  <View
                    className={styles.statusBarFill}
                    style={{
                      width: `${(pendingTasks / Math.max(tasks.length, 1)) * 100}%`,
                      backgroundColor: '#F59E0B',
                    }}
                  />
                </View>
                <View className={styles.statusInfo}>
                  <Text className={styles.statusLabel}>待处理</Text>
                  <Text className={styles.statusCount}>{pendingTasks}</Text>
                </View>
              </View>

              <View className={styles.statusItem}>
                <View className={styles.statusBar}>
                  <View
                    className={styles.statusBarFill}
                    style={{
                      width: `${(inProgressTasks / Math.max(tasks.length, 1)) * 100}%`,
                      backgroundColor: '#3B82F6',
                    }}
                  />
                </View>
                <View className={styles.statusInfo}>
                  <Text className={styles.statusLabel}>进行中</Text>
                  <Text className={styles.statusCount}>{inProgressTasks}</Text>
                </View>
              </View>

              <View className={styles.statusItem}>
                <View className={styles.statusBar}>
                  <View
                    className={styles.statusBarFill}
                    style={{
                      width: `${(completedTasks / Math.max(tasks.length, 1)) * 100}%`,
                      backgroundColor: '#10B981',
                    }}
                  />
                </View>
                <View className={styles.statusInfo}>
                  <Text className={styles.statusLabel}>已完成</Text>
                  <Text className={styles.statusCount}>{completedTasks}</Text>
                </View>
              </View>
            </View>
          </View>

          <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>今日时间记录</Text>
            {currentEntries.length === 0 ? (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>⏱️</Text>
                <Text className={styles.emptyText}>暂无时间记录</Text>
                <Text className={styles.emptyHint}>开始工作后会自动记录你的时间使用</Text>
              </View>
            ) : (
              <View className={styles.entryList}>
                {currentEntries.map((entry, index) => (
                  <View key={index} className={styles.entryItem}>
                    <View className={styles.entryIcon}>
                      <Text className={styles.entryIconText}>⏱</Text>
                    </View>
                    <View className={styles.entryInfo}>
                      <Text className={styles.entryTitle}>{entry.activity}</Text>
                      <Text className={styles.entryTime}>
                        {entry.startTime} - {entry.endTime}
                      </Text>
                    </View>
                    <Text className={styles.entryDuration}>{formatDuration(entry.duration)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {timeRange === 'week' && (
        <ScrollView scrollY className={styles.contentScroll}>
          <View className={styles.statsGrid}>
            <View className={styles.statCard}>
              <View className={styles.statIconPrimary}>
                <Text className={styles.statEmoji}>📋</Text>
              </View>
              <View className={styles.statInfo}>
                <Text className={styles.statLabel}>总任务数</Text>
                <Text className={styles.statValue}>{tasks.length}</Text>
              </View>
            </View>

            <View className={styles.statCard}>
              <View className={styles.statIconSuccess}>
                <Text className={styles.statEmoji}>✅</Text>
              </View>
              <View className={styles.statInfo}>
                <Text className={styles.statLabel}>已完成</Text>
                <Text className={styles.statValue}>{completedTasks}</Text>
              </View>
            </View>

            <View className={styles.statCard}>
              <View className={styles.statIconWarning}>
                <Text className={styles.statEmoji}>⏳</Text>
              </View>
              <View className={styles.statInfo}>
                <Text className={styles.statLabel}>待处理</Text>
                <Text className={styles.statValue}>{pendingTasks}</Text>
              </View>
            </View>

            <View className={styles.statCard}>
              <View className={styles.statIconInfo}>
                <Text className={styles.statEmoji}>⏱️</Text>
              </View>
              <View className={styles.statInfo}>
                <Text className={styles.statLabel}>周专注时长</Text>
                <Text className={styles.statValueSmall}>{formatDuration(thisWeekDuration)}</Text>
              </View>
            </View>
          </View>

          <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>每日完成任务趋势</Text>
            <View className={styles.trendChart}>
              {weekDaysData.data.map((count, index) => (
                <View key={index} className={styles.trendBar}>
                  <View className={styles.trendBarFill} style={{ height: `${(count / maxTasks) * 100}%` }}>
                    <Text className={styles.trendBarValue}>{count}</Text>
                  </View>
                  <Text className={styles.trendBarLabel}>{weekDaysData.labels[index]}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>任务时长分布</Text>
            {activitySummary.length === 0 ? (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📊</Text>
                <Text className={styles.emptyText}>暂无时间记录</Text>
                <Text className={styles.emptyHint}>开始工作后会自动记录你的时间使用</Text>
              </View>
            ) : (
              <View className={styles.activityList}>
                {activitySummary.map(([activity, duration], index) => (
                  <View key={index} className={styles.activityItem}>
                    <View
                      className={styles.activityColor}
                      style={{
                        backgroundColor: ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'][index % 5],
                      }}
                    />
                    <Text className={styles.activityLabel}>{activity}</Text>
                    <Text className={styles.activityDuration}>{formatDuration(duration)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {timeRange === 'week-compare' && (
        <ScrollView scrollY className={styles.contentScroll}>
          <View className={styles.compareGrid}>
            <View className={styles.compareCard}>
              <View className={styles.compareIconPrimary}>
                <Text className={styles.compareEmoji}>📅</Text>
              </View>
              <Text className={styles.compareLabel}>上周工作时长</Text>
              <Text className={styles.compareValuePrimary}>{formatDuration(lastWeekDuration)}</Text>
            </View>

            <View className={styles.compareCard}>
              <View className={styles.compareIconSuccess}>
                <Text className={styles.compareEmoji}>⏱️</Text>
              </View>
              <Text className={styles.compareLabel}>本周工作时长</Text>
              <Text className={styles.compareValueSuccess}>{formatDuration(thisWeekDuration)}</Text>
            </View>

            <View className={styles.compareCard}>
              <View className={weekDiff >= 0 ? styles.compareIconSuccess : styles.compareIconDanger}>
                <Text className={styles.compareEmoji}>{weekDiff >= 0 ? '📈' : '📉'}</Text>
              </View>
              <Text className={styles.compareLabel}>变化</Text>
              <Text className={weekDiff >= 0 ? styles.compareValueSuccess : styles.compareValueDanger}>
                {weekDiff >= 0 ? '+' : ''}{weekDiffPercent}%
              </Text>
            </View>
          </View>

          <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>本周与上周对比</Text>
            <View className={styles.compareBarChart}>
              <View className={styles.compareBar}>
                <Text className={styles.compareBarLabel}>上周</Text>
                <View className={styles.compareBarTrack}>
                  <View
                    className={styles.compareBarFill}
                    style={{
                      width: `${(lastWeekDuration / Math.max(thisWeekDuration, lastWeekDuration, 1)) * 100}%`,
                      backgroundColor: '#3B82F6',
                    }}
                  />
                </View>
                <Text className={styles.compareBarValue}>{formatDuration(lastWeekDuration)}</Text>
              </View>

              <View className={styles.compareBar}>
                <Text className={styles.compareBarLabel}>本周</Text>
                <View className={styles.compareBarTrack}>
                  <View
                    className={styles.compareBarFill}
                    style={{
                      width: `${(thisWeekDuration / Math.max(thisWeekDuration, lastWeekDuration, 1)) * 100}%`,
                      backgroundColor: '#10B981',
                    }}
                  />
                </View>
                <Text className={styles.compareBarValue}>{formatDuration(thisWeekDuration)}</Text>
              </View>
            </View>
          </View>

          <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>每日完成任务趋势</Text>
            <View className={styles.trendChart}>
              {weekDaysData.data.map((count, index) => (
                <View key={index} className={styles.trendBar}>
                  <View className={styles.trendBarFill} style={{ height: `${(count / maxTasks) * 100}%` }}>
                    <Text className={styles.trendBarValue}>{count}</Text>
                  </View>
                  <Text className={styles.trendBarLabel}>{weekDaysData.labels[index]}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default AnalyticsPage;