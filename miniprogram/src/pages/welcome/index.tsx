import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const FEATURES = [
  {
    icon: '📋',
    title: '四象限任务管理',
    description: '基于紧急重要程度智能分类，一目了然掌握任务优先级',
  },
  {
    icon: '⏱',
    title: '专注计时',
    description: '5分钟启动法帮助克服拖延，记录每一次专注时光',
  },
  {
    icon: '📊',
    title: '时间记录',
    description: '24小时时间线可视化，清晰了解时间去向',
  },
  {
    icon: '🔍',
    title: '拖延诊断',
    description: '艾森克拖延量表专业测评，了解你的拖延类型',
  },
  {
    icon: '📅',
    title: '日程管理',
    description: '日历视图管理任务，节假日一目了然',
  },
  {
    icon: '💪',
    title: '自我宽恕',
    description: '科学的认知重评策略，温柔地对待自己的拖延',
  },
];

const WelcomePage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleStart = async () => {
    // 标记已查看欢迎页
    try {
      await Taro.setStorageSync('hasSeenWelcome', true);
    } catch (e) {
      console.error('存储失败', e);
    }

    // 检查是否已完成首次诊断
    const hasCompletedDiagnosis = await Taro.getStorageSync('hasCompletedDiagnosis');

    if (hasCompletedDiagnosis) {
      // 已完成诊断，直接进入首页
      Taro.switchTab({ url: '/pages/home/index' });
    } else {
      // 跳转到诊断页
      Taro.navigateTo({ url: '/pages/diagnosis/index?firstTime=true' });
    }
  };

  const handleSkip = async () => {
    try {
      await Taro.setStorageSync('hasSeenWelcome', true);
      await Taro.setStorageSync('hasCompletedDiagnosis', true);
    } catch (e) {
      console.error('存储失败', e);
    }
    Taro.switchTab({ url: '/pages/home/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <View className={styles.logo}>
          <Text className={styles.logoIcon}>🚀</Text>
        </View>
        <Text className={styles.appName}>Do-It</Text>
        <Text className={styles.tagline}>专注与拖延管理助手</Text>
      </View>

      <ScrollView scrollY className={styles.featuresScroll}>
        <View className={styles.features}>
          <Text className={styles.featuresTitle}>核心功能</Text>
          <View className={styles.featureList}>
            {FEATURES.map((feature, index) => (
              <View key={index} className={styles.featureItem}>
                <View className={styles.featureIcon}>
                  <Text>{feature.icon}</Text>
                </View>
                <View className={styles.featureContent}>
                  <Text className={styles.featureTitle}>{feature.title}</Text>
                  <Text className={styles.featureDesc}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.howItWorks}>
          <Text className={styles.sectionTitle}>工作流程</Text>
          <View className={styles.stepsList}>
            <View className={styles.stepItem}>
              <View className={styles.stepNumber}>
                <Text>1</Text>
              </View>
              <View className={styles.stepContent}>
                <Text className={styles.stepTitle}>诊断拖延类型</Text>
                <Text className={styles.stepDesc}>通过艾森克量表了解你的拖延特点</Text>
              </View>
            </View>
            <View className={styles.stepItem}>
              <View className={styles.stepNumber}>
                <Text>2</Text>
              </View>
              <View className={styles.stepContent}>
                <Text className={styles.stepTitle}>管理任务</Text>
                <Text className={styles.stepDesc}>用四象限法规划和追踪任务</Text>
              </View>
            </View>
            <View className={styles.stepItem}>
              <View className={styles.stepNumber}>
                <Text>3</Text>
              </View>
              <View className={styles.stepContent}>
                <Text className={styles.stepTitle}>专注工作</Text>
                <Text className={styles.stepDesc}>5分钟启动法开始每个任务</Text>
              </View>
            </View>
            <View className={styles.stepItem}>
              <View className={styles.stepNumber}>
                <Text>4</Text>
              </View>
              <View className={styles.stepContent}>
                <Text className={styles.stepTitle}>记录回顾</Text>
                <Text className={styles.stepDesc}>查看时间记录，持续优化</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.tips}>
          <Text className={styles.sectionTitle}>💡 小贴士</Text>
          <View className={styles.tipCard}>
            <Text className={styles.tipText}>
              • 完成比完美更重要{'\n'}
              • 先开始5分钟，看看感觉如何{'\n'}
              • 动机往往在行动之后才出现{'\n'}
              • 对自己温柔一些，改变需要时间
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className={styles.footer}>
        <View className={styles.startBtn} onClick={handleStart}>
          <Text className={styles.startBtnText}>开始使用</Text>
        </View>
        <View className={styles.skipBtn} onClick={handleSkip}>
          <Text className={styles.skipBtnText}>跳过，稍后再说</Text>
        </View>
      </View>
    </View>
  );
};

export default WelcomePage;