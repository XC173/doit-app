import { CheckCircle2, Circle, ChevronRight, Clock, Trash2, Play, RotateCcw } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onClick, onComplete, onDelete }: TaskCardProps) {
  const startTaskWork = useTaskStore((state) => state.startTaskWork);
  const restartTask = useTaskStore((state) => state.restartTask);
  const getQuadrantColor = useTaskStore((state) => state.getQuadrantColor);
  const calculateUrgency = useTaskStore((state) => state.calculateUrgency);

  const formatDate = (dateString: string | 'long-term') => {
    if (dateString === 'long-term') return '长期任务';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

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
    <div
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
        quadrantColor.includes('bg-red') ? 'bg-red-50 border-red-200' :
        quadrantColor.includes('bg-blue') ? 'bg-blue-50 border-blue-200' :
        quadrantColor.includes('bg-amber') ? 'bg-amber-50 border-amber-200' :
        quadrantColor.includes('bg-purple') ? 'bg-purple-50 border-purple-200' :
        'bg-gray-50 border-gray-200'
      } ${task.status === 'completed' ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="mt-0.5 flex-shrink-0"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="w-6 h-6 text-secondary" />
          ) : (
            <Circle className="w-6 h-6 text-gray-300 hover:text-secondary transition-colors" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${quadrantColor}`}>
              {quadrantLabel}
            </span>
            {task.status === 'in-progress' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                进行中
              </span>
            )}
          </div>
          
          <h3 className={`font-semibold text-gray-800 mb-1 ${task.status === 'completed' ? 'line-through' : ''}`}>
            {task.title}
          </h3>
          
          {task.subtasks.length > 0 && (
            <p className="text-sm text-gray-500 mb-2">
              {completedSubtasks}/{task.subtasks.length} 子任务完成
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(task.deadline)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {task.status !== 'completed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startTaskWork(task.id);
              }}
              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0"
              title="开始处理"
            >
              <Play size={16} />
            </button>
          )}
          {task.status === 'completed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                restartTask(task.id);
              }}
              className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors flex-shrink-0"
              title="重新进行"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
      </div>
    </div>
  );
}