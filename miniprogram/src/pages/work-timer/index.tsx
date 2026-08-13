import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useTaskStore } from '@/store/taskStore';
import { cognitiveReappraisalQuotes } from '@/types';
import type { Task } from '@/types';
import styles from './index.module.scss';

type TimerPhase = 'confirm' | 'countdown' | 'working' | 'finished';

const WorkTimerPage: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const workTimerTaskId = useTaskStore((state) => state.workTimerTaskId);
  const workTimerQuote = useTaskStore((state) => state.workTimerQuote);
  const addDailyTimeLog = useTaskStore((state) => state.addDailyTimeLog);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const toggleSubtask = useTaskStore((state) => state.toggleSubtask);
  const setShowWorkTimer = useTaskStore((state) => state.setShowWorkTimer);
  const setWorkTimerTaskId = useTaskStore((state) => state.setWorkTimerTaskId);

  const [phase, setPhase] = useState<TimerPhase>('confirm');
  const [countdown, setCountdown] = useState(300);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentQuote, setCurrentQuote] = useState('');
  const [activity, setActivity] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [markCompleted, setMarkCompleted] = useState(false);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [completedSubtaskIds, setCompletedSubtaskIds] = useState<string[]>([]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleClose = useCallback(() => {
    setShowWorkTimer(false);
    setWorkTimerTaskId(null);
    setPhase('confirm');
    setCountdown(300);
    setElapsedSeconds(0);
    setActivity('');
    setSelectedTask(null);
    setMarkCompleted(false);
    setShowTaskSelector(false);
    setCompletedSubtaskIds([]);
  }, [setShowWorkTimer, setWorkTimerTaskId]);

  const handleCancel = useCallback(() => {
    handleClose();
    Taro.navigateBack();
  }, [handleClose]);

  const handleConfirmStart = useCallback(() => {
    setPhase('countdown');
  }, []);

  const handleFinishWork = useCallback(() => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];

    const taskActivity = selectedTask ? selectedTask.title : (activity.trim() || '工作');

    addDailyTimeLog({
      date,
      startTime: new Date(now.getTime() - elapsedSeconds * 1000).toTimeString().slice(0, 5),
      endTime: now.toTimeString().slice(0, 5),
      activity: taskActivity,
      duration: Math.floor(elapsedSeconds / 60),
    });

    if (selectedTask) {
      selectedTask.subtasks.forEach((subtask) => {
        const wasCompleted = subtask.completed;
        const isNowCompleted = completedSubtaskIds.includes(subtask.id);

        if (wasCompleted !== isNowCompleted) {
          toggleSubtask(selectedTask.id, subtask.id);
        }
      });

      if (markCompleted) {
        toggleTaskStatus(selectedTask.id);
      }
    }

    handleClose();
    Taro.navigateBack();
  }, [selectedTask, activity, elapsedSeconds, completedSubtaskIds, markCompleted, addDailyTimeLog, toggleSubtask, toggleTaskStatus, handleClose]);

  const handleSelectTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setActivity(task.title);
    setShowTaskSelector(false);
  }, []);

  const handleToggleSubtask = useCallback((subtaskId: string) => {
    setCompletedSubtaskIds((prev) =>
      prev.includes(subtaskId)
        ? prev.filter((id) => id !== subtaskId)
        : [...prev, subtaskId]
    );
  }, []);

  useEffect(() => {
    if (workTimerTaskId) {
      const task = tasks.find((t) => t.id === workTimerTaskId);
      if (task) {
        setSelectedTask(task);
        setActivity(task.title);
        setCompletedSubtaskIds(task.subtasks.filter((s) => s.completed).map((s) => s.id));
      }
      setPhase('working');
    }
  }, [workTimerTaskId, tasks]);

  useEffect(() => {
    if (phase === 'countdown') {
      setCountdown(300);
      setCurrentQuote(cognitiveReappraisalQuotes[Math.floor(Math.random() * cognitiveReappraisalQuotes.length)]);
    } else if (phase === 'working') {
      setCountdown(0);
      setElapsedSeconds(0);
      if (!currentQuote) {
        const quoteFromStore = workTimerQuote
          ? workTimerQuote.split(' · ').slice(1).join(' · ')
          : '';
        setCurrentQuote(
          quoteFromStore ||
            cognitiveReappraisalQuotes[Math.floor(Math.random() * cognitiveReappraisalQuotes.length)]
        );
      }
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'countdown') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setPhase('working');
            setCountdown(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    if (phase === 'working') {
      const timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'countdown' || phase === 'working') {
      const quoteTimer = setInterval(() => {
        setCurrentQuote(cognitiveReappraisalQuotes[Math.floor(Math.random() * cognitiveReappraisalQuotes.length)]);
      }, 10000);
      return () => clearInterval(quoteTimer);
    }
  }, [phase]);

  const availableTasks = tasks.filter((task) => task.status !== 'completed');
  const workMinutes = Math.floor(elapsedSeconds / 60);

  return (
    <View className={styles.page}>
      {phase === 'confirm' && !workTimerTaskId && (
        <View className={styles.confirmCard}>
          <View className={styles.confirmIcon}>
            <Text className={styles.confirmIconText}>⚠️</Text>
          </View>
          <Text className={styles.confirmTitle}>开始工作提醒</Text>
          <View className={styles.confirmWarningCard}>
            <Text className={styles.confirmWarningText}>
              接下来的5分钟屏幕将被占用
            </Text>
            <Text className={styles.confirmWarningSubtext}>
              这是专注工作的开始，请确保您已准备好
            </Text>
          </View>
          <Text className={styles.confirmDesc}>
            5分钟倒计时开始后将无法暂停或提前终止，请确认您已做好准备。
          </Text>
          <View className={styles.confirmButtons}>
            <View className={styles.confirmBtnCancel} onClick={handleCancel}>
              <Text className={styles.confirmBtnCancelText}>取消</Text>
            </View>
            <View className={styles.confirmBtnConfirm} onClick={handleConfirmStart}>
              <Text className={styles.confirmBtnConfirmText}>确认开始</Text>
            </View>
          </View>
        </View>
      )}

      {phase === 'countdown' && (
        <View className={styles.countdownContainer}>
          <Text className={styles.countdownLabel}>专注倒计时（不可暂停）</Text>
          <Text className={styles.countdownTimer}>{formatTime(countdown)}</Text>
          <View className={styles.quoteCard}>
            <Text className={styles.quoteText}>"{currentQuote}"</Text>
          </View>
          <Text className={styles.countdownHint}>
            请专注工作，倒计时结束后可选择继续或停止
          </Text>
        </View>
      )}

      {phase === 'working' && (
        <View className={styles.workingContainer}>
          <Text className={styles.workingLabel}>专注工作中</Text>
          <Text className={styles.workingTimer}>{formatTime(elapsedSeconds)}</Text>
          <View className={styles.quoteCard}>
            <Text className={styles.quoteText}>"{currentQuote}"</Text>
          </View>
          <Text className={styles.workingProgress}>已工作 {workMinutes} 分钟</Text>
          <View className={styles.workingFinishBtn} onClick={() => setPhase('finished')}>
            <Text className={styles.workingFinishBtnText}>结束工作</Text>
          </View>
        </View>
      )}

      {phase === 'finished' && (
        <View className={styles.finishedContainer}>
          <View className={styles.finishedHeader}>
            <View className={styles.finishedCelebration}>
              <Text className={styles.finishedEmoji}>🎉</Text>
            </View>
            <Text className={styles.finishedTitle}>太棒了！</Text>
            <Text className={styles.finishedSubtitle}>你已经完成了专注工作时段</Text>
          </View>

          <View className={styles.durationCard}>
            <Text className={styles.durationLabel}>工作时长</Text>
            <Text className={styles.durationValue}>{workMinutes} 分钟</Text>
          </View>

          <View className={styles.sectionCard}>
            <Text className={styles.sectionLabel}>你进行了什么工作？</Text>
            <Input
              className={styles.activityInput}
              value={activity}
              onInput={(e) => {
                setActivity(e.detail.value);
                setSelectedTask(null);
              }}
              placeholder='输入工作内容...'
            />
            <View
              className={styles.taskSelectorToggle}
              onClick={() => setShowTaskSelector(!showTaskSelector)}
            >
              <Text className={styles.taskSelectorToggleText}>
                {showTaskSelector ? '收起任务列表' : '从任务列表选择'}
              </Text>
            </View>

            {showTaskSelector && availableTasks.length > 0 && (
              <ScrollView className={styles.taskSelectorList} scrollY>
                {availableTasks.map((task) => (
                  <View
                    key={task.id}
                    className={`${styles.taskSelectorItem} ${
                      selectedTask?.id === task.id ? styles.taskSelectorItemSelected : ''
                    }`}
                    onClick={() => handleSelectTask(task)}
                  >
                    <Text className={styles.taskSelectorItemText}>{task.title}</Text>
                    {selectedTask?.id === task.id && (
                      <Text className={styles.taskSelectorCheck}>✓</Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {selectedTask && (
            <View className={styles.sectionCard}>
              <View className={styles.markCompleteRow}>
                <Text className={styles.markCompleteLabel}>标记任务完成</Text>
                <View
                  className={`${styles.toggleSwitch} ${
                    markCompleted ? styles.toggleSwitchActive : ''
                  }`}
                  onClick={() => setMarkCompleted(!markCompleted)}
                >
                  <View className={styles.toggleKnob} />
                </View>
              </View>
              <Text className={styles.markCompleteHint}>
                {markCompleted
                  ? `完成后将标记"${selectedTask.title}"为已完成`
                  : '勾选后，完成此记录时将同步标记任务为已完成'}
              </Text>

              {selectedTask.subtasks.length > 0 && (
                <View className={styles.subtaskList}>
                  <Text className={styles.subtaskTitle}>子任务完成情况</Text>
                  {selectedTask.subtasks.map((subtask) => (
                    <View
                      key={subtask.id}
                      className={styles.subtaskItem}
                      onClick={() => handleToggleSubtask(subtask.id)}
                    >
                      <View
                        className={`${styles.subtaskCheckbox} ${
                          completedSubtaskIds.includes(subtask.id)
                            ? styles.subtaskCheckboxChecked
                            : ''
                        }`}
                      >
                        {completedSubtaskIds.includes(subtask.id) && (
                          <Text className={styles.subtaskCheckboxIcon}>✓</Text>
                        )}
                      </View>
                      <Text
                        className={`${styles.subtaskTitle} ${
                          completedSubtaskIds.includes(subtask.id)
                            ? styles.subtaskTitleChecked
                            : ''
                        }`}
                      >
                        {subtask.title}
                      </Text>
                    </View>
                  ))}
                  <Text className={styles.subtaskProgress}>
                    {completedSubtaskIds.length}/{selectedTask.subtasks.length} 子任务已完成
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className={styles.finishedBtn} onClick={handleFinishWork}>
            <Text className={styles.finishedBtnText}>结束工作</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default WorkTimerPage;