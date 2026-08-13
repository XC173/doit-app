import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useTaskStore } from '@/store/taskStore';
import { eysenckQuestions } from '@/types';
import type { EysenckDiagnosisResult } from '@/types';
import styles from './index.module.scss';

type PagePhase = 'welcome' | 'test' | 'result';

const scaleOptions = [
  { value: 1, label: '完全不符合' },
  { value: 2, label: '基本不符合' },
  { value: 3, label: '不确定' },
  { value: 4, label: '基本符合' },
  { value: 5, label: '完全符合' },
];

const DiagnosisPage: React.FC = () => {
  const eysenckResults = useTaskStore((state) => state.eysenckResults);
  const addEysenckDiagnosis = useTaskStore((state) => state.addEysenckDiagnosis);
  const mockData = useTaskStore((state) => state.mockData);

  const [phase, setPhase] = useState<PagePhase>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [testResult, setTestResult] = useState<EysenckDiagnosisResult | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    mockData();
    // 检查是否首次诊断
    const instance = Taro.getCurrentInstance();
    const params = instance.router?.params;
    if (params?.firstTime === 'true') {
      setIsFirstTime(true);
    }
  }, [mockData]);

  const totalQuestions = eysenckQuestions.length;
  const currentQuestion = eysenckQuestions[currentQuestionIndex];
  const progress = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

  const handleStartTest = useCallback(() => {
    setPhase('test');
    setCurrentQuestionIndex(0);
    setAnswers({});
  }, []);

  const handleSelectAnswer = useCallback((value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  }, [currentQuestion]);

  const handleNext = useCallback(() => {
    const currentAnswer = answers[currentQuestion.id];
    if (currentAnswer === undefined) {
      Taro.showToast({ title: '请选择一个选项', icon: 'none' });
      return;
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      calculateAndShowResult();
    }
  }, [answers, currentQuestion, currentQuestionIndex, totalQuestions]);

  const handlePrev = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const calculateAndShowResult = useCallback(() => {
    let decisionalProcrastination = 0;
    let avoidantProcrastination = 0;
    let arousalProcrastination = 0;

    eysenckQuestions.forEach((q) => {
      const score = answers[q.id] || 3;
      switch (q.category) {
        case 'decisionalProcrastination':
          decisionalProcrastination += score;
          break;
        case 'avoidantProcrastination':
          avoidantProcrastination += score;
          break;
        case 'arousalProcrastination':
          arousalProcrastination += score;
          break;
      }
    });

    const totalScore = decisionalProcrastination + avoidantProcrastination + arousalProcrastination;
    const maxScore = totalQuestions * 5;
    const percentage = (totalScore / maxScore) * 100;

    let level: EysenckDiagnosisResult['interpretation']['level'];
    let description: string;
    let suggestions: string[];

    if (percentage < 30) {
      level = 'low';
      description = '你的拖延倾向较低，能够较好地管理时间和行动。保持这种良好的习惯！';
      suggestions = [
        '继续保持现有的时间管理策略',
        '可以尝试更具挑战性的目标来提升自己',
        '帮助身边有拖延困扰的朋友',
      ];
    } else if (percentage < 50) {
      level = 'mild';
      description = '你有轻度的拖延倾向，偶尔会推迟一些任务。通过一些小调整可以进一步改善。';
      suggestions = [
        '使用"5分钟启动法"开始任务',
        '将大任务分解为小步骤',
        '建立明确的优先级和截止日期',
        '减少干扰因素，保持专注',
      ];
    } else if (percentage < 70) {
      level = 'moderate';
      description = '你有中度的拖延倾向，经常会推迟重要任务。建议采取系统性的方法来改善。';
      suggestions = [
        '认识拖延的原因（完美主义、恐惧失败等）',
        '使用"番茄工作法"提高专注度',
        '设定明确、可衡量的目标',
        '建立责任感，可以与他人分享进度',
        '学会对不合理的要求说"不"',
      ];
    } else {
      level = 'severe';
      description = '你有较严重的拖延倾向，拖延已经影响到了你的日常生活和工作。建议认真对待这个问题。';
      suggestions = [
        '寻求专业心理咨询师的帮助',
        '深入探索拖延背后的情绪和心理原因',
        '建立结构化的日常作息和工作习惯',
        '加入支持小组，与有类似经历的人交流',
        '从最小的改变开始，逐步建立新的行为模式',
        '对自己保持耐心和温柔',
      ];
    }

    const result: EysenckDiagnosisResult = {
      id: '',
      totalScore,
      subscales: {
        decisionalProcrastination,
        avoidantProcrastination,
        arousalProcrastination,
      },
      interpretation: {
        level,
        description,
        suggestions,
      },
      completedAt: new Date().toISOString(),
    };

    addEysenckDiagnosis({
      totalScore,
      subscales: result.subscales,
      interpretation: result.interpretation,
    } as Omit<EysenckDiagnosisResult, 'id' | 'completedAt'>);

    // 标记已完成首次诊断
    if (isFirstTime) {
      Taro.setStorageSync('hasCompletedDiagnosis', true);
    }

    setTestResult(result);
    setPhase('result');
  }, [answers, addEysenckDiagnosis, totalQuestions, isFirstTime]);

  const handleRetry = useCallback(() => {
    setPhase('welcome');
    setTestResult(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
  }, []);

  const handleBackHome = useCallback(() => {
    Taro.switchTab({ url: '/pages/home/index' });
  }, []);

  const getLevelText = (level: string) => {
    switch (level) {
      case 'low':
        return '低拖延';
      case 'mild':
        return '轻度拖延';
      case 'moderate':
        return '中度拖延';
      case 'severe':
        return '严重拖延';
      default:
        return '';
    }
  };

  const getLevelClass = (level: string) => {
    switch (level) {
      case 'low':
        return styles.resultLevelLow;
      case 'mild':
        return styles.resultLevelMild;
      case 'moderate':
        return styles.resultLevelModerate;
      case 'severe':
        return styles.resultLevelSevere;
      default:
        return '';
    }
  };

  const getSubscaleName = (key: string) => {
    switch (key) {
      case 'decisionalProcrastination':
        return '决策拖延';
      case 'avoidantProcrastination':
        return '回避拖延';
      case 'arousalProcrastination':
        return '唤醒型拖延';
      default:
        return key;
    }
  };

  const getSubscaleColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage < 30) return '#10B981';
    if (percentage < 50) return '#3B82F6';
    if (percentage < 70) return '#F59E0B';
    return '#EF4444';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <View className={styles.page}>
      {phase === 'welcome' && (
        <>
          <View className={styles.welcomeCard}>
            <Text className={styles.welcomeIcon}>🔍</Text>
            <Text className={styles.welcomeTitle}>拖延诊断</Text>
            <Text className={styles.welcomeDesc}>
              基于艾森克拖延量表（Eysenck Procrastination Scale），
              通过20道问题帮助你了解自己的拖延类型和程度。
            </Text>
            <View className={styles.startBtn} onClick={handleStartTest}>
              <Text className={styles.startBtnText}>开始诊断</Text>
            </View>
          </View>

          {eysenckResults.length > 0 && (
            <View className={styles.historySection}>
              <View className={styles.historyHeader}>
                <Text className={styles.historyTitle}>历史记录</Text>
                <Text className={styles.historyCount}>{eysenckResults.length} 次诊断</Text>
              </View>
              <ScrollView scrollY className={styles.historyList}>
                {eysenckResults.map((result) => (
                  <View key={result.id} className={styles.historyItem}>
                    <View className={styles.historyInfo}>
                      <Text className={styles.historyDate}>
                        {formatDate(result.completedAt)}
                      </Text>
                      <Text className={styles.historyDetail}>
                        {getLevelText(result.interpretation.level)} · 总得分 {result.totalScore}
                      </Text>
                    </View>
                    <Text
                      className={styles.historyScore}
                      style={{
                        color: getSubscaleColor(result.totalScore, totalQuestions * 5),
                      }}
                    >
                      {result.totalScore}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      )}

      {phase === 'test' && (
        <>
          <View className={styles.progressSection}>
            <View className={styles.progressHeader}>
              <Text className={styles.progressLabel}>
                问题 {currentQuestionIndex + 1} / {totalQuestions}
              </Text>
              <Text className={styles.progressPercent}>{progress}%</Text>
            </View>
            <View className={styles.progressBar}>
              <View className={styles.progressFill} style={{ width: `${progress}%` }} />
            </View>
          </View>

          <View className={styles.questionCard}>
            <Text className={styles.questionNumber}>
              第 {currentQuestionIndex + 1} 题
            </Text>
            <Text className={styles.questionText}>{currentQuestion.text}</Text>

            <View className={styles.scaleGroup}>
              {scaleOptions.map((option) => {
                const selected = answers[currentQuestion.id] === option.value;
                return (
                  <View
                    key={option.value}
                    className={`${styles.scaleOption} ${selected ? styles.scaleOptionActive : ''}`}
                    onClick={() => handleSelectAnswer(option.value)}
                  >
                    <View className={styles.scaleNumber}>
                      <Text>{option.value}</Text>
                    </View>
                    <Text className={styles.scaleLabel}>{option.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View className={styles.btnRow}>
            <View
              className={styles.prevBtn}
              style={{ opacity: currentQuestionIndex === 0 ? 0.5 : 1 }}
              onClick={currentQuestionIndex > 0 ? handlePrev : undefined}
            >
              <Text className={styles.prevBtnText}>← 上一题</Text>
            </View>
            <View className={styles.nextBtn} onClick={handleNext}>
              <Text className={styles.nextBtnText}>
                {currentQuestionIndex === totalQuestions - 1 ? '查看结果' : '下一题 →'}
              </Text>
            </View>
          </View>
        </>
      )}

      {phase === 'result' && testResult && (
        <>
          <View className={styles.resultCard}>
            <View className={styles.resultHeader}>
              <Text className={styles.resultIcon}>
                {testResult.interpretation.level === 'low' ? '🎉' : testResult.interpretation.level === 'mild' ? '👍' : testResult.interpretation.level === 'moderate' ? '💪' : '🌟'}
              </Text>
              <Text className={styles.resultTitle}>诊断结果</Text>
              <View className={`${styles.resultLevel} ${getLevelClass(testResult.interpretation.level)}`}>
                <Text>{getLevelText(testResult.interpretation.level)}</Text>
              </View>
              <Text className={styles.resultScore}>
                总得分：{testResult.totalScore} / {totalQuestions * 5}
              </Text>
              <Text className={styles.resultDesc}>{testResult.interpretation.description}</Text>
            </View>

            <View className={styles.subscaleSection}>
              <Text className={styles.subscaleTitle}>各维度得分</Text>
              {Object.entries(testResult.subscales).map(([key, value]) => {
                const maxScore = Math.floor(totalQuestions / 3) * 5;
                const percentage = (value / maxScore) * 100;
                return (
                  <View key={key} className={styles.subscaleBar}>
                    <View className={styles.subscaleInfo}>
                      <Text className={styles.subscaleLabel}>{getSubscaleName(key)}</Text>
                      <Text className={styles.subscaleValue}>
                        {value} / {maxScore}
                      </Text>
                    </View>
                    <View className={styles.subscaleProgressBar}>
                      <View
                        className={styles.subscaleProgressFill}
                        style={{
                          width: `${percentage}%`,
                          background: getSubscaleColor(value, maxScore),
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            <View className={styles.suggestionsSection}>
              <Text className={styles.suggestionsTitle}>改善建议</Text>
              <View className={styles.suggestionList}>
                {testResult.interpretation.suggestions.map((suggestion, index) => (
                  <View key={index} className={styles.suggestionItem}>
                    <Text className={styles.suggestionIcon}>💡</Text>
                    <Text className={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.finishBtn} onClick={handleBackHome}>
              <Text className={styles.finishBtnText}>{isFirstTime ? '开始使用' : '返回首页'}</Text>
            </View>

            {!isFirstTime && (
              <View className={styles.retryBtn} onClick={handleRetry}>
                <Text className={styles.retryBtnText}>重新测试</Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
};

export default DiagnosisPage;