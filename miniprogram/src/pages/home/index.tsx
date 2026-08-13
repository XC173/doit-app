import React, { useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useTaskStore } from '@/store/taskStore';
import TaskCard from '@/components/TaskCard';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const dailyTimeLogs = useTaskStore((state) => state.dailyTimeLogs);
  const getTodayTasks = useTaskStore((state) => state.getTodayTasks);
  const startTaskWork = useTaskStore((state) => state.startTaskWork);
  const mockData = useTaskStore((state) => state.mockData);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const restartTask = useTaskStore((state) => state.restartTask);
  const setWorkTimerTaskId = useTaskStore((state) => state.setWorkTimerTaskId);
  const setShowWorkTimer = useTaskStore((state) => state.setShowWorkTimer);

  useEffect(() => {
    mockData();
  }, [mockData]);

  const todayTasks = getTodayTasks();
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];
  const todayLogs = dailyTimeLogs.find((log) => log.date === todayStr);
  const todayMinutes = todayLogs ? todayLogs.entries.reduce((sum, entry) => sum + entry.duration, 0) : 0;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const dateStr = `${todayDate.getFullYear()}年${todayDate.getMonth() + 1}月${todayDate.getDate()}日 ${weekDays[todayDate.getDay()]}`;

  const handleStartWork = () => {
    setWorkTimerTaskId(null);
    setShowWorkTimer(true);
    Taro.navigateTo({ url: '/pages/work-timer/index' });
  };

  const handleStartTask = (taskId: string) => {
    startTaskWork(taskId);
    Taro.navigateTo({ url: '/pages/work-timer/index' });
  };

  const handleAddTask = () => {
    Taro.navigateTo({ url: '/pages/task-add/index' });
  };

  const handleGoTasks = () => {
    Taro.switchTab({ url: '/pages/tasks/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>今日概览</Text>
        <Text className={styles.date}>{dateStr}</Text>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <View className={`${styles.statIcon} ${styles.statIconPrimary}`}>
            <Text className={styles.statEmoji}>📋</Text>
          </View>
          <Text className={styles.statValue}>{todayTasks.length}</Text>
          <Text className={styles.statLabel}>今日任务</Text>
        </View>
        <View className={styles.statCard}>
          <View className={`${styles.statIcon} ${styles.statIconWarning}`}>
            <Text className={styles.statEmoji}>⏳</Text>
          </View>
          <Text className={styles.statValue}>{pendingTasks.length}</Text>
          <Text className={styles.statLabel}>待处理</Text>
        </View>
        <View className={styles.statCard}>
          <View className={`${styles.statIcon} ${styles.statIconSuccess}`}>
            <Text className={styles.statEmoji}>✅</Text>
          </View>
          <Text className={styles.statValue}>{completedTasks.length}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
      </View>

      <View className={styles.workSection} onClick={handleStartWork}>
        <View className={styles.workContent}>
          <View className={styles.workInfo}>
            <Text className={styles.workTitle}>开始工作</Text>
            <Text className={styles.workDesc}>准备好了吗？专注5分钟试试看！</Text>
          </View>
          <View className={styles.workBtn}>
            <Text className={styles.workBtnText}>▶ 开始</Text>
          </View>
        </View>
      </View>

      <View className={styles.dataSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>今日数据</Text>
        </View>
        <View className={styles.dataCard}>
          <View className={styles.dataItem}>
            <Text className={styles.dataLabel}>🎯 工作时长</Text>
            <Text className={styles.dataValue}>{formatDuration(todayMinutes)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.taskSection}>
        <View className={styles.taskHeader}>
          <Text className={styles.taskTitle}>今日待办</Text>
          <View className={styles.addButton} onClick={handleAddTask}>
            <Text className={styles.addText}>+ 添加</Text>
          </View>
        </View>

        {todayTasks.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🎉</Text>
            <Text className={styles.emptyText}>今日暂无待办任务</Text>
            <View className={styles.emptyBtn} onClick={handleAddTask}>
              <Text className={styles.emptyBtnText}>添加任务</Text>
            </View>
          </View>
        ) : (
          <ScrollView scrollY className={styles.taskListScroll}>
            <View className={styles.taskList}>
              {todayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => Taro.navigateTo({ url: `/pages/task-detail/index?id=${task.id}` })}
                  onStart={() => handleStartTask(task.id)}
                  onComplete={() => toggleTaskStatus(task.id)}
                  onRestart={() => restartTask(task.id)}
                  onDelete={() => {
                    Taro.showModal({
                      title: '确认删除',
                      content: `确定删除任务"${task.title}"吗？`,
                      success: (res) => {
                        if (res.confirm) deleteTask(task.id);
                      },
                    });
                  }}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {pendingTasks.length > todayTasks.length && (
        <View className={styles.viewAll} onClick={handleGoTasks}>
          <Text className={styles.viewAllText}>查看全部 {pendingTasks.length} 个待办 →</Text>
        </View>
      )}

      <View className={styles.quickActions}>
        <View className={styles.quickBtn} onClick={() => Taro.navigateTo({ url: '/pages/diagnosis/index' })}>
          <Text className={styles.quickIcon}>🔍</Text>
          <Text className={styles.quickLabel}>拖延诊断</Text>
        </View>
        <View className={styles.quickBtn} onClick={() => Taro.switchTab({ url: '/pages/timer/index' })}>
          <Text className={styles.quickIcon}>⏱</Text>
          <Text className={styles.quickLabel}>事件记录</Text>
        </View>
        <View className={styles.quickBtn} onClick={() => Taro.switchTab({ url: '/pages/schedule/index' })}>
          <Text className={styles.quickIcon}>📅</Text>
          <Text className={styles.quickLabel}>日程表</Text>
        </View>
      </View>
    </View>
  );
};

export default HomePage;
