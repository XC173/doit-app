import { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, Bell, BellRing } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/types';

type UrgencyLevel = 'critical' | 'three-days' | 'one-day' | null;

interface ReminderInfo {
  task: Task;
  level: UrgencyLevel;
  daysRemaining: number;
}

function getDaysRemaining(task: Task): number | null {
  if (task.deadline === 'long-term') return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadline = new Date(task.deadline);
  deadline.setHours(0, 0, 0, 0);
  const diff = deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getUrgencyLevel(task: Task): UrgencyLevel {
  // routine 标签的任务不受影响
  if (task.tags?.includes('routine')) return null;
  if (task.status === 'completed') return null;
  if (task.deadline === 'long-term') return null;

  const days = getDaysRemaining(task);
  if (days === null) return null;

  if (days <= 0) return 'critical';
  if (days <= 1) return 'one-day';
  if (days <= 3) return 'three-days';
  return null;
}

// 播放提醒音效
function playAlertSound(level: UrgencyLevel) {
  if (!level) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const configs: Record<string, { freq: number; repeat: number; interval: number }> = {
      'three-days': { freq: 660, repeat: 1, interval: 0 },
      'one-day': { freq: 880, repeat: 2, interval: 200 },
      'critical': { freq: 1100, repeat: 3, interval: 150 },
    };

    const config = configs[level];

    for (let i = 0; i < config.repeat; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = config.freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + (i * config.interval) / 1000;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    }
  } catch (e) {
    // 静默失败，不阻塞
  }
}

export function TaskReminder() {
  const tasks = useTaskStore((state) => state.tasks);
  const [reminders, setReminders] = useState<ReminderInfo[]>([]);
  const [dismissedTaskIds, setDismissedTaskIds] = useState<Set<string>>(new Set());
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0);

  // 检查需要提醒的任务
  const checkReminders = useCallback(() => {
    const newReminders: ReminderInfo[] = [];

    tasks.forEach((task) => {
      if (dismissedTaskIds.has(task.id)) return;

      const level = getUrgencyLevel(task);
      if (level) {
        const days = getDaysRemaining(task) ?? 0;
        newReminders.push({ task, level, daysRemaining: days });
      }
    });

    const levelOrder: Record<string, number> = {
      critical: 3,
      'one-day': 2,
      'three-days': 1,
    };
    newReminders.sort((a, b) => (levelOrder[b.level!] || 0) - (levelOrder[a.level!] || 0));

    setReminders(newReminders);
  }, [tasks, dismissedTaskIds]);

  // 每分钟检查一次
  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  // 有新提醒时播放音效
  useEffect(() => {
    if (reminders.length > 0 && currentReminderIndex < reminders.length) {
      playAlertSound(reminders[currentReminderIndex].level);
    }
  }, [reminders, currentReminderIndex]);

  const handleDismiss = () => {
    if (reminders[currentReminderIndex]) {
      const taskId = reminders[currentReminderIndex].task.id;
      setDismissedTaskIds((prev) => new Set(prev).add(taskId));
      setCurrentReminderIndex((prev) => prev + 1);
    }
  };

  const handleDismissAll = () => {
    reminders.forEach((r) => {
      setDismissedTaskIds((prev) => new Set(prev).add(r.task.id));
    });
    setReminders([]);
    setCurrentReminderIndex(0);
  };

  const currentReminder = reminders[currentReminderIndex];

  if (!currentReminder) return null;

  // 样式映射
  const styles: Record<string, {
    bg: string;
    border: string;
    text: string;
    icon: string;
    title: string;
    desc: string;
  }> = {
    'three-days': {
      bg: 'bg-rose-50',
      border: 'border-rose-300',
      text: 'text-rose-700',
      icon: 'bg-rose-200',
      title: '任务即将到期',
      desc: `距离截止日期还剩 ${currentReminder.daysRemaining} 天`,
    },
    'one-day': {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-700',
      icon: 'bg-red-300',
      title: '任务明天到期！',
      desc: `距离截止日期仅剩 ${currentReminder.daysRemaining} 天，请尽快处理`,
    },
    'critical': {
      bg: 'bg-red-100',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: 'bg-red-400',
      title: '任务已到期！',
      desc: currentReminder.daysRemaining < 0
        ? `已逾期 ${Math.abs(currentReminder.daysRemaining)} 天，请立即处理`
        : '今天截止！请立即处理',
    },
  };

  const style = styles[currentReminder.level!];
  const remainingCount = reminders.length - currentReminderIndex - 1;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-5">
      <div className={`${style.bg} ${style.border} border-2 rounded-2xl shadow-2xl w-96 overflow-hidden`}>
        {/* 顶部色带 */}
        <div className={`h-1.5 ${style.icon}`} />

        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className={`${style.icon} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
              {currentReminder.level === 'critical' ? (
                <BellRing className={`w-5 h-5 ${style.text}`} />
              ) : (
                <Bell className={`w-5 h-5 ${style.text}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-base ${style.text}`}>
                {style.title}
              </h3>
              <p className={`text-sm ${style.text} opacity-80 mt-0.5`}>
                {style.desc}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-black/5 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* 任务信息 */}
          <div className="bg-white/60 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} className={style.text} />
              <span className="text-sm font-medium text-gray-700 truncate">
                {currentReminder.task.title}
              </span>
            </div>
            {currentReminder.task.description && (
              <p className="text-xs text-gray-500 truncate ml-5">
                {currentReminder.task.description}
              </p>
            )}

          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-3 py-2 bg-white/70 hover:bg-white text-gray-600 text-sm font-medium rounded-lg transition-colors border border-gray-200"
            >
              知道了
            </button>
            {remainingCount > 0 && (
              <button
                onClick={handleDismissAll}
                className="flex-1 px-3 py-2 bg-white/70 hover:bg-white text-gray-500 text-sm rounded-lg transition-colors border border-gray-200"
              >
                全部忽略 ({remainingCount + 1})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
