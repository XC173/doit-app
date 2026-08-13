import { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import type { Task, ImportanceType } from '@/types';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onStartWork?: (taskId: string) => void;
}

const importanceOptions: { value: ImportanceType; label: string; color: string }[] = [
  { value: 'important', label: '重要', color: 'bg-blue-500' },
  { value: 'not-important', label: '不重要', color: 'bg-gray-500' },
];

export function TaskDetailModal({ task, onClose, onStartWork }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImportance, setEditImportance] = useState<ImportanceType>('important');
  const [editDeadlineType, setEditDeadlineType] = useState<'date' | 'long-term'>('date');
  const [editDeadline, setEditDeadline] = useState('');

  const updateTask = useTaskStore((state) => state.updateTask);
  const addSubtask = useTaskStore((state) => state.addSubtask);
  const toggleSubtask = useTaskStore((state) => state.toggleSubtask);
  const deleteSubtask = useTaskStore((state) => state.deleteSubtask);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const getQuadrantColor = useTaskStore((state) => state.getQuadrantColor);
  const calculateUrgency = useTaskStore((state) => state.calculateUrgency);

  if (!task) return null;

  const handleStartEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditImportance(task.importance);
    setEditDeadlineType(task.deadline === 'long-term' ? 'long-term' : 'date');
    setEditDeadline(task.deadline === 'long-term' ? '' : new Date(task.deadline).toISOString().split('T')[0]);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateTask(task.id, {
      title: editTitle,
      description: editDescription,
      importance: editImportance,
      deadline: editDeadlineType === 'long-term' ? 'long-term' : new Date(editDeadline).toISOString(),
    });
    setIsEditing(false);
  };

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      addSubtask(task.id, { title: subtaskInput.trim(), completed: false });
      setSubtaskInput('');
    }
  };

  const getQuadrantLabel = () => {
    const urgency = calculateUrgency(task);
    const isImportant = task.importance === 'important';
    const isUrgent = urgency === 'red' || urgency === 'critical';
    
    if (urgency === 'long-term') return '长期任务';
    if (isImportant && isUrgent) return '紧急重要';
    if (isImportant && !isUrgent) return '重要不紧急';
    if (!isImportant && isUrgent) return '紧急不重要';
    return '不紧急不重要';
  };

  const quadrantColor = getQuadrantColor(task);
  const quadrantLabel = getQuadrantLabel();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">任务详情</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">任务标题</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">重要性</label>
                <div className="grid grid-cols-2 gap-2">
                  {importanceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setEditImportance(option.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        editImportance === option.value
                          ? `${option.color} text-white`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setEditDeadlineType('date')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      editDeadlineType === 'date'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    指定日期
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDeadlineType('long-term')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      editDeadlineType === 'long-term'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    长期任务
                  </button>
                </div>
                {editDeadlineType === 'date' && (
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="input-field"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} className="btn-primary flex-1">保存</button>
                <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1">取消</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${quadrantColor}`}>
                    {quadrantLabel}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-600' :
                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.status === 'completed' ? '已完成' :
                     task.status === 'in-progress' ? '进行中' : '待处理'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">{task.title}</h3>
                {task.description && (
                  <p className="text-gray-600 mt-2">{task.description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <button onClick={handleStartEdit} className="btn-secondary">编辑</button>
                {task.status === 'pending' ? (
                  <button
                    onClick={() => {
                      onClose();
                      onStartWork?.(task.id);
                    }}
                    className="btn-primary"
                  >
                    开始处理
                  </button>
                ) : (
                  <button onClick={() => toggleTaskStatus(task.id)} className="btn-primary">
                    {task.status === 'completed' ? '标记为待处理' : '标记为完成'}
                  </button>
                )}
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">子任务</h4>
                
                {task.subtasks.length === 0 ? (
                  <p className="text-gray-400 text-sm">暂无子任务</p>
                ) : (
                  <ul className="space-y-2">
                    {task.subtasks.map((subtask) => (
                      <li key={subtask.id} className="flex items-center gap-3">
                        <button
                          onClick={() => toggleSubtask(task.id, subtask.id)}
                          className="flex-shrink-0"
                        >
                          {subtask.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-secondary" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 hover:text-secondary" />
                          )}
                        </button>
                        <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {subtask.title}
                        </span>
                        <button
                          onClick={() => deleteSubtask(task.id, subtask.id)}
                          className="p-1 text-gray-400 hover:text-danger transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder="添加子任务..."
                    className="input-field flex-1 text-sm"
                  />
                  <button onClick={handleAddSubtask} className="btn-primary">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}