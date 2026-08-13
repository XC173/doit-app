import { useState } from 'react';
import { X, Target, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

interface DiagnosisModalProps {
  onClose: () => void;
}

const diagnosisQuestions = [
  { id: 1, question: '我常常把重要的事情拖到最后一刻才做', options: [1, 2, 3, 4, 5] },
  { id: 2, question: '我追求完美，常常因为害怕做得不够好而迟迟不开始', options: [1, 2, 3, 4, 5] },
  { id: 3, question: '我经常被社交媒体或娱乐内容分散注意力', options: [1, 2, 3, 4, 5] },
  { id: 4, question: '我对需要完成的任务感到焦虑或压力很大', options: [1, 2, 3, 4, 5] },
  { id: 5, question: '我缺乏足够的动力去开始一项任务', options: [1, 2, 3, 4, 5] },
];

export function DiagnosisModal({ onClose }: DiagnosisModalProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ type: string; description: string; tips: string[] } | null>(null);

  const addDiagnosis = useTaskStore((state) => state.addDiagnosis);

  const handleAnswer = (questionId: number, answer: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const calculateResult = () => {
    const answerValues = Object.values(answers);
    if (answerValues.length !== diagnosisQuestions.length) return;

    const avgScore = answerValues.reduce((a, b) => a + b, 0) / answerValues.length;
    
    let diagnosisResult;
    if (avgScore <= 2) {
      diagnosisResult = {
        type: '轻度拖延',
        description: '你只有轻微的拖延倾向，大多数时候能够按时完成任务。',
        tips: ['保持良好的时间管理习惯', '继续使用Do it!来保持高效'],
      };
    } else if (avgScore <= 3) {
      diagnosisResult = {
        type: '中度拖延',
        description: '你有一定的拖延倾向，在压力下可能会推迟任务。',
        tips: ['尝试使用5分钟启动法', '将大任务分解成小步骤', '设置明确的截止日期'],
      };
    } else if (avgScore <= 4) {
      diagnosisResult = {
        type: '重度拖延',
        description: '拖延已经影响到你的日常生活和工作，需要采取行动改变。',
        tips: ['寻求朋友或同事的监督', '考虑使用番茄工作法', '定期进行自我反思', '必要时寻求专业帮助'],
      };
    } else {
      diagnosisResult = {
        type: '严重拖延',
        description: '拖延严重影响你的生活，建议立即采取行动。',
        tips: ['寻求专业心理咨询', '加入拖延互助小组', '制定详细的行动计划', '逐步建立新的习惯'],
      };
    }

    setResult(diagnosisResult);
    addDiagnosis({
      perfectionism: answerValues[1],
      taskAversion: answerValues[3],
      timeManagement: answerValues[0],
      motivation: answerValues[4],
    });
    setShowResult(true);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">拖延诊断测试</h2>
              <p className="text-sm text-gray-500">了解你的拖延类型</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {showResult && result ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{result.type}</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{result.description}</p>
              <div className="max-w-md mx-auto">
                <p className="font-semibold text-gray-800 mb-3">建议：</p>
                <ul className="space-y-2">
                  {result.tips.map((tip, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={handleClose} className="btn-primary mt-6">
                完成
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 mb-6">请根据你的实际情况回答以下问题（1=完全不符合，5=完全符合）</p>
              <div className="space-y-6">
                {diagnosisQuestions.map((question) => (
                  <div key={question.id} className="p-4 bg-gray-50 rounded-xl">
                    <p className="font-medium text-gray-800 mb-3">{question.id}. {question.question}</p>
                    <div className="flex gap-2">
                      {question.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleAnswer(question.id, option)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            answers[question.id] === option
                              ? 'bg-primary text-white'
                              : 'bg-white border border-gray-200 hover:border-primary/50'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={calculateResult}
                  disabled={Object.keys(answers).length !== diagnosisQuestions.length}
                  className="btn-primary w-full py-4"
                >
                  查看诊断结果
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
