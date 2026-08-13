import React, { useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const TaskFinishPage: React.FC = () => {
  const handleComplete = useCallback(() => {
    Taro.showToast({ title: '已标记为完成', icon: 'success' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 500);
  }, []);

  const handleIncomplete = useCallback(() => {
    Taro.showToast({ title: '继续加油！', icon: 'none' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 500);
  }, []);

  const handleBack = useCallback(() => {
    Taro.navigateBack();
  }, []);

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <View className={styles.iconWrapper}>
          <Text className={styles.iconText}>🎯</Text>
        </View>
        <Text className={styles.title}>任务完成</Text>
        <Text className={styles.subtitle}>
          你完成了这次工作时段，标记一下完成情况吧！
        </Text>

        <View className={styles.buttonGroup}>
          <View className={styles.btnComplete} onClick={handleComplete}>
            <Text className={styles.btnCompleteText}>✓ 完成</Text>
          </View>
          <View className={styles.btnIncomplete} onClick={handleIncomplete}>
            <Text className={styles.btnIncompleteText}>↺ 未完成</Text>
          </View>
        </View>

        <View className={styles.backLink} onClick={handleBack}>
          <Text className={styles.backLinkText}>← 返回详情</Text>
        </View>
      </View>
    </View>
  );
};

export default TaskFinishPage;