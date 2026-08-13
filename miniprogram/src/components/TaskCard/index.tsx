import React from 'react';
import { View, Text } from '@tarojs/components';
import type { Task } from '@/types';
import { useTaskStore } from '@/store/taskStore';
import styles from './index.module.scss';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onRestart?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onStart, onComplete, onRestart, onDelete, showActions = true }) => {
  const getQuadrantColor = useTaskStore((state) => state.getQuadrantColor);
  const calculateUrgency = useTaskStore((state) => state.calculateUrgency);

  const quadrant = getQuadrantColor(task);
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in-progress';

  const formatDate = (dateString: string | 'long-term') => {
    if (dateString === 'long-term') return '长期任务';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  return (
    <View
      className={styles.taskCard}
      style={{
        background: quadrant.bg,
        borderColor: isCompleted ? '#D1D5DB' : quadrant.text,
        opacity: isCompleted ? 0.65 : 1,
      }}
      onClick={onClick}
    >
      <View className={styles.cardBody}>
        <View className={styles.mainRow}>
          <View className={styles.quadrantTag} style={{ background: quadrant.text, color: '#fff' }}>
            {quadrant.label}
          </View>
          {isInProgress && (
            <View className={styles.progressTag}>进行中</View>
          )}
          {calculateUrgency(task) === 'critical' && (
            <View className={styles.criticalTag}>⏰ 紧急</View>
          )}
        </View>

        <Text className={`${styles.taskTitle} ${isCompleted ? styles.titleCompleted : ''}`}>
          {task.title}
        </Text>

        {task.description && (
          <Text className={styles.taskDesc}>{task.description}</Text>
        )}

        {task.subtasks.length > 0 && (
          <View className={styles.subtaskInfo}>
            <Text className={styles.subtaskText}>
              子任务 {completedSubtasks}/{task.subtasks.length}
            </Text>
            <View className={styles.progressBar}>
              <View
                className={styles.progressFill}
                style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%`, background: quadrant.text }}
              />
            </View>
          </View>
        )}

        <View className={styles.metaRow}>
          <Text className={styles.metaItem}>📅 {formatDate(task.deadline)}</Text>
          {task.difficulty === 'hard' && <Text className={styles.metaItem}>🔥 困难</Text>}
          {task.difficulty === 'medium' && <Text className={styles.metaItem}>⚡ 中等</Text>}
        </View>
      </View>

      {showActions && (
        <View className={styles.actionsRow}>
          {!isCompleted && onStart && (
            <View
              className={styles.actionBtn}
              style={{ background: quadrant.text }}
              onClick={(e) => {
                e.stopPropagation();
                onStart();
              }}
            >
              <Text className={styles.actionBtnText}>开始</Text>
            </View>
          )}
          {!isCompleted && onComplete && (
            <View
              className={styles.actionGhost}
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
            >
              <Text className={styles.actionGhostText}>完成</Text>
            </View>
          )}
          {isCompleted && onRestart && (
            <View
              className={styles.actionGhost}
              onClick={(e) => {
                e.stopPropagation();
                onRestart();
              }}
            >
              <Text className={styles.actionGhostText}>重新进行</Text>
            </View>
          )}
          {onDelete && (
            <View
              className={styles.deleteBtn}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Text className={styles.deleteText}>删除</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default TaskCard;
