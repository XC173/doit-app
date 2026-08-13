import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useTaskStore } from '@/store/taskStore';
import { selfForgivenessContent, encouragementContent } from '@/types';
import styles from './index.module.scss';

const ProfilePage: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const dailyTimeLogs = useTaskStore((state) => state.dailyTimeLogs);
  const eysenckResults = useTaskStore((state) => state.eysenckResults);
  const getWeeklyDuration = useTaskStore((state) => state.getWeeklyDuration);
  const mockData = useTaskStore((state) => state.mockData);

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [reminderInterval, setReminderInterval] = useState('10');

  useEffect(() => {
    mockData();
  }, [mockData]);

  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];

  const completedToday = tasks.filter(
    (t) => t.status === 'completed' && t.deadline !== 'long-term'
  ).filter((t) => {
    const deadline = new Date(t.deadline);
    return deadline.toISOString().split('T')[0] === todayStr;
  });

  const completedTodayCount = completedToday.length;

  const todayLogs = dailyTimeLogs.find((log) => log.date === todayStr);
  const todayMinutes = todayLogs
    ? todayLogs.entries.reduce((sum, entry) => sum + entry.duration, 0)
    : 0;

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

  const showSelfForgiveness = weekDiff < 0;
  const showEncouragement = weekDiff >= 0;

  const getRandomFromArray = (arr: string[]) => {
    if (arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const randomSelfForgiveness = getRandomFromArray(selfForgivenessContent);
  const randomEncouragement = getRandomFromArray(encouragementContent);

  const latestEysenck = eysenckResults.length > 0
    ? eysenckResults[eysenckResults.length - 1]
    : null;

  const levelTextMap: Record<string, string> = {
    low: '低水平',
    mild: '轻度',
    moderate: '中度',
    severe: '严重',
  };

  const levelStyleMap: Record<string, string> = {
    low: styles.levelLow,
    mild: styles.levelMild,
    moderate: styles.levelModerate,
    severe: styles.levelSevere,
  };

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url });
  };

  const handleSwitchChange = (
    value: boolean,
    setter: (v: boolean) => void
  ) => {
    setter(value);
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已退出登录', icon: 'success' });
        }
      },
    });
  };

  const pickerOptions = ['5分钟', '10分钟', '15分钟', '30分钟'];
  const pickerValues = ['5', '10', '15', '30'];

  const handlePickerChange = (e: { detail: { value: number } }) => {
    const idx = e.detail.value;
    setReminderInterval(pickerValues[idx]);
  };

  return (
    <View className={styles.page}>
      <View className={styles.userCard}>
        <View className={styles.avatar}>
          <Text className={styles.avatarIcon}>👤</Text>
        </View>
        <View className={styles.userInfo}>
          <Text className={styles.userName}>用户</Text>
          <Text className={styles.userEmail}>user@example.com</Text>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>今日完成</Text>
        <View className={styles.todayStats}>
          <View className={styles.todayStatIcon}>
            <Text className={styles.todayStatEmoji}>✅</Text>
          </View>
          <View className={styles.todayStatInfo}>
            <Text className={styles.todayStatValue}>{completedTodayCount} 个任务</Text>
            <Text className={styles.todayStatLabel}>
              专注时长 {formatDuration(todayMinutes)}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <View className={styles.sectionHeaderRow}>
          <Text className={styles.sectionTitle}>本周时长统计</Text>
        </View>
        <View className={styles.weekStats}>
          <View className={styles.weekCompareRow}>
            <View className={styles.weekCompareItem}>
              <Text className={styles.weekCompareLabel}>上周</Text>
              <Text className={styles.weekCompareValue}>
                {formatDuration(lastWeekDuration)}
              </Text>
            </View>
            <View className={styles.weekCompareItem}>
              <Text className={styles.weekCompareLabel}>本周</Text>
              <Text className={styles.weekCompareValue}>
                {formatDuration(thisWeekDuration)}
              </Text>
            </View>
          </View>

          <View
            className={`${styles.weekDiffBadge} ${
              weekDiff >= 0 ? styles.weekDiffUp : styles.weekDiffDown
            }`}
          >
            <Text className={styles.weekDiffArrow}>
              {weekDiff >= 0 ? '▲' : '▼'}
            </Text>
            <Text
              className={`${styles.weekDiffText} ${
                weekDiff >= 0 ? styles.weekDiffTextUp : styles.weekDiffTextDown
              }`}
            >
              {weekDiff >= 0 ? '+' : ''}
              {weekDiffPercent}%
            </Text>
          </View>

          {showSelfForgiveness && (
            <View className={`${styles.encourageCard} ${styles.encourageDown}`}>
              <Text className={styles.encourageIcon}>💝</Text>
              <View className={styles.encourageContent}>
                <Text className={styles.encourageTitle}>自我宽恕</Text>
                <Text className={styles.encourageText}>
                  {randomSelfForgiveness}
                </Text>
              </View>
            </View>
          )}

          {showEncouragement && (
            <View className={`${styles.encourageCard} ${styles.encourageUp}`}>
              <Text className={styles.encourageIcon}>👍</Text>
              <View className={styles.encourageContent}>
                <Text className={styles.encourageTitle}>继续加油</Text>
                <Text className={styles.encourageText}>
                  {randomEncouragement}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>拖延诊断</Text>
        {latestEysenck ? (
          <View
            className={styles.diagnosisCard}
            onClick={() => handleNavigate('/pages/diagnosis/index')}
          >
            <View className={styles.diagnosisIcon}>
              <Text className={styles.diagnosisIconEmoji}>🔍</Text>
            </View>
            <View className={styles.diagnosisInfo}>
              <Text className={styles.diagnosisTitle}>最近诊断结果</Text>
              <Text className={styles.diagnosisScore}>
                总评分：{latestEysenck.totalScore} 分
              </Text>
              <View
                className={`${styles.diagnosisLevel} ${levelStyleMap[latestEysenck.interpretation.level] || styles.levelLow}`}
              >
                <Text>
                  {levelTextMap[latestEysenck.interpretation.level] ||
                    latestEysenck.interpretation.level}
                </Text>
              </View>
            </View>
            <Text className={styles.diagnosisArrow}>›</Text>
          </View>
        ) : (
          <View className={styles.diagnosisEmpty}>
            <Text className={styles.diagnosisEmptyText}>暂无诊断记录</Text>
            <View
              className={styles.diagnosisEmptyBtn}
              onClick={() => handleNavigate('/pages/diagnosis/index')}
            >
              <Text className={styles.diagnosisEmptyBtnText}>开始诊断</Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.sectionCard}>
        <ScrollView scrollY>
          <View className={styles.settingsList}>
            <View
              className={styles.settingsItem}
              onClick={() => handleNavigate('/pages/analytics/index')}
            >
              <Text className={styles.settingsIcon}>📊</Text>
              <Text className={styles.settingsLabel}>数据统计</Text>
              <Text className={styles.settingsArrow}>›</Text>
            </View>

            <View
              className={styles.settingsItem}
              onClick={() =>
                Taro.showToast({ title: '个人资料功能开发中', icon: 'none' })
              }
            >
              <Text className={styles.settingsIcon}>👤</Text>
              <Text className={styles.settingsLabel}>个人资料</Text>
              <Text className={styles.settingsArrow}>›</Text>
            </View>

            <View
              className={styles.settingsItem}
              onClick={() =>
                Taro.showToast({ title: '隐私设置功能开发中', icon: 'none' })
              }
            >
              <Text className={styles.settingsIcon}>🔒</Text>
              <Text className={styles.settingsLabel}>隐私设置</Text>
              <Text className={styles.settingsArrow}>›</Text>
            </View>

            <View className={styles.settingsItem}>
              <Text className={styles.settingsIcon}>🔔</Text>
              <Text className={styles.settingsLabel}>通知提醒</Text>
              <Switch
                className={styles.settingsSwitch}
                checked={notifications}
                onChange={(e) =>
                  handleSwitchChange(e.detail.value, setNotifications)
                }
                color='#6366F1'
              />
            </View>

            <View className={styles.settingsItem}>
              <Text className={styles.settingsIcon}>🌙</Text>
              <Text className={styles.settingsLabel}>深色模式</Text>
              <Switch
                className={styles.settingsSwitch}
                checked={darkMode}
                onChange={(e) =>
                  handleSwitchChange(e.detail.value, setDarkMode)
                }
                color='#6366F1'
              />
            </View>

            <View className={styles.settingsItem}>
              <Text className={styles.settingsIcon}>⏰</Text>
              <Text className={styles.settingsLabel}>提醒间隔</Text>
              <Picker
                className={styles.settingsPicker}
                range={pickerOptions}
                onChange={handlePickerChange}
              >
                <View className={styles.settingsValue}>
                  {reminderInterval}分钟 ▾
                </View>
              </Picker>
            </View>

            <View
              className={styles.settingsItem}
              onClick={() =>
                Taro.showToast({ title: '帮助中心开发中', icon: 'none' })
              }
            >
              <Text className={styles.settingsIcon}>❓</Text>
              <Text className={styles.settingsLabel}>帮助中心</Text>
              <Text className={styles.settingsArrow}>›</Text>
            </View>

            <View
              className={styles.settingsItem}
              onClick={() =>
                Taro.showToast({ title: '反馈功能开发中', icon: 'none' })
              }
            >
              <Text className={styles.settingsIcon}>💬</Text>
              <Text className={styles.settingsLabel}>反馈意见</Text>
              <Text className={styles.settingsArrow}>›</Text>
            </View>
          </View>
        </ScrollView>

        <View className={styles.logoutItem} onClick={handleLogout}>
          <Text className={styles.logoutIcon}>🚪</Text>
          <Text>退出登录</Text>
        </View>
      </View>
    </View>
  );
};

export default ProfilePage;