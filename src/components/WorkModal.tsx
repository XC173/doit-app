import { useEffect, useState, useRef } from 'react';
import { X, Play, AlertTriangle, Check, Circle, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { cognitiveReappraisalQuotes } from '@/types';
import type { Task } from '@/types';
import { track } from '@/utils/track';

export function WorkModal() {
  const showWorkModal = useTaskStore((state) => state.showWorkModal);
  const setShowWorkModal = useTaskStore((state) => state.setShowWorkModal);
  const workModalPhase = useTaskStore((state) => state.workModalPhase);
  const setWorkModalPhase = useTaskStore((state) => state.setWorkModalPhase);
  const workModalTaskId = useTaskStore((state) => state.workModalTaskId);
  const addDailyTimeLog = useTaskStore((state) => state.addDailyTimeLog);
  const tasks = useTaskStore((state) => state.tasks);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const toggleSubtask = useTaskStore((state) => state.toggleSubtask);

  const [countdown, setCountdown] = useState(300);
  const [currentQuote, setCurrentQuote] = useState('');
  const [activity, setActivity] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [markCompleted, setMarkCompleted] = useState(false);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [completedSubtaskIds, setCompletedSubtaskIds] = useState<string[]>([]);
  const setWorkModalTaskId = useTaskStore((state) => state.setWorkModalTaskId);
  // 埋点追踪
  const hasTrackedFiveMinuteStart = useRef(false); // 是否已追踪5分钟启动
  const hasTrackedContinue = useRef(false); // 是否已追踪继续工作30分钟

  useEffect(() => {
    if (showWorkModal && workModalTaskId && workModalPhase === 'confirm') {
      setWorkModalPhase('working');
    } else if (showWorkModal && workModalPhase === 'countdown') {
      setCountdown(300);
      setCurrentQuote(cognitiveReappraisalQuotes[Math.floor(Math.random() * cognitiveReappraisalQuotes.length)]);
      // 埋点：5分钟启动法使用
      if (!hasTrackedFiveMinuteStart.current) {
        track('five_minute_start', { taskId: workModalTaskId });
        hasTrackedFiveMinuteStart.current = true;
      }
    } else if (showWorkModal && workModalPhase === 'working') {
      setCountdown(0);
      setTotalTime(0);
    }
  }, [showWorkModal, workModalPhase, workModalTaskId]);

  useEffect(() => {
    let interval: number | undefined;
    
    if (showWorkModal && workModalPhase === 'countdown' && countdown > 0) {
      interval = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setWorkModalPhase('working');
            setCountdown(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (showWorkModal && workModalPhase === 'working') {
      interval = window.setInterval(() => {
        setCountdown((prev) => prev + 1);
        setTotalTime((prev) => {
          const newTotal = prev + 1;
          // 埋点：5分钟后继续工作30分钟以上（总计35分钟 = 2100秒）
          if (!hasTrackedContinue.current && hasTrackedFiveMinuteStart.current && newTotal >= 1800) {
            track('continue_after_five_min', { totalMinutes: Math.floor(newTotal / 60) });
            hasTrackedContinue.current = true;
          }
          return newTotal;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showWorkModal, workModalPhase]);

  useEffect(() => {
    if (showWorkModal && (workModalPhase === 'countdown' || workModalPhase === 'working')) {
      const timer = setInterval(() => {
        setCurrentQuote(cognitiveReappraisalQuotes[Math.floor(Math.random() * cognitiveReappraisalQuotes.length)]);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [showWorkModal, workModalPhase]);

  useEffect(() => {
    if (showWorkModal && workModalTaskId) {
      const task = tasks.find((t) => t.id === workModalTaskId);
      if (task) {
        setSelectedTask(task);
        setActivity(task.title);
        setCompletedSubtaskIds(task.subtasks.filter((s) => s.completed).map((s) => s.id));
      }
    }
  }, [showWorkModal, workModalTaskId, tasks]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    setShowWorkModal(false);
    setWorkModalPhase('confirm');
    setCountdown(300);
    setTotalTime(0);
    setActivity('');
    setSelectedTask(null);
    setMarkCompleted(false);
    setShowTaskSelector(false);
    setCompletedSubtaskIds([]);
    setWorkModalTaskId(null);
    // 重置埋点追踪状态
    hasTrackedFiveMinuteStart.current = false;
    hasTrackedContinue.current = false;
  };

  const handleConfirm = () => {
    setWorkModalPhase('countdown');
  };

  const handleFinishWork = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    
    const taskActivity = selectedTask ? selectedTask.title : (activity.trim() || '工作');
    
    addDailyTimeLog({
      date,
      startTime: new Date(now.getTime() - totalTime * 1000).toTimeString().slice(0, 5),
      endTime: now.toTimeString().slice(0, 5),
      activity: taskActivity,
      duration: Math.floor(totalTime / 60),
    });

    if (selectedTask) {
      selectedTask.subtasks.forEach((subtask) => {
        const wasCompleted = subtask.completed;
        const isNowCompleted = completedSubtaskIds.includes(subtask.id);
        
        if (wasCompleted !== isNowCompleted) {
          toggleSubtask(selectedTask.id, subtask.id);
        }
      });

      if (markCompleted) {
        toggleTaskStatus(selectedTask.id);
      }
    }
    
    handleClose();
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setActivity(task.title);
    setShowTaskSelector(false);
  };

  const availableTasks = tasks.filter((task) => {
    if (task.status === 'completed') return false;
    return true;
  });

  if (!showWorkModal) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X size={24} className="text-gray-600" />
        </button>

        {workModalPhase === 'confirm' && !workModalTaskId && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">开始工作提醒</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 font-medium">
                接下来的5分钟，屏幕将被完全占用，您将无法使用设备进行其他操作。
              </p>
              <p className="text-amber-600 mt-2 text-sm">
                这是专注工作的开始，请确保您已准备好开始。
              </p>
            </div>
            <p className="text-gray-600 mb-6">
              5分钟倒计时开始后将无法暂停或提前终止，请确认您已做好准备。
            </p>
            <div className="flex gap-4">
              <button onClick={handleClose} className="btn-secondary flex-1">
                取消
              </button>
              <button onClick={handleConfirm} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Play size={18} />确认开始
              </button>
            </div>
          </div>
        )}

        {workModalPhase === 'countdown' && !workModalTaskId && (
          <div className="p-8 text-center">
            <div className="text-sm text-gray-500 mb-2">专注倒计时（不可暂停）</div>
            <div className="text-8xl font-bold text-primary mb-8">
              {formatTime(countdown)}
            </div>
            <div className="card bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 p-6 mb-6">
              <p className="text-lg text-gray-700 italic">"{currentQuote}"</p>
            </div>
            <p className="text-sm text-gray-400">
              请专注工作，倒计时结束后可选择继续或停止
            </p>
          </div>
        )}

        {workModalPhase === 'working' && (
          <div className="p-8 text-center">
            <div className="text-sm text-gray-500 mb-2">专注工作中</div>
            <div className="text-6xl font-bold text-secondary mb-8">
              {formatTime(countdown)}
            </div>
            <div className="card bg-gradient-to-r from-secondary/5 to-green-50 border-secondary/20 p-6 mb-4">
              <p className="text-lg text-gray-700 italic">"{currentQuote}"</p>
            </div>
            <div className="mb-4 text-sm text-gray-500">
              已工作: {Math.floor(totalTime / 60)} 分钟
            </div>
            <button
              onClick={() => setWorkModalPhase('finished')}
              className="btn-primary px-8"
            >
              结束工作
            </button>
          </div>
        )}

        {workModalPhase === 'finished' && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-secondary to-green-500 flex items-center justify-center">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">太棒了！</h2>
              <p className="text-gray-500">你已经完成了专注工作时段</p>
            </div>
            
            <div className="card p-4 mb-6">
              <p className="text-lg font-medium text-gray-800">工作时长</p>
              <p className="text-3xl font-bold text-primary">
                {Math.floor(totalTime / 60)} 分钟
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                你进行了什么工作？
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={activity}
                  onChange={(e) => {
                    setActivity(e.target.value);
                    setSelectedTask(null);
                  }}
                  placeholder="输入工作内容..."
                  className="input-field pr-32"
                />
                <button
                  onClick={() => setShowTaskSelector(!showTaskSelector)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors"
                >
                  从日程选择
                </button>
              </div>
            </div>

            {showTaskSelector && availableTasks.length > 0 && (
              <div className="mb-4 bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 mb-3">选择今日任务：</p>
                <div className="space-y-2">
                  {availableTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleSelectTask(task)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedTask?.id === task.id
                          ? 'bg-primary text-white'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{task.title}</span>
                        {selectedTask?.id === task.id && (
                          <Check size={16} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTask && (
              <div className="mb-4 p-4 bg-primary/5 rounded-xl">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">标记任务完成</span>
                    <button
                      onClick={() => setMarkCompleted(!markCompleted)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        markCompleted ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          markCompleted ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    {markCompleted ? `完成后将标记"${selectedTask.title}"为已完成` : '勾选后，完成此记录时将同步标记任务为已完成'}
                  </p>
                </div>

                {selectedTask.subtasks.length > 0 && (
                  <div className="border-t border-primary/10 pt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">子任务完成情况</p>
                    <div className="space-y-2">
                      {selectedTask.subtasks.map((subtask) => (
                        <button
                          key={subtask.id}
                          onClick={() => {
                            if (completedSubtaskIds.includes(subtask.id)) {
                              setCompletedSubtaskIds(completedSubtaskIds.filter((id) => id !== subtask.id));
                            } else {
                              setCompletedSubtaskIds([...completedSubtaskIds, subtask.id]);
                            }
                          }}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            completedSubtaskIds.includes(subtask.id)
                              ? 'bg-primary/10'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          {completedSubtaskIds.includes(subtask.id) ? (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300" />
                          )}
                          <span className={`text-sm ${
                            completedSubtaskIds.includes(subtask.id)
                              ? 'text-gray-500 line-through'
                              : 'text-gray-700'
                          }`}>
                            {subtask.title}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {completedSubtaskIds.length}/{selectedTask.subtasks.length} 子任务已完成
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleFinishWork}
              className="btn-primary w-full"
            >
              结束工作
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
