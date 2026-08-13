import { useState } from 'react';
import { Stethoscope, Play, BarChart2, CheckCircle2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { eysenckQuestions, procrastinationReasons } from '@/types';
import type { EysenckDiagnosisResult } from '@/types';

type DiagnosisView = 'welcome' | 'testing' | 'result' | 'history' | 'reasons';

export function Diagnosis() {
  const [currentView, setCurrentView] = useState<DiagnosisView>('welcome');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [result, setResult] = useState<EysenckDiagnosisResult | null>(null);

  const eysenckResults = useTaskStore((state) => state.eysenckResults);
  const addEysenckDiagnosis = useTaskStore((state) => state.addEysenckDiagnosis);

  const handleAnswer = (answer: number) => {
    const question = eysenckQuestions[currentQuestion];
    setAnswers((prev) => ({ ...prev, [question.id]: answer }));
    
    if (currentQuestion < eysenckQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    const scores = {
      decisionalProcrastination: 0,
      avoidantProcrastination: 0,
      arousalProcrastination: 0,
    };

    let decisionalCount = 0;
    let avoidantCount = 0;
    let arousalCount = 0;

    eysenckQuestions.forEach((question) => {
      const answer = answers[question.id] || 3;
      if (question.category === 'decisionalProcrastination') {
        scores.decisionalProcrastination += answer;
        decisionalCount++;
      } else if (question.category === 'avoidantProcrastination') {
        scores.avoidantProcrastination += answer;
        avoidantCount++;
      } else if (question.category === 'arousalProcrastination') {
        scores.arousalProcrastination += answer;
        arousalCount++;
      }
    });

    scores.decisionalProcrastination = Math.round((scores.decisionalProcrastination / decisionalCount) * 10) / 10;
    scores.avoidantProcrastination = Math.round((scores.avoidantProcrastination / avoidantCount) * 10) / 10;
    scores.arousalProcrastination = Math.round((scores.arousalProcrastination / arousalCount) * 10) / 10;

    const totalScore = Math.round(((scores.decisionalProcrastination + scores.avoidantProcrastination + scores.arousalProcrastination) / 3) * 10) / 10;

    let level: 'low' | 'mild' | 'moderate' | 'severe';
    let description: string;
    let suggestions: string[];

    if (totalScore <= 2) {
      level = 'low';
      description = '你的拖延倾向较低，大多数时候能够按时完成任务。这表明你具备良好的自我管理能力。';
      suggestions = [
        '继续保持良好的时间管理习惯',
        '可以尝试设定更高的目标来挑战自己',
        '定期回顾和优化你的工作流程',
      ];
    } else if (totalScore <= 3) {
      level = 'mild';
      description = '你有轻微的拖延倾向，偶尔会将任务推迟到最后一刻。这种情况在压力较大时可能会更明显。';
      suggestions = [
        '尝试使用5分钟启动法来克服拖延',
        '将大任务分解成可管理的小步骤',
        '为自己设定明确的截止日期',
        '减少干扰，创造专注的工作环境',
      ];
    } else if (totalScore <= 4) {
      level = 'moderate';
      description = '你有中度拖延倾向，拖延已经开始影响到你的日常生活和工作效率。需要采取行动来改善。';
      suggestions = [
        '使用四象限法来优先处理任务',
        '寻求朋友或同事的监督和支持',
        '尝试番茄工作法来提高专注力',
        '每天进行自我反思，记录拖延的触发因素',
        '考虑使用习惯追踪工具来建立新习惯',
      ];
    } else {
      level = 'severe';
      description = '拖延已经严重影响到你的生活质量和工作表现。强烈建议采取系统的方法来改变这种状况。';
      suggestions = [
        '寻求专业心理咨询师的帮助',
        '加入拖延互助小组或社群',
        '制定详细的行动计划并严格执行',
        '逐步建立新的工作习惯，从小事开始',
        '练习自我同情，避免过度自责',
      ];
    }

    const newResult: EysenckDiagnosisResult = {
      id: '',
      totalScore,
      subscales: scores,
      interpretation: { level, description, suggestions },
      completedAt: new Date().toISOString(),
    };

    setResult(newResult);
    addEysenckDiagnosis({ totalScore, subscales: scores, interpretation: { level, description, suggestions } });
    setCurrentView('result');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'mild': return 'bg-blue-100 text-blue-700';
      case 'moderate': return 'bg-amber-100 text-amber-700';
      case 'severe': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'low': return '低拖延倾向';
      case 'mild': return '轻度拖延';
      case 'moderate': return '中度拖延';
      case 'severe': return '严重拖延';
      default: return '未知';
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 2) return 'text-green-600';
    if (score <= 3) return 'text-blue-600';
    if (score <= 4) return 'text-amber-600';
    return 'text-red-600';
  };

  const sortedResults = [...eysenckResults].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const getComparison = (current: EysenckDiagnosisResult, previous: EysenckDiagnosisResult | undefined) => {
    if (!previous) return null;
    const diff = current.totalScore - previous.totalScore;
    return {
      diff,
      percent: Math.round((diff / previous.totalScore) * 100),
      improved: diff < 0,
    };
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">拖延诊断</h1>
            <p className="text-gray-500 mt-1">通过科学的量表了解你的拖延状况</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('welcome')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === 'welcome' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            开始诊断
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === 'history' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            历史记录
          </button>
          <button
            onClick={() => setCurrentView('reasons')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === 'reasons' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            常见原因
          </button>
        </div>
      </div>

      {currentView === 'welcome' && (
        <div className="max-w-3xl mx-auto">
          <div className="card bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 mb-8">
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <Stethoscope className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">艾森克拖延量表测试</h2>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                本测试基于艾森克拖延量表，包含20道题目，旨在帮助你了解自己的拖延倾向和类型。
                请根据你的实际情况诚实作答，测试结果仅供参考。
              </p>
              <div className="flex justify-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-medium">1</span>
                  <span>完全不符合</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-medium">5</span>
                  <span>完全符合</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setAnswers({});
                  setCurrentQuestion(0);
                  setCurrentView('testing');
                }}
                className="btn-primary flex items-center gap-2 px-8 py-4 text-lg"
              >
                <Play size={20} />开始测试
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="card text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <BarChart2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">科学评估</h3>
              <p className="text-gray-500 text-sm">基于心理学研究的专业量表</p>
            </div>
            <div className="card text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">追踪变化</h3>
              <p className="text-gray-500 text-sm">记录每次测试，观察进步</p>
            </div>
            <div className="card text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">个性化建议</h3>
              <p className="text-gray-500 text-sm">根据结果提供针对性建议</p>
            </div>
          </div>
        </div>
      )}

      {currentView === 'testing' && (
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">进度</span>
              <span className="text-sm font-medium text-gray-800">
                {currentQuestion + 1} / {eysenckQuestions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / eysenckQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-8 text-center">
              {eysenckQuestions[currentQuestion].text}
            </h2>
            
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`py-4 rounded-xl text-sm font-medium transition-all ${
                    answers[eysenckQuestions[currentQuestion].id] === option
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            
            <div className="flex justify-between mt-6 text-sm text-gray-500">
              <span>1 = 完全不符合</span>
              <span>5 = 完全符合</span>
            </div>
          </div>
        </div>
      )}

      {currentView === 'result' && result && (
        <div className="max-w-3xl mx-auto">
          <div className={`card p-8 ${getLevelColor(result.interpretation.level)}`}>
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{result.totalScore}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {getLevelText(result.interpretation.level)}
              </h2>
              <p className="text-gray-700">{result.interpretation.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="card p-6">
              <p className="text-sm text-gray-500 mb-2">决策拖延</p>
              <p className={`text-3xl font-bold ${getScoreColor(result.subscales.decisionalProcrastination)}`}>
                {result.subscales.decisionalProcrastination}
              </p>
              <p className="text-xs text-gray-400 mt-2">难以做出决定</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500 mb-2">回避拖延</p>
              <p className={`text-3xl font-bold ${getScoreColor(result.subscales.avoidantProcrastination)}`}>
                {result.subscales.avoidantProcrastination}
              </p>
              <p className="text-xs text-gray-400 mt-2">逃避不愉快任务</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500 mb-2">唤醒拖延</p>
              <p className={`text-3xl font-bold ${getScoreColor(result.subscales.arousalProcrastination)}`}>
                {result.subscales.arousalProcrastination}
              </p>
              <p className="text-xs text-gray-400 mt-2">喜欢压力下工作</p>
            </div>
          </div>

          <div className="card mt-6">
            <h3 className="font-semibold text-gray-800 mb-4 px-6 pt-6">针对性建议</h3>
            <div className="space-y-3 pb-6 px-6">
              {result.interpretation.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="text-gray-600">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => {
                setAnswers({});
                setCurrentQuestion(0);
                setResult(null);
                setCurrentView('welcome');
              }}
              className="btn-secondary"
            >
              返回首页
            </button>
            <button
              onClick={() => setCurrentView('reasons')}
              className="btn-primary"
            >
              了解拖延原因
            </button>
          </div>
        </div>
      )}

      {currentView === 'history' && (
        <div className="max-w-3xl mx-auto">
          {sortedResults.length === 0 ? (
            <div className="card text-center py-16">
              <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">暂无诊断记录</p>
              <button
                onClick={() => {
                  setAnswers({});
                  setCurrentQuestion(0);
                  setCurrentView('testing');
                }}
                className="btn-primary mt-4"
              >
                进行首次诊断
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart2 className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-800">诊断历史</h2>
              </div>

              {sortedResults.map((record, index) => {
                const previous = sortedResults[index + 1];
                const comparison = getComparison(record, previous);
                
                return (
                  <div key={record.id} className="card">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getLevelColor(record.interpretation.level)}`}>
                            <span className="text-2xl font-bold">{record.totalScore}</span>
                          </div>
                          <div>
                            <p className={`font-semibold ${getLevelColor(record.interpretation.level).replace('bg-', 'text-').replace('-100', '-700')}`}>
                              {getLevelText(record.interpretation.level)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(record.completedAt).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        
                        {comparison && (
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            comparison.improved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {comparison.improved ? (
                              <TrendingDown className="w-4 h-4" />
                            ) : (
                              <TrendingUp className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">
                              {comparison.improved ? '改善' : '退步'} {Math.abs(comparison.percent)}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-1">决策拖延</p>
                          <p className={`font-bold ${getScoreColor(record.subscales.decisionalProcrastination)}`}>
                            {record.subscales.decisionalProcrastination}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-1">回避拖延</p>
                          <p className={`font-bold ${getScoreColor(record.subscales.avoidantProcrastination)}`}>
                            {record.subscales.avoidantProcrastination}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-1">唤醒拖延</p>
                          <p className={`font-bold ${getScoreColor(record.subscales.arousalProcrastination)}`}>
                            {record.subscales.arousalProcrastination}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {sortedResults.length >= 2 && (
                <div className="card mt-6">
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      纵向对比分析
                    </h3>
                    <div className="flex items-end gap-4 h-48">
                      {sortedResults.slice(0, 5).reverse().map((record) => {
                        const maxScore = 5;
                        const height = (record.totalScore / maxScore) * 100;
                        return (
                          <div key={record.id} className="flex-1 flex flex-col items-center">
                            <div
                              className={`w-full rounded-t-lg transition-all ${
                                record.interpretation.level === 'low' ? 'bg-green-500' :
                                record.interpretation.level === 'mild' ? 'bg-blue-500' :
                                record.interpretation.level === 'moderate' ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ height: `${height}%` }}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(record.completedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {currentView === 'reasons' && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-800">常见拖延原因</h2>
          </div>

          <div className="space-y-4">
            {procrastinationReasons.map((reason) => (
              <div key={reason.id} className="card">
                <div className="p-6">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-medium">
                      {reason.id}
                    </span>
                    {reason.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{reason.description}</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-800 mb-2">应对建议：</p>
                    <ul className="space-y-2">
                      {reason.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}