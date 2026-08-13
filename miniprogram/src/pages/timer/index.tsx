import React, { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useTaskStore } from '@/store/taskStore';
import { selfForgivenessContent, encouragementContent } from '@/types';
import styles from './index.module.scss';

type TimeRange = 'today' | 'week';

const GRADIENT_COLORS = [
  'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
  'linear-gradient(135deg, #EF4444 0%, #EC4899 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
  'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
];

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

const getWeekStart = (date: Date) => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

const TimerPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  
  const dailyTimeLogs = useTaskStore((state) => state.dailyTimeLogs);
  const getWeeklyDuration = useTaskStore((state) => state.getWeeklyDuration);
  const mockData = useTaskStore((state) => state.mockData);

  useEffect(() => {
    mockData();
  }, [mockData]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayLogs = dailyTimeLogs.find((log) => log.date === todayStr);
  const todayEntries = todayLogs
    ? [...todayLogs.entries].sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];
  const todayTotalDuration = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);

  // Week data
  const thisWeekStart = getWeekStart(today);
  const lastWeekDate = new Date(today);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekStart = getWeekStart(lastWeekDate);
  
  const thisWeekDuration = getWeeklyDuration(thisWeekStart);
  const lastWeekDuration = getWeeklyDuration(lastWeekStart);
  const weekDiff = thisWeekDuration - lastWeekDuration;
  const weekDiffPercent = lastWeekDuration > 0
    ? Math.round((weekDiff / lastWeekDuration) * 100)
    : thisWeekDuration > 0 ? 100 : 0;

  // Get all entries for this week
  const weekEnd = new Date(thisWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  
  const weekEntries = dailyTimeLogs
    .filter((log) => log.date >= thisWeekStart && log.date < weekEndStr)
    .flatMap((log) => log.entries.map((e) => ({ ...e, date: log.date })))
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

  // Current display data based on toggle
  const currentEntries = timeRange === 'today' ? todayEntries : weekEntries;
  const currentDuration = timeRange === 'today' ? todayTotalDuration : thisWeekDuration;
  const entryCount = currentEntries.length;

  const getPositionAndWidth = (entry: { startTime: string; endTime: string }) => {
    const startParts = entry.startTime.split(':').map(Number);
    const endParts = entry.endTime.split(':').map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];

    const left = (startMinutes / 1440) * 100;
    const width = ((endMinutes - startMinutes) / 1440) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 1.5)}%` };
  };

  const getTimeLabels = () => {
    const labels: string[] = [];
    for (let i = 0; i <= 24; i += 2) {
      labels.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return labels;
  };

  const handleAddRecord = () => {
    Taro.navigateTo({ url: '/pages/task-add/index' });
  };

  const showSelfForgiveness = weekDiff < 0;
  const showEncouragement = weekDiff >= 0;

  const getRandomFromArray = (arr: string[]) => {
    if (arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View>
          <Text className={styles.headerTitle}>事件记录</Text>
          <Text className={styles.headerSubtitle}>记录和管理您的时间使用</Text>
        </View>
        <View className={styles.addBtn} onClick={handleAddRecord}>
          <Text className={styles.addBtnIcon}>+</Text>
          <Text className={styles.addBtnText}>添加记录</Text>
        </View>
      </View>

      {/* Time Range Toggle */}
      <View className={styles.rangeToggle}>
        <View
          className={`${styles.rangeBtn} ${timeRange === 'today' ? styles.rangeBtnActive : ''}`}
          onClick={() => setTimeRange('today')}
        >
          <Text className={timeRange === 'today' ? styles.rangeBtnTextActive : styles.rangeBtnText}>今日</Text>
        </View>
        <View
          className={`${styles.rangeBtn} ${timeRange === 'week' ? styles.rangeBtnActive : ''}`}
          onClick={() => setTimeRange('week')}
        >
          <Text className={timeRange === 'week' ? styles.rangeBtnTextActive : styles.rangeBtnText}>本周</Text>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <View className={`${styles.statIcon} ${styles.statIconPrimary}`}>
            <Text className={styles.statEmoji}>⏱</Text>
          </View>
          <View className={styles.statInfo}>
            <Text className={styles.statLabel}>{timeRange === 'today' ? '今日工作时长' : '本周工作时长'}</Text>
            <Text className={styles.statValue}>{formatDuration(currentDuration)}</Text>
          </View>
        </View>
        <View className={styles.statCard}>
          <View className={`${styles.statIcon} ${styles.statIconSecondary}`}>
            <Text className={styles.statEmoji}>📋</Text>
          </View>
          <View className={styles.statInfo}>
            <Text className={styles.statLabel}>记录条数</Text>
            <Text className={styles.statValue}>{entryCount}</Text>
          </View>
        </View>
      </View>

      {/* Week Comparison (show when week mode) */}
      {timeRange === 'week' && (
        <View className={styles.weekCompareCard}>
          <Text className={styles.weekCompareTitle}>周数据对比</Text>
          <View className={styles.weekCompareRow}>
            <View className={styles.weekCompareItem}>
              <Text className={styles.weekCompareLabel}>上周</Text>
              <Text className={styles.weekCompareValue}>{formatDuration(lastWeekDuration)}</Text>
            </View>
            <View className={styles.weekCompareItem}>
              <Text className={styles.weekCompareLabel}>本周</Text>
              <Text className={styles.weekCompareValue}>{formatDuration(thisWeekDuration)}</Text>
            </View>
          </View>
          <View className={styles.weekDiffRow}>
            <View className={`${styles.weekDiffBadge} ${weekDiff >= 0 ? styles.weekDiffUp : styles.weekDiffDown}`}>
              <Text className={styles.weekDiffArrow}>{weekDiff >= 0 ? '▲' : '▼'}</Text>
              <Text className={styles.weekDiffText}>{weekDiff >= 0 ? '+' : ''}{weekDiffPercent}%</Text>
            </View>
          </View>
          {showSelfForgiveness && (
            <View className={styles.encourageCard}>
              <Text className={styles.encourageIcon}>💝</Text>
              <Text className={styles.encourageText}>{getRandomFromArray(selfForgivenessContent)}</Text>
            </View>
          )}
          {showEncouragement && thisWeekDuration > 0 && (
            <View className={styles.encourageCard}>
              <Text className={styles.encourageIcon}>👍</Text>
              <Text className={styles.encourageText}>{getRandomFromArray(encouragementContent)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Timeline (only show for today) */}
      {timeRange === 'today' && (
        <View className={styles.timelineCard}>
          <Text className={styles.timelineTitle}>24小时时间线</Text>

          <View className={styles.timeLabels}>
            {getTimeLabels().map((label) => (
              <Text key={label} className={styles.timeLabel}>{label}</Text>
            ))}
          </View>

          <View className={styles.timelineContainer}>
            <View className={styles.hourGrid}>
              {Array.from({ length: 24 }).map((_, hourIndex) => (
                <View key={hourIndex} className={styles.hourCell} />
              ))}
            </View>

            <View
              className={styles.workTimeIndicator}
              style={{ left: '37.5%', width: '37.5%' }}
            />

            {todayEntries.map((entry, index) => {
              const { left, width } = getPositionAndWidth(entry);
              const colorIndex = index % GRADIENT_COLORS.length;
              const topOffset = (index % 3) * 16 + 4;
              return (
                <View
                  key={index}
                  className={styles.entryBlock}
                  style={{
                    left,
                    width,
                    top: `${topOffset}rpx`,
                    background: GRADIENT_COLORS[colorIndex],
                  }}
                >
                  <Text className={styles.entryBlockText}>{entry.activity}</Text>
                </View>
              );
            })}
          </View>

          <View className={styles.timelineLegend}>
            <View className={styles.legendItem}>
              <View className={`${styles.legendDot} ${styles.legendWorkTime}`} />
              <Text className={styles.legendLabel}>工作时间 (9:00-18:00)</Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.entriesSection}>
        <View className={styles.entriesHeader}>
          <Text className={styles.entriesTitle}>{timeRange === 'today' ? '今日记录' : '本周记录'}</Text>
          <Text className={styles.entriesCount}>共 {entryCount} 条</Text>
        </View>

        {currentEntries.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyTitle}>暂无记录</Text>
            <Text className={styles.emptyDesc}>开始记录您的第一条工作记录吧</Text>
            <View className={styles.emptyBtn} onClick={handleAddRecord}>
              <Text className={styles.emptyBtnText}>添加记录</Text>
            </View>
          </View>
        ) : (
          <View className={styles.entriesList}>
            {(timeRange === 'week' ? weekEntries : todayEntries).map((entry: any, index: number) => {
              const colorIndex = index % GRADIENT_COLORS.length;
              const initial = entry.activity.charAt(0);
              const dateLabel = timeRange === 'week' && entry.date ? `${entry.date.slice(5)} ` : '';
              return (
                <View key={index} className={styles.entryItem}>
                  <View
                    className={styles.entryIcon}
                    style={{ background: GRADIENT_COLORS[colorIndex] }}
                  >
                    <Text className={styles.entryIconText}>{initial}</Text>
                  </View>
                  <View className={styles.entryInfo}>
                    <Text className={styles.entryTitle}>{entry.activity}</Text>
                    <Text className={styles.entryTime}>
                      {dateLabel}{entry.startTime} - {entry.endTime}
                    </Text>
                  </View>
                  <Text className={styles.entryDuration}>
                    {formatDuration(entry.duration)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {currentEntries.length > 0 && (
        <View className={styles.fabBtn} onClick={handleAddRecord}>
          <Text className={styles.fabBtnIcon}>+</Text>
        </View>
      )}
    </View>
  );
};

export default TimerPage;