import { useState } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

interface AddQuickTaskModalProps {
  onClose: () => void;
}

export function AddQuickTaskModal({ onClose }: AddQuickTaskModalProps) {
  const addTask = useTaskStore((state) => state.addTask);
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    importance: 'important' | 'not-important';
  }>({
    title: '',
    description: '',
    importance: 'important',
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    addTask({
      title: formData.title.trim(),
      description: formData.description.trim(),
      importance: formData.importance,
      difficulty: 'easy',
      startTime: new Date().toISOString(),
      deadline: tomorrow.toISOString(),
      status: 'pending',
      subtasks: [],
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">添加临时任务</h2>
              <p className="text-sm text-gray-500">任务时长固定为1天</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">描述（可选）</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="输入任务描述..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

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
