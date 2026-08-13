import React, { useState, useCallback } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useTaskStore } from '@/store/taskStore';
import styles from './index.module.scss';

const importanceOptions = [
  { value: 'important', label: '⭐ 重要' },
  { value: 'not-important', label: '非重要' },
];

const difficultyOptions = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

// 子任务模板
const subtaskTemplates: Record<string, string[]> = {
  '报告': ['收集资料', '分析数据', '撰写初稿', '审核修改', '完善定稿'],
  '学习': ['查阅资料', '实践练习', '总结笔记', '复习巩固'],
  '项目': ['规划设计', '环境搭建', '核心开发', '测试调试', '文档整理'],
  '设计': ['需求分析', '方案设计', '原型制作', '评审修改', '最终确认'],
  '会议': ['准备材料', '发送邀请', '主持会议', '记录纪要', '跟进落实'],
  'default': ['需求分析', '方案设计', '具体实施', '检查完善'],
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const TaskAddPage: React.FC = () => {
  const addTask = useTaskStore((state) => state.addTask);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<'important' | 'not-important'>('important');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [deadline, setDeadline] = useState<string>('');
  const [isLongTerm, setIsLongTerm] = useState(false);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 智能拆分子任务
  const handleAutoSplit = useCallback(() => {
    if (!title.trim()) {
      Taro.showToast({ title: '请先输入任务标题', icon: 'none' });
      return;
    }

    // 根据标题关键词匹配模板
    let matchedTemplate = subtaskTemplates['default'];
    for (const [keyword, template] of Object.entries(subtaskTemplates)) {
      if (keyword !== 'default' && (title.includes(keyword) || description.includes(keyword))) {
        matchedTemplate = template;
        break;
      }
    }

    // 生成子任务
    const generatedSubtasks = matchedTemplate.map((item) => ({
      id: generateId(),
      title: item,
      completed: false,
    }));

    setSubtasks(generatedSubtasks);
    Taro.showToast({ title: `已生成 ${generatedSubtasks.length} 个子任务`, icon: 'success' });
  }, [title, description]);

  // 添加自定义子任务
  const handleAddSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { id: generateId(), title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle('');
  }, [newSubtaskTitle, subtasks]);

  // 删除子任务
  const handleRemoveSubtask = useCallback((id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  }, [subtasks]);

  const handleDateChange = useCallback((e) => {
    setDeadline(e.detail.value);
  }, []);

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入任务标题', icon: 'none' });
      return;
    }

    const now = new Date().toISOString();
    const deadlineValue = isLongTerm ? 'long-term' : (deadline || now);

    addTask({
      title: title.trim(),
      description: description.trim(),
      importance,
      difficulty,
      startTime: now,
      deadline: deadlineValue,
      status: 'pending',
      subtasks,
    });

    Taro.showToast({ title: '任务已创建', icon: 'success' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 500);
  }, [title, description, importance, difficulty, deadline, isLongTerm, subtasks, addTask]);

  const canSave = title.trim().length > 0;

  return (
    <View className={styles.page}>
      <View className={styles.formCard}>
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            任务标题
            <Text className={styles.formRequired}>*</Text>
          </Text>
          <Input
            className={styles.formInput}
            placeholder='请输入任务标题'
            placeholderClass='placeholder'
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={50}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>任务描述</Text>
          <Textarea
            className={styles.formTextarea}
            placeholder='请输入任务描述（可选）'
            placeholderClass='placeholder'
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>重要程度</Text>
          <View className={styles.importanceGroup}>
            {importanceOptions.map((option) => (
              <View
                key={option.value}
                className={`${styles.importanceOption} ${
                  importance === option.value
                    ? option.value === 'important'
                      ? styles.importanceOptionActiveImportant
                      : styles.importanceOptionActiveNotImportant
                    : styles.importanceOptionInactive
                }`}
                onClick={() => setImportance(option.value as 'important' | 'not-important')}
              >
                <Text>{option.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>难度</Text>
          <View className={styles.difficultyGroup}>
            {difficultyOptions.map((option) => (
              <View
                key={option.value}
                className={`${styles.difficultyOption} ${
                  difficulty === option.value
                    ? styles.difficultyOptionActive
                    : styles.difficultyOptionInactive
                }`}
                onClick={() => setDifficulty(option.value as 'easy' | 'medium' | 'hard')}
              >
                <Text>{option.label}</Text>
              </View>
            ))}
          </View>

          {/* 困难任务智能拆分 */}
          {difficulty === 'hard' && (
            <View className={styles.subtaskSplitSection}>
              <View className={styles.splitBtn} onClick={handleAutoSplit}>
                <Text className={styles.splitBtnIcon}>🪄</Text>
                <Text className={styles.splitBtnText}>智能拆分子任务</Text>
              </View>
              <Text className={styles.splitHint}>困难任务建议拆分为更小的步骤完成</Text>
            </View>
          )}
        </View>

        {/* 子任务列表 */}
        {subtasks.length > 0 && (
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              子任务
              <Text className={styles.subtaskCount}> ({subtasks.length})</Text>
            </Text>
            <View className={styles.subtaskList}>
              {subtasks.map((subtask, index) => (
                <View key={subtask.id} className={styles.subtaskItem}>
                  <Text className={styles.subtaskNumber}>{index + 1}</Text>
                  <Text className={styles.subtaskTitle}>{subtask.title}</Text>
                  <View
                    className={styles.subtaskRemove}
                    onClick={() => handleRemoveSubtask(subtask.id)}
                  >
                    <Text className={styles.subtaskRemoveIcon}>×</Text>
                  </View>
                </View>
              ))}
            </View>
            {/* 添加自定义子任务 */}
            <View className={styles.addSubtaskRow}>
              <Input
                className={styles.addSubtaskInput}
                placeholder='添加自定义子任务'
                placeholderClass='placeholder'
                value={newSubtaskTitle}
                onInput={(e) => setNewSubtaskTitle(e.detail.value)}
                onConfirm={handleAddSubtask}
              />
              <View className={styles.addSubtaskBtn} onClick={handleAddSubtask}>
                <Text className={styles.addSubtaskBtnText}>+</Text>
              </View>
            </View>
          </View>
        )}

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>截止日期</Text>
          <View className={styles.checkboxRow} onClick={() => setIsLongTerm(!isLongTerm)}>
            <View
              className={`${styles.checkboxBox} ${isLongTerm ? styles.checkboxChecked : ''}`}
            >
              {isLongTerm && <Text className={styles.checkboxIcon}>✓</Text>}
            </View>
            <Text className={styles.checkboxLabel}>长期任务（无截止日期）</Text>
          </View>

          {!isLongTerm && (
            <View className={styles.datePickerWrapper}>
              <Text className={deadline ? styles.datePickerText : styles.datePickerPlaceholder}>
                {deadline ? formatDate(deadline) : '请选择截止日期'}
              </Text>
              <Text className={styles.datePickerIcon}>📅</Text>
            </View>
          )}
          {!isLongTerm && (
            <Text className={styles.checkboxHint}>
              选择截止日期后，系统会自动计算紧急程度
            </Text>
          )}
        </View>
      </View>

      <View
        className={`${styles.footerBtn} ${!canSave ? styles.footerBtnDisabled : ''}`}
        onClick={canSave ? handleSave : undefined}
      >
        <Text className={styles.footerBtnText}>保存任务</Text>
      </View>
    </View>
  );
};

export default TaskAddPage;