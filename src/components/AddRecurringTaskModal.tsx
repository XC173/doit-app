import { useState } from 'react';
import { X, Save, Repeat } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

interface AddRecurringTaskModalProps {
  onClose: () => void;
}

const dayOptions = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
];

export function AddRecurringTaskModal({ onClose }: AddRecurringTaskModalProps) {
  const addRecurringTask = useTaskStore((state) => state.addRecurringTask);
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    importance: 'important' | 'not-important';
    difficulty: 'easy' | 'medium' | 'hard';
    startTime: string;
    duration: number;
    recurrenceType: 'daily' | 'weekdays' | 'custom';
    customDays: number[];
    startDate: string;
    endDate: string | null;
  }>({
    title: '',
    description: '',
    importance: 'important',
    difficulty: 'medium',
    startTime: '09:00',
    duration: 60,
    recurrenceType: 'daily',
    customDays: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    
    addRecurringTask({
      title: formData.title.trim(),
      description: formData.description.trim(),
      importance: formData.importance,
      difficulty: formData.difficulty,
      startTime: formData.startTime,
      duration: formData.duration,
      recurrenceType: formData.recurrenceType,
      customDays: formData.customDays,
      startDate: formData.startDate,
      endDate: formData.endDate || null,
    });
    
    onClose();
  };

  const handleDayToggle = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      customDays: prev.customDays.includes(day)
        ? prev.customDays.filter((d) => d !== day)
        : [...prev.customDays, day],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Repeat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">创建日常任务</h2>
              <p className="text-sm text-gray-500">设置重复出现的任务</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务名称</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="输入任务名称..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="输入任务描述..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">重要性</label>
              <select
                value={formData.importance}
                onChange={(e) => setFormData({ ...formData, importance: e.target.value as 'important' | 'not-important' })}
                className="input-field"
              >
                <option value="important">重要</option>
                <option value="not-important">不重要</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                className="input-field"
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时长（分钟）</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                min="1"
                max="1440"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">重复方式</label>
            <div className="flex gap-2">
              {[
                { value: 'daily', label: '每天' },
                { value: 'weekdays', label: '工作日' },
                { value: 'custom', label: '自定义' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, recurrenceType: option.value as 'daily' | 'weekdays' | 'custom' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.recurrenceType === option.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {formData.recurrenceType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择日期</label>
              <div className="grid grid-cols-7 gap-2">
                {dayOptions.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => handleDayToggle(day.value)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.customDays.includes(day.value)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期（可选）</label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="btn-secondary flex-1">
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Save size={18} />保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
