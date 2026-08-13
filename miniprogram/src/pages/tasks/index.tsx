import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useTaskStore } from '@/store/taskStore';
import TaskCard from '@/components/TaskCard';
import styles from './index.module.scss';

type FilterType = 'all' | 'pending' | 'in-progress' | 'completed';
type QuadrantFilter = 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'not-urgent-not-important' | 'long-term';

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'in-progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

const quadrantOptions: { key: QuadrantFilter; label: string; subtitle: string; style: string }[] = [
  { key: 'urgent-important', label: '紧急重要', subtitle: '立即处理', style: styles.quadrantUrgentImportant },
  { key: 'important-not-urgent', label: '重要不紧急', subtitle: '提前规划', style: styles.quadrantImportantNotUrgent },
  { key: 'urgent-not-important', label: '紧急不重要', subtitle: '尽快完成', style: styles.quadrantUrgentNotImportant },
  { key: 'not-urgent-not-important', label: '不紧急不重要', subtitle: '有空再做', style: styles.quadrantNotUrgentNotImportant },
  { key: 'long-term', label: '长期任务', subtitle: '持续推进', style: styles.quadrantLongTerm },
];

// 示例日常任务模板
const recurringTaskTemplates = [
  { title: '每日计划', description: '规划今日任务', importance: 'important' as const, difficulty: 'easy' as const },
  { title: '运动锻炼', description: '保持身体健康', importance: 'important' as const, difficulty: 'medium' as const },
  { title: '阅读学习', description: '每日学习一小时', importance: 'important' as const, difficulty: 'medium' as const },
  { title: '整理工作区', description: '保持桌面整洁', importance: 'not-important' as const, difficulty: 'easy' as const },
  { title: '复盘总结', description: '回顾今日工作', importance: 'important' as const, difficulty: 'easy' as const },
];

const TaskManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [quadrantFilter, setQuadrantFilter] = useState<QuadrantFilter | null>(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const tasks = useTaskStore((state) => state.tasks);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const calculateUrgency = useTaskStore((state) => state.calculateUrgency);
  const mockData = useTaskStore((state) => state.mockData);
  const startTaskWork = useTaskStore((state) => state.startTaskWork);
  const restartTask = useTaskStore((state) => state.restartTask);
  const addTask = useTaskStore((state) => state.addTask);

  useEffect(() => {
    mockData();
  }, [mockData]);

  const getQuadrantCount = (quadrantKey: QuadrantFilter) => {
    return tasks.filter((task) => {
      const urgency = calculateUrgency(task);
      const isImportant = task.importance === 'important';
      const isUrgent = urgency === 'red' || urgency === 'critical';

      if (quadrantKey === 'urgent-important') return isImportant && isUrgent;
      if (quadrantKey === 'important-not-urgent') return isImportant && !isUrgent;
      if (quadrantKey === 'urgent-not-important') return !isImportant && isUrgent;
      if (quadrantKey === 'not-urgent-not-important') return !isImportant && !isUrgent;
      if (quadrantKey === 'long-term') return urgency === 'long-term';
      return false;
    }).length;
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || task.status === filter;

      if (!matchesSearch || !matchesFilter) return false;

      if (quadrantFilter) {
        const urgency = calculateUrgency(task);
        const isImportant = task.importance === 'important';
        const isUrgent = urgency === 'red' || urgency === 'critical';

        if (quadrantFilter === 'urgent-important') return isImportant && isUrgent;
        if (quadrantFilter === 'important-not-urgent') return isImportant && !isUrgent;
        if (quadrantFilter === 'urgent-not-important') return !isImportant && isUrgent;
        if (quadrantFilter === 'not-urgent-not-important') return !isImportant && !isUrgent;
        if (quadrantFilter === 'long-term') return urgency === 'long-term';
      }

      return true;
    });
  }, [tasks, searchQuery, filter, quadrantFilter, calculateUrgency]);

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const handleQuadrantClick = (quadrant: QuadrantFilter) => {
    setQuadrantFilter(quadrantFilter === quadrant ? null : quadrant);
  };

  const handleClearFilters = () => {
    setFilter('all');
    setQuadrantFilter(null);
    setSearchQuery('');
  };

  const handleTaskClick = (taskId: string) => {
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${taskId}` });
  };

  const handleAddTask = () => {
    Taro.navigateTo({ url: '/pages/task-add/index' });
  };

  const handleTaskComplete = (taskId: string) => {
    toggleTaskStatus(taskId);
  };

  const handleTaskDelete = (taskId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定删除这个任务吗？',
      success: (res) => {
        if (res.confirm) {
          deleteTask(taskId);
        }
      },
    });
  };

  const handleStartTask = (taskId: string) => {
    startTaskWork(taskId);
    Taro.navigateTo({ url: '/pages/work-timer/index' });
  };

  // 处理日常任务
  const handleRecurringTasks = () => {
    setShowRecurringModal(true);
  };

  const handleAddRecurringTask = (template: typeof recurringTaskTemplates[0]) => {
    const now = new Date().toISOString();
    const today = new Date();
    today.setHours(23, 59, 59);
    
    addTask({
      title: template.title,
      description: template.description,
      importance: template.importance,
      difficulty: template.difficulty,
      startTime: now,
      deadline: today.toISOString(),
      status: 'pending',
      subtasks: [],
    });
    
    Taro.showToast({ title: '已添加日常任务', icon: 'success' });
  };

  // 处理导入
  const handleImport = () => {
    setShowImportModal(true);
  };

  const handleImportFromClipboard = async () => {
    try {
      const content = await Taro.getClipboardData();
      if (content.data) {
        // 尝试解析为任务列表（每行一个任务）
        const lines = content.data.split('\n').filter((line: string) => line.trim());
        let importCount = 0;
        
        for (const line of lines) {
          const now = new Date().toISOString();
          addTask({
            title: line.trim(),
            description: '',
            importance: 'not-important',
            difficulty: 'medium',
            startTime: now,
            deadline: now,
            status: 'pending',
            subtasks: [],
          });
          importCount++;
        }
        
        if (importCount > 0) {
          Taro.showToast({ title: `已导入 ${importCount} 个任务`, icon: 'success' });
          setShowImportModal(false);
        } else {
          Taro.showToast({ title: '剪贴板无有效内容', icon: 'none' });
        }
      }
    } catch (e) {
      Taro.showToast({ title: '导入失败', icon: 'none' });
    }
  };

  const hasActiveFilter = filter !== 'all' || quadrantFilter !== null || searchQuery !== '';

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerInfo}>
          <Text className={styles.title}>任务管理</Text>
          <Text className={styles.subtitle}>管理和追踪所有任务</Text>
        </View>
        <View className={styles.headerActions}>
          <View
            className={styles.actionBtn}
            onClick={handleImport}
          >
            <Text className={styles.actionIcon}>📥</Text>
          </View>
          <View
            className={styles.actionBtn}
            onClick={handleRecurringTasks}
          >
            <Text className={styles.actionIcon}>🔄</Text>
          </View>
          <View className={styles.actionBtn} onClick={handleAddTask}>
            <Text className={styles.actionIcon}>➕</Text>
          </View>
        </View>
      </View>

      <View className={styles.quadrantSection}>
        <Text className={styles.sectionTitle}>四象限视图</Text>
        <View className={styles.quadrantGrid}>
          {quadrantOptions.map((item) => (
            <View
              key={item.key}
              className={`${styles.quadrantCard} ${item.style} ${quadrantFilter === item.key ? styles.quadrantCardActive : ''}`}
              onClick={() => handleQuadrantClick(item.key)}
            >
              <View className={styles.quadrantTop}>
                <Text className={styles.quadrantLabel}>{item.label}</Text>
                <Text className={styles.quadrantCount}>{getQuadrantCount(item.key)}</Text>
              </View>
              <Text className={styles.quadrantSubtitle}>{item.subtitle}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.filterBar}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder='搜索任务...'
            placeholderClass='placeholder'
            value={searchQuery}
            onInput={(e) => setSearchQuery(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.filterTabs}>
        {filterOptions.map((option) => (
          <View
            key={option.value}
            className={`${styles.filterTab} ${filter === option.value ? styles.filterTabActive : ''}`}
            onClick={() => setFilter(option.value)}
          >
            <Text className={`${styles.filterTabText} ${filter === option.value ? styles.filterTabTextActive : ''}`}>
              {option.label}
            </Text>
          </View>
        ))}
      </View>

      {hasActiveFilter && (
        <View className={styles.filterTags}>
          {filter !== 'all' && (
            <View className={styles.filterTag}>
              <Text className={styles.filterTagText}>
                {filterOptions.find((f) => f.value === filter)?.label}
              </Text>
            </View>
          )}
          {quadrantFilter && (
            <View className={styles.filterTag}>
              <View
                className={styles.filterTagDot}
                style={{
                  background:
                    quadrantFilter === 'urgent-important'
                      ? '#EF4444'
                      : quadrantFilter === 'important-not-urgent'
                      ? '#3B82F6'
                      : quadrantFilter === 'urgent-not-important'
                      ? '#F59E0B'
                      : quadrantFilter === 'long-term'
                      ? '#8B5CF6'
                      : '#6B7280',
                }}
              />
              <Text className={styles.filterTagText}>
                {quadrantOptions.find((q) => q.key === quadrantFilter)?.label}
              </Text>
            </View>
          )}
          <View className={styles.filterClear} onClick={handleClearFilters}>
            <Text className={styles.filterClearText}>清除</Text>
          </View>
        </View>
      )}

      <View className={styles.taskListSection}>
        <Text className={styles.sectionTitle}>任务列表</Text>
        {filteredTasks.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无任务</Text>
            <View className={styles.emptyBtn} onClick={handleAddTask}>
              <Text className={styles.emptyBtnText}>添加任务</Text>
            </View>
          </View>
        ) : (
          <ScrollView scrollY className={styles.taskListScroll}>
            <View className={styles.taskList}>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => handleTaskClick(task.id)}
                  onStart={() => handleStartTask(task.id)}
                  onComplete={() => handleTaskComplete(task.id)}
                  onRestart={() => restartTask(task.id)}
                  onDelete={() => handleTaskDelete(task.id)}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <View className={styles.statsSection}>
        <View className={styles.statsCard}>
          <Text className={styles.statsTitle}>任务统计</Text>
          <View className={styles.quickStats}>
            <View className={styles.quickStat}>
              <Text className={styles.quickStatValue}>{tasks.length}</Text>
              <Text className={styles.quickStatLabel}>全部任务</Text>
            </View>
            <View className={styles.quickStat}>
              <Text className={`${styles.quickStatValue}`} style={{ color: '#F59E0B' }}>
                {pendingCount}
              </Text>
              <Text className={styles.quickStatLabel}>待处理</Text>
            </View>
            <View className={styles.quickStat}>
              <Text className={`${styles.quickStatValue}`} style={{ color: '#3B82F6' }}>
                {inProgressCount}
              </Text>
              <Text className={styles.quickStatLabel}>进行中</Text>
            </View>
            <View className={styles.quickStat}>
              <Text className={`${styles.quickStatValue}`} style={{ color: '#10B981' }}>
                {completedCount}
              </Text>
              <Text className={styles.quickStatLabel}>已完成</Text>
            </View>
          </View>

          <View className={styles.statsList}>
            <View
              className={`${styles.statsItem} ${filter === 'all' ? styles.statsItemActive : styles.statsItemDefault}`}
              onClick={() => setFilter('all')}
            >
              <Text className={styles.statsItemLabel}>全部任务</Text>
              <Text className={styles.statsItemValue}>{tasks.length}</Text>
            </View>
            <View
              className={`${styles.statsItem} ${filter === 'pending' ? styles.statsItemActive : styles.statsItemDefault}`}
              onClick={() => setFilter('pending')}
            >
              <Text className={styles.statsItemLabel}>待处理</Text>
              <Text className={`${styles.statsItemValue} ${styles.statsItemValueWarning}`}>{pendingCount}</Text>
            </View>
            <View
              className={`${styles.statsItem} ${filter === 'in-progress' ? styles.statsItemActive : styles.statsItemDefault}`}
              onClick={() => setFilter('in-progress')}
            >
              <Text className={styles.statsItemLabel}>进行中</Text>
              <Text className={`${styles.statsItemValue} ${styles.statsItemValueInfo}`}>{inProgressCount}</Text>
            </View>
            <View
              className={`${styles.statsItem} ${filter === 'completed' ? styles.statsItemActive : styles.statsItemDefault}`}
              onClick={() => setFilter('completed')}
            >
              <Text className={styles.statsItemLabel}>已完成</Text>
              <Text className={`${styles.statsItemValue} ${styles.statsItemValueSuccess}`}>{completedCount}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.addFab} onClick={handleAddTask}>
        <Text className={styles.addFabIcon}>+</Text>
      </View>

      {/* 日常任务选择弹窗 */}
      {showRecurringModal && (
        <View className={styles.modalOverlay} onClick={() => setShowRecurringModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>添加日常任务</Text>
              <View className={styles.modalClose} onClick={() => setShowRecurringModal(false)}>
                <Text>×</Text>
              </View>
            </View>
            <ScrollView scrollY className={styles.modalBody}>
              {recurringTaskTemplates.map((template, index) => (
                <View
                  key={index}
                  className={styles.recurringItem}
                  onClick={() => {
                    handleAddRecurringTask(template);
                    setShowRecurringModal(false);
                  }}
                >
                  <Text className={styles.recurringTitle}>{template.title}</Text>
                  <Text className={styles.recurringDesc}>{template.description}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 导入弹窗 */}
      {showImportModal && (
        <View className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>导入任务</Text>
              <View className={styles.modalClose} onClick={() => setShowImportModal(false)}>
                <Text>×</Text>
              </View>
            </View>
            <View className={styles.modalBody}>
              <View className={styles.importOption} onClick={handleImportFromClipboard}>
                <Text className={styles.importIcon}>📋</Text>
                <View className={styles.importInfo}>
                  <Text className={styles.importTitle}>从剪贴板导入</Text>
                  <Text className={styles.importDesc}>每行一个任务，自动创建</Text>
                </View>
              </View>
              <View className={styles.importHint}>
                <Text>提示：复制任务列表文本，点击上方按钮即可快速导入</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default TaskManagementPage;