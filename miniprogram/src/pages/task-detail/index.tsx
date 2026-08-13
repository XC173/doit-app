import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/types';
import styles from './index.module.scss';

const TaskDetailPage: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const toggleSubtask = useTaskStore((state) => state.toggleSubtask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const startTaskWork = useTaskStore((state) => state.startTaskWork);
  const mockData = useTaskStore((state) => state.mockData);

  const [taskId, setTaskId] = useState<string>('');

  useEffect(() => {
    mockData();
    const instance = Taro.getCurrentInstance();
    const params = instance.router?.params;
    if (params?.id) {
      setTaskId(params.id);
    }
  }, [mockData]);

  const task = tasks.find((t) => t.id === taskId);

  const handleBack = useCallback(() => {
    Taro.navigateBack();
  }, []);

  const handleStartWork = useCallback(() => {
    if (!task) return;
    startTaskWork(task.id);
    Taro.navigateTo({ url: '/pages/work-timer/index' });
  }, [task, startTaskWork]);

  const handleToggleStatus = useCallback(() => {
    if (!task) return;
    toggleTaskStatus(task.id);
  }, [task, toggleTaskStatus]);

  const handleToggleSubtask = useCallback((subtaskId: string) => {
    if (!task) return;
    toggleSubtask(task.id, subtaskId);
  }, [task, toggleSubtask]);

  const handleDelete = useCallback(() => {
    Taro.showModal({
      title: '确认删除',
      content: `确定删除任务"${task?.title}"吗？此操作不可撤销。`,
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm && task) {
          deleteTask(task.id);
          Taro.showToast({ title: '任务已删除', icon: 'success' });
          setTimeout(() => {
            Taro.navigateBack();
          }, 500);
        }
      },
    });
  }, [task, deleteTask]);

  const formatDeadline = (deadline: string | 'long-term') => {
    if (deadline === 'long-term') return '长期任务';
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if (days < 0) return `${month}月${day}日 (已过期)`;
    if (days === 0) return `${month}月${day}日 (今天)`;
    if (days === 1) return `${month}月${day}日 (明天)`;
    return `${month}月${day}日 (${days}天后)`;
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return '待处理';
      case 'in-progress':
        return '进行中';
      case 'completed':
        return '已完成';
    }
  };

  const getStatusTagClass = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return styles.tagStatus;
      case 'in-progress':
        return styles.tagStatusInProgress;
      default:
        return styles.tagStatusPending;
    }
  };

  if (!task) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyTask}>
          <Text className={styles.emptyIcon}>📭</Text>
          <Text className={styles.emptyText}>任务不存在或已被删除</Text>
          <View className={styles.backBtn} onClick={handleBack}>
            <Text className={styles.backBtnText}>← 返回</Text>
          </View>
        </View>
      </View>
    );
  }

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

  return (
    <View className={styles.page}>
      <View className={styles.backBtn} onClick={handleBack}>
        <Text className={styles.backBtnText}>← 返回</Text>
      </View>

      <View className={styles.taskCard}>
        <Text className={styles.taskTitle}>{task.title}</Text>
        {task.description && (
          <Text className={styles.taskDesc}>{task.description}</Text>
        )}

        <View className={styles.tagRow}>
          <View
            className={`${styles.tag} ${task.importance === 'important' ? styles.tagImportant : styles.tagNotImportant}`}
          >
            <Text>
              {task.importance === 'important' ? '⭐ 重要' : '非重要'}
            </Text>
          </View>
          <View className={`${styles.tag} ${styles.tagDifficulty}`}>
            <Text>
              {task.difficulty === 'easy' ? '简单' : task.difficulty === 'medium' ? '中等' : '困难'}
            </Text>
          </View>
          <View className={`${styles.tag} ${getStatusTagClass(task.status)}`}>
            <Text>{getStatusText(task.status)}</Text>
          </View>
        </View>

        <View className={styles.metaRow}>
          <View className={styles.metaItem}>
            <Text className={styles.metaIcon}>📅</Text>
            <Text>{formatDeadline(task.deadline)}</Text>
          </View>
          {task.subtasks.length > 0 && (
            <View className={styles.metaItem}>
              <Text className={styles.metaIcon}>📋</Text>
              <Text>
                子任务 {completedSubtasks}/{task.subtasks.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      {task.subtasks.length > 0 && (
        <View className={styles.subtaskSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>子任务</Text>
            <Text className={styles.sectionCount}>
              {completedSubtasks}/{task.subtasks.length} 已完成
            </Text>
          </View>

          <ScrollView scrollY className={styles.subtaskList}>
            {task.subtasks.map((subtask) => (
              <View
                key={subtask.id}
                className={styles.subtaskItem}
                onClick={() => handleToggleSubtask(subtask.id)}
              >
                <View
                  className={`${styles.subtaskCheckbox} ${
                    subtask.completed ? styles.subtaskCheckboxChecked : ''
                  }`}
                >
                  {subtask.completed && (
                    <Text className={styles.subtaskCheckboxIcon}>✓</Text>
                  )}
                </View>
                <Text
                  className={`${styles.subtaskTitle} ${
                    subtask.completed ? styles.subtaskTitleChecked : ''
                  }`}
                >
                  {subtask.title}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View className={styles.actionSection}>
        {task.status !== 'completed' && (
          <View className={styles.startBtn} onClick={handleStartWork}>
            <Text className={styles.startBtnText}>▶ 开始工作</Text>
          </View>
        )}

        <View className={styles.toggleBtn} onClick={handleToggleStatus}>
          <Text className={styles.toggleBtnText}>
            {task.status === 'completed'
              ? '↺ 重新进行'
              : task.status === 'in-progress'
                ? '✓ 标记完成'
                : '▶ 开始 / 完成'}
          </Text>
        </View>

        <View className={styles.deleteBtn} onClick={handleDelete}>
          <Text className={styles.deleteBtnText}>🗑 删除任务</Text>
        </View>
      </View>
    </View>
  );
};

export default TaskDetailPage;