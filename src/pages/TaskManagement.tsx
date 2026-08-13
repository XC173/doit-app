import { useState } from 'react';
import { Plus, Search, Filter, Repeat, Upload } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { TaskCard } from '@/components/TaskCard';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { AddTaskModal } from '@/components/AddTaskModal';
import { AddRecurringTaskModal } from '@/components/AddRecurringTaskModal';
import { ImportTasksModal } from '@/components/ImportTasksModal';
import { QuadrantView } from '@/components/QuadrantView';
import type { Task } from '@/types';

type FilterType = 'all' | 'pending' | 'in-progress' | 'completed';
type StatFilter = 'all' | 'pending' | 'in-progress' | 'completed';
type QuadrantFilter = 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'not-urgent-not-important' | 'long-term';

export function TaskManagement() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [statFilter, setStatFilter] = useState<StatFilter>('all');
  const [quadrantFilter, setQuadrantFilter] = useState<QuadrantFilter | null>(null);

  const tasks = useTaskStore((state) => state.tasks);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const calculateUrgency = useTaskStore((state) => state.calculateUrgency);
  const startTaskWork = useTaskStore((state) => state.startTaskWork);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || task.status === filter;
    
    if (statFilter !== 'all') {
      if (task.status !== statFilter) return false;
    }
    
    if (quadrantFilter) {
      const urgency = calculateUrgency(task);
      const isImportant = task.importance === 'important';
      const isUrgent = urgency === 'red' || urgency === 'critical';
      
      switch (quadrantFilter) {
        case 'urgent-important':
          if (!(isImportant && isUrgent)) return false;
          break;
        case 'important-not-urgent':
          if (!(isImportant && !isUrgent)) return false;
          break;
        case 'urgent-not-important':
          if (!(!isImportant && isUrgent)) return false;
          break;
        case 'not-urgent-not-important':
          if (!(!isImportant && !isUrgent)) return false;
          break;
        case 'long-term':
          if (urgency !== 'long-term') return false;
          break;
      }
    }
    
    return matchesSearch && matchesFilter;
  });

  const getQuadrantCount = (quadrantKey: string) => {
    return tasks.filter((task) => {
      const urgency = calculateUrgency(task);
      const isImportant = task.importance === 'important';
      const isUrgent = urgency === 'red' || urgency === 'critical';
      
      if (quadrantKey === 'urgent-important') return isImportant && isUrgent;
      if (quadrantKey === 'important-not-urgent') return isImportant && !isUrgent;
      if (quadrantKey === 'urgent-not-important') return !isImportant && isUrgent;
      if (quadrantKey === 'not-urgent-not-important') return !isImportant && !isUrgent;
      if (quadrantKey === 'long-term') return urgency === 'long-term';
      return false;
    }).length;
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待处理' },
    { value: 'in-progress', label: '进行中' },
    { value: 'completed', label: '已完成' },
  ];

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
    }
  };

  const handleStatClick = (status: StatFilter) => {
    setStatFilter(statFilter === status ? 'all' : status);
    setQuadrantFilter(null);
  };

  const handleQuadrantClick = (quadrant: QuadrantFilter) => {
    setQuadrantFilter(quadrantFilter === quadrant ? null : quadrant);
    setStatFilter('all');
  };

  const clearFilters = () => {
    setStatFilter('all');
    setQuadrantFilter(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">任务管理</h1>
          <p className="text-gray-500 mt-1">管理和追踪所有任务</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowImportModal(true)} className="btn-secondary flex items-center gap-2">
            <Upload size={20} />导入任务
          </button>
          <button onClick={() => setShowRecurringModal(true)} className="btn-secondary flex items-center gap-2">
            <Repeat size={20} />创建日常
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} />添加任务
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">四象限视图</h2>
        <QuadrantView onTaskClick={handleTaskClick} />
      </div>

      {(statFilter !== 'all' || quadrantFilter) && (
        <div className="card mb-4 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {statFilter !== 'all' && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {filterOptions.find(f => f.value === statFilter)?.label}
              </span>
            )}
            {quadrantFilter && (
              <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
                {{
                  'urgent-important': '紧急重要',
                  'important-not-urgent': '重要不紧急',
                  'urgent-not-important': '紧急不重要',
                  'not-urgent-not-important': '不紧急不重要',
                  'long-term': '长期任务',
                }[quadrantFilter]}
              </span>
            )}
          </div>
          <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700">
            清除筛选
          </button>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索任务..."
              className="input-field pl-12"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex bg-gray-100 rounded-xl p-1">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === option.value
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-400">暂无任务</p>
              <div className="flex gap-4 mt-4 justify-center">
                <button onClick={() => setShowAddModal(true)} className="btn-primary">添加任务</button>
                <button onClick={() => setShowRecurringModal(true)} className="btn-secondary">创建日常</button>
              </div>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setSelectedTask(task)}
                onComplete={() => toggleTaskStatus(task.id)}
                onDelete={() => deleteTask(task.id)}
              />
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">任务统计</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleStatClick('all')}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  statFilter === 'all' ? 'bg-primary/10' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-gray-500">全部任务</span>
                <span className="font-bold text-gray-800">{tasks.length}</span>
              </button>
              <button
                onClick={() => handleStatClick('pending')}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  statFilter === 'pending' ? 'bg-warning/10' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-gray-500">待处理</span>
                <span className="font-bold text-warning">{tasks.filter(t => t.status === 'pending').length}</span>
              </button>
              <button
                onClick={() => handleStatClick('in-progress')}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  statFilter === 'in-progress' ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-gray-500">进行中</span>
                <span className="font-bold text-blue-500">{tasks.filter(t => t.status === 'in-progress').length}</span>
              </button>
              <button
                onClick={() => handleStatClick('completed')}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  statFilter === 'completed' ? 'bg-secondary/10' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-gray-500">已完成</span>
                <span className="font-bold text-secondary">{tasks.filter(t => t.status === 'completed').length}</span>
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">四象限分布</h3>
            <div className="space-y-2">
              {[
                { label: '紧急重要', color: 'bg-red-500', key: 'urgent-important' as QuadrantFilter },
                { label: '重要不紧急', color: 'bg-blue-500', key: 'important-not-urgent' as QuadrantFilter },
                { label: '紧急不重要', color: 'bg-amber-500', key: 'urgent-not-important' as QuadrantFilter },
                { label: '不紧急不重要', color: 'bg-gray-500', key: 'not-urgent-not-important' as QuadrantFilter },
                { label: '长期任务', color: 'bg-purple-500', key: 'long-term' as QuadrantFilter },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleQuadrantClick(item.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    quadrantFilter === item.key ? 'bg-primary/10' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="flex-1 text-sm text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-800">{getQuadrantCount(item.key)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStartWork={(taskId) => startTaskWork(taskId)}
        />
      )}
      
      {showAddModal && (
        <AddTaskModal onClose={() => setShowAddModal(false)} />
      )}

      {showRecurringModal && (
        <AddRecurringTaskModal onClose={() => setShowRecurringModal(false)} />
      )}

      {showImportModal && (
        <ImportTasksModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
}
