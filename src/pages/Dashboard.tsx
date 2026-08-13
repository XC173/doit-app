import { useState } from 'react';
import { Plus, Target, Clock, Zap, Play } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { TaskCard } from '@/components/TaskCard';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { AddQuickTaskModal } from '@/components/AddQuickTaskModal';
import { WorkModal } from '@/components/WorkModal';
import type { Task } from '@/types';

export function Dashboard() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const tasks = useTaskStore((state) => state.tasks);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const getTodayTasks = useTaskStore((state) => state.getTodayTasks);
  const setShowWorkModal = useTaskStore((state) => state.setShowWorkModal);
  const setWorkModalPhase = useTaskStore((state) => state.setWorkModalPhase);
  const dailyTimeLogs = useTaskStore((state) => state.dailyTimeLogs);

  const todayTasks = getTodayTasks();
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = dailyTimeLogs.find((log) => log.date === today);
  const todayMinutes = todayLogs ? todayLogs.entries.reduce((sum, entry) => sum + entry.duration, 0) : 0;

  const handleStartWork = () => {
    setWorkModalPhase('confirm');
    setShowWorkModal(true);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">今日概览</h1>
          <p className="text-gray-500 mt-1">{new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} />添加临时任务
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">今日任务</p>
              <p className="text-2xl font-bold text-gray-800">{todayTasks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待处理</p>
              <p className="text-2xl font-bold text-gray-800">{pendingTasks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-danger" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-gray-800">{completedTasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-8 bg-gradient-to-r from-secondary/10 to-green-50 border-secondary/30">
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">开始工作</h2>
            <p className="text-gray-600 mt-1">准备好了吗？先做5分钟试试看！</p>
          </div>
          <button onClick={handleStartWork} className="btn-primary flex items-center gap-2 px-6 py-3">
            <Play size={20} />开始工作
          </button>
        </div>
      </div>

      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">今日数据</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-2">工作时长</p>
            <p className="text-3xl font-bold text-gray-800">
              {formatDuration(todayMinutes)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">今日待办</h2>
        {todayTasks.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400">今日暂无待办任务</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4">添加临时任务</button>
          </div>
        ) : (
          <div className="space-y-4">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setSelectedTask(task)}
                onComplete={() => toggleTaskStatus(task.id)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
      
      {showAddModal && (
        <AddQuickTaskModal onClose={() => setShowAddModal(false)} />
      )}

      <WorkModal />
    </div>
  );
}
