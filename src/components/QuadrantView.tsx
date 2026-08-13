import { useTaskStore } from '@/store/taskStore';
import { AlertCircle, Star, Clock, Coffee } from 'lucide-react';

interface QuadrantViewProps {
  onTaskClick: (taskId: string) => void;
}

const quadrants = [
  {
    key: 'urgent-important',
    title: '紧急重要',
    subtitle: '立即处理',
    icon: AlertCircle,
    bgColor: 'bg-gradient-to-br from-red-500 to-orange-500',
    borderColor: 'border-red-200',
    textColor: 'text-white',
  },
  {
    key: 'important-not-urgent',
    title: '重要不紧急',
    subtitle: '提前规划',
    icon: Star,
    bgColor: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    borderColor: 'border-blue-200',
    textColor: 'text-white',
  },
  {
    key: 'urgent-not-important',
    title: '紧急不重要',
    subtitle: '尽快完成',
    icon: Clock,
    bgColor: 'bg-gradient-to-br from-amber-500 to-yellow-500',
    borderColor: 'border-amber-200',
    textColor: 'text-white',
  },
  {
    key: 'not-urgent-not-important',
    title: '不紧急不重要',
    subtitle: '有空再做',
    icon: Coffee,
    bgColor: 'bg-gradient-to-br from-gray-500 to-gray-600',
    borderColor: 'border-gray-200',
    textColor: 'text-white',
  },
];

export function QuadrantView({ onTaskClick }: QuadrantViewProps) {
  const tasks = useTaskStore((state) => state.tasks);
  const calculateUrgency = useTaskStore((state) => state.calculateUrgency);

  const getTasksByQuadrant = (quadrantKey: string) => {
    return tasks.filter((task) => {
      if (task.status === 'completed') return false;
      
      const urgency = calculateUrgency(task);
      const isImportant = task.importance === 'important';
      const isUrgent = urgency === 'red' || urgency === 'critical';
      
      if (quadrantKey === 'urgent-important') return isImportant && isUrgent;
      if (quadrantKey === 'important-not-urgent') return isImportant && !isUrgent;
      if (quadrantKey === 'urgent-not-important') return !isImportant && isUrgent;
      if (quadrantKey === 'not-urgent-not-important') return !isImportant && !isUrgent;
      return false;
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {quadrants.map((quadrant) => {
        const Icon = quadrant.icon;
        const quadrantTasks = getTasksByQuadrant(quadrant.key);
        
        return (
          <div
            key={quadrant.key}
            className={`relative overflow-hidden rounded-2xl border-2 ${quadrant.borderColor} transition-all duration-300 hover:shadow-lg cursor-pointer`}
            onClick={() => onTaskClick(quadrant.key)}
          >
            <div className={`${quadrant.bgColor} p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={18} className={quadrant.textColor} />
                <h3 className={`font-bold ${quadrant.textColor}`}>{quadrant.title}</h3>
              </div>
              <p className={`text-sm opacity-80 ${quadrant.textColor}`}>{quadrant.subtitle}</p>
            </div>
            
            <div className="bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">待办任务</span>
                <span className={`text-2xl font-bold ${
                  quadrant.key === 'urgent-important' ? 'text-red-500' :
                  quadrant.key === 'important-not-urgent' ? 'text-blue-500' :
                  quadrant.key === 'urgent-not-important' ? 'text-amber-500' : 'text-gray-500'
                }`}>
                  {quadrantTasks.length}
                </span>
              </div>
              
              {quadrantTasks.slice(0, 2).map((task) => (
                <div
                  key={task.id}
                  className="mt-3 p-2 bg-gray-50 rounded-lg truncate text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task.id);
                  }}
                >
                  {task.title}
                </div>
              ))}
              
              {quadrantTasks.length > 2 && (
                <p className="mt-2 text-xs text-gray-400">还有 {quadrantTasks.length - 2} 个任务...</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}