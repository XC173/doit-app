import { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import type { ImportanceType, DifficultyType } from '@/types';
import { track } from '@/utils/track';

interface AddTaskModalProps {
  onClose: () => void;
}

const importanceOptions: { value: ImportanceType; label: string; color: string }[] = [
  { value: 'important', label: '重要', color: 'bg-blue-500' },
  { value: 'not-important', label: '不重要', color: 'bg-gray-500' },
];

const difficultyOptions: { value: DifficultyType; label: string; color: string }[] = [
  { value: 'easy', label: '简单', color: 'bg-green-500' },
  { value: 'medium', label: '中等', color: 'bg-amber-500' },
  { value: 'hard', label: '困难', color: 'bg-red-500' },
];

export function AddTaskModal({ onClose }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<ImportanceType>('important');
  const [difficulty, setDifficulty] = useState<DifficultyType>('medium');
  const [startTime, setStartTime] = useState(() => new Date().toISOString().split('T')[0]);
  const [deadlineType, setDeadlineType] = useState<'date' | 'long-term'>('date');
  const [deadline, setDeadline] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>(['', '', '']);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const addTask = useTaskStore((state) => state.addTask);

  const generateSubtasks = () => {
    if (!title.trim()) return;

    setIsAiGenerating(true);

    // 埋点：AI分解困难任务使用
    track('ai_subtask_used', { taskTitle: title, difficulty });

    setTimeout(() => {
      const aiSuggestions: Record<string, string[]> = {
        '报告': ['收集相关资料', '整理数据', '撰写初稿', '审核修改', '最终定稿'],
        '项目': ['需求分析', '制定计划', '分配任务', '执行开发', '测试验收', '上线部署'],
        '学习': ['了解基础知识', '阅读文档', '实践练习', '总结笔记', '复习巩固'],
        '会议': ['确定议程', '准备材料', '邀请参会者', '主持会议', '整理纪要'],
        '邮件': ['阅读邮件', '分类整理', '撰写回复', '跟进处理', '归档记录'],
        '代码': ['需求分析', '编写代码', '单元测试', '代码审查', '修复bug'],
        '设计': ['需求调研', '草图设计', '方案评审', '细节完善', '交付验收'],
        '调研': ['确定目标', '收集信息', '数据分析', '撰写报告', '汇报结果'],
      };
      
      let suggestions: string[] = [];
      for (const [keyword, items] of Object.entries(aiSuggestions)) {
        if (title.includes(keyword)) {
          suggestions = items;
          break;
        }
      }
      
      if (suggestions.length === 0) {
        suggestions = [
          '明确目标和范围',
          '制定详细计划',
          '分解主要步骤',
          '逐一执行',
          '检查和复盘',
        ];
      }
      
      setSubtasks(suggestions.slice(0, 6));
      setIsAiGenerating(false);
    }, 1000);
  };

  const handleDifficultyChange = (newDifficulty: DifficultyType) => {
    setDifficulty(newDifficulty);
    if (newDifficulty === 'hard' && !showBreakdown) {
      const shouldBreakdown = window.confirm('这是一个困难任务，是否需要帮助拆解为子任务？');
      if (shouldBreakdown) {
        setShowBreakdown(true);
      }
    } else if (newDifficulty !== 'hard') {
      setShowBreakdown(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskSubtasks = showBreakdown
      ? subtasks.filter((s) => s.trim()).map((title) => ({ id: Math.random().toString(36).substring(2, 15), title, completed: false }))
      : [];

    addTask({
      title: title.trim(),
      description: description.trim(),
      importance,
      difficulty,
      startTime: new Date(startTime).toISOString(),
      deadline: deadlineType === 'long-term' ? 'long-term' : new Date(deadline).toISOString(),
      status: 'pending',
      subtasks: taskSubtasks,
    });

    onClose();
  };

  const updateSubtask = (index: number, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };

  const addSubtaskField = () => {
    if (subtasks.length < 6) {
      setSubtasks([...subtasks, '']);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">添加新任务</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入任务标题..."
              className="input-field"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入任务描述..."
              className="input-field resize-none"
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">重要性</label>
            <div className="grid grid-cols-2 gap-2">
              {importanceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setImportance(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    importance === option.value
                      ? `${option.color} text-white shadow-md`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">难度</label>
            <div className="grid grid-cols-3 gap-2">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleDifficultyChange(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    difficulty === option.value
                      ? `${option.color} text-white shadow-md`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">截止日期</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setDeadlineType('date')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  deadlineType === 'date'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                指定日期
              </button>
              <button
                type="button"
                onClick={() => setDeadlineType('long-term')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  deadlineType === 'long-term'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                长期任务
              </button>
            </div>
            {deadlineType === 'date' && (
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input-field"
              />
            )}
            {deadlineType === 'long-term' && (
              <p className="text-sm text-purple-600 bg-purple-50 p-2 rounded-lg">
                长期任务没有固定截止日期，紧急程度将始终显示为紫色
              </p>
            )}
          </div>
          
          {showBreakdown && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">子任务拆解</label>
                <button
                  type="button"
                  onClick={generateSubtasks}
                  disabled={isAiGenerating || !title.trim()}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isAiGenerating || !title.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-md'
                  }`}
                >
                  <Sparkles size={14} className={isAiGenerating ? 'animate-spin' : ''} />
                  {isAiGenerating ? 'AI分析中...' : 'AI协助拆解'}
                </button>
              </div>
              <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={subtask}
                      onChange={(e) => updateSubtask(index, e.target.value)}
                      placeholder={`子任务 ${index + 1}...`}
                      className="input-field flex-1 text-sm"
                    />
                  </div>
                ))}
                {subtasks.length < 6 && (
                  <button
                    type="button"
                    onClick={addSubtaskField}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Plus size={16} />添加子任务
                  </button>
                )}
              </div>
            </div>
          )}
          
          <button type="submit" className="btn-primary w-full mt-6">
            创建任务
          </button>
        </form>
      </div>
    </div>
  );
}