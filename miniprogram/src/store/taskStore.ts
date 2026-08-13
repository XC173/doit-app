import { create } from 'zustand';
import type { Task, Subtask, DailyTimeLog, DiagnosisResult, EysenckDiagnosisResult, UserProgress } from '@/types';
import { mockTasks, mockDailyTimeLogs, generateId } from '@/data/mockData';

interface TaskStore {
  tasks: Task[];
  dailyTimeLogs: DailyTimeLog[];
  diagnosisResults: DiagnosisResult[];
  eysenckResults: EysenckDiagnosisResult[];
  userProgress: UserProgress[];
  currentTimer: {
    isRunning: boolean;
    elapsedSeconds: number;
    currentTaskId: string | null;
  };
  showWorkTimer: boolean;
  workTimerTaskId: string | null;
  workTimerQuote: string;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  startTimer: (taskId: string) => void;
  stopTimer: () => void;
  resetTimer: () => void;
  incrementTimer: () => void;

  addDailyTimeLog: (entry: { date: string; startTime: string; endTime: string; activity: string; duration: number }) => void;

  getTodayTasks: () => Task[];
  getPendingTasks: () => Task[];
  getAllTasks: () => Task[];

  calculateUrgency: (task: Task) => 'green' | 'yellow' | 'red' | 'critical' | 'long-term';
  getQuadrantColor: (task: Task) => string;

  setShowWorkTimer: (show: boolean) => void;
  setWorkTimerTaskId: (id: string | null) => void;

  startTaskWork: (taskId: string) => void;
  restartTask: (taskId: string) => void;

  getWeeklyDuration: (weekStart: string) => number;

  addDiagnosis: (result: Omit<DiagnosisResult, 'id' | 'completedAt'>) => void;
  addEysenckDiagnosis: (result: Omit<EysenckDiagnosisResult, 'id' | 'completedAt'>) => void;

  mockData: () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  dailyTimeLogs: [],
  diagnosisResults: [],
  eysenckResults: [],
  userProgress: [],
  currentTimer: {
    isRunning: false,
    elapsedSeconds: 0,
    currentTaskId: null,
  },
  showWorkTimer: false,
  workTimerTaskId: null,
  workTimerQuote: '',

  addTask: (task) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      ),
    }));
  },

  deleteTask: (id) => {
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
  },

  toggleTaskStatus: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== id) return task;
        const newStatus: Task['status'] = task.status === 'completed' ? 'pending' : task.status === 'pending' ? 'in-progress' : 'completed';
        return { ...task, status: newStatus, updatedAt: new Date().toISOString() };
      }),
    }));
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((sub) =>
                sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
              ),
              updatedAt: new Date().toISOString(),
            }
          : task
      ),
    }));
  },

  deleteSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.filter((sub) => sub.id !== subtaskId),
              updatedAt: new Date().toISOString(),
            }
          : task
      ),
    }));
  },

  startTimer: (taskId) => {
    set({
      currentTimer: {
        isRunning: true,
        elapsedSeconds: 0,
        currentTaskId: taskId,
      },
    });
  },

  stopTimer: () => {
    const { currentTimer } = get();
    if (currentTimer.currentTaskId && currentTimer.elapsedSeconds > 0) {
      const tasks = get().tasks;
      const task = tasks.find((t) => t.id === currentTimer.currentTaskId);
      const taskTitle = task ? task.title : '工作';

      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const startTime = new Date(Date.now() - currentTimer.elapsedSeconds * 1000);
      const startTimeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
      const endTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      get().addDailyTimeLog({
        date,
        startTime: startTimeStr,
        endTime: endTimeStr,
        activity: taskTitle,
        duration: Math.floor(currentTimer.elapsedSeconds / 60),
      });
    }
    set({
      currentTimer: {
        isRunning: false,
        elapsedSeconds: 0,
        currentTaskId: null,
      },
    });
  },

  resetTimer: () => {
    set({
      currentTimer: {
        isRunning: false,
        elapsedSeconds: 0,
        currentTaskId: null,
      },
    });
  },

  incrementTimer: () => {
    set((state) => {
      if (!state.currentTimer.isRunning) return state;
      return {
        currentTimer: {
          ...state.currentTimer,
          elapsedSeconds: state.currentTimer.elapsedSeconds + 1,
        },
      };
    });
  },

  addDailyTimeLog: ({ date, startTime, endTime, activity, duration }) => {
    set((state) => {
      const existingLog = state.dailyTimeLogs.find((log) => log.date === date);
      if (existingLog) {
        return {
          dailyTimeLogs: state.dailyTimeLogs.map((log) =>
            log.date === date
              ? { ...log, entries: [...log.entries, { startTime, endTime, activity, duration }] }
              : log
          ),
        };
      }
      return {
        dailyTimeLogs: [...state.dailyTimeLogs, { date, entries: [{ startTime, endTime, activity, duration }] }],
      };
    });
  },

  getTodayTasks: () => {
    const today = new Date().toDateString();
    return get().tasks.filter((task) => {
      if (task.deadline === 'long-term') return false;
      const deadline = new Date(task.deadline);
      return deadline.toDateString() === today;
    });
  },

  getPendingTasks: () => {
    return get().tasks.filter((task) => task.status !== 'completed');
  },

  getAllTasks: () => get().tasks,

  calculateUrgency: (task) => {
    if (task.deadline === 'long-term') return 'long-term';

    const now = new Date().getTime();
    const start = new Date(task.startTime).getTime();
    const deadline = new Date(task.deadline).getTime();

    const totalDuration = deadline - start;
    const remaining = deadline - now;

    if (remaining <= 0) return 'critical';

    const remainingPercentage = remaining / totalDuration;

    if (remainingPercentage <= 0.1) return 'critical';
    if (remainingPercentage <= 0.33) return 'red';
    if (remainingPercentage <= 0.66) return 'yellow';
    return 'green';
  },

  getQuadrantColor: (task) => {
    const urgency = get().calculateUrgency(task);
    const isImportant = task.importance === 'important';

    if (urgency === 'long-term') return { bg: '#F3E8FF', text: '#7C3AED', label: '长期任务' };

    const isUrgent = urgency === 'red' || urgency === 'critical';

    if (isImportant && isUrgent) return { bg: '#FEE2E2', text: '#B91C1C', label: '紧急重要' };
    if (isImportant && !isUrgent) return { bg: '#DBEAFE', text: '#1D4ED8', label: '重要不紧急' };
    if (!isImportant && isUrgent) return { bg: '#FEF3C7', text: '#B45309', label: '紧急不重要' };
    return { bg: '#F3F4F6', text: '#4B5563', label: '不紧急不重要' };
  },

  setShowWorkTimer: (show) => {
    set({ showWorkTimer: show });
  },

  setWorkTimerTaskId: (id) => {
    set({ workTimerTaskId: id });
  },

  startTaskWork: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    const title = task ? task.title : '工作';
    const quotes = [
      '先开始5分钟，看看感觉如何。',
      '动机往往在行动之后才出现，而不是之前。',
      '完成比完美更重要。',
      '我可以把任务分解成小步骤，一步一步来。',
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    set({
      showWorkTimer: true,
      workTimerTaskId: taskId,
      workTimerQuote: `${title} · ${quote}`,
    });
  },

  restartTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'pending' as const,
              subtasks: task.subtasks.map((sub) => ({ ...sub, completed: false })),
              updatedAt: new Date().toISOString(),
            }
          : task
      ),
    }));
  },

  getWeeklyDuration: (weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    return get().dailyTimeLogs
      .filter((log) => log.date >= weekStart && log.date < weekEndStr)
      .flatMap((log) => log.entries)
      .reduce((sum, entry) => sum + entry.duration, 0);
  },

  addDiagnosis: (result) => {
    const newResult: DiagnosisResult = {
      ...result,
      id: generateId(),
      completedAt: new Date().toISOString(),
    };
    set((state) => ({ diagnosisResults: [...state.diagnosisResults, newResult] }));
  },

  addEysenckDiagnosis: (result) => {
    const newResult: EysenckDiagnosisResult = {
      ...result,
      id: generateId(),
      completedAt: new Date().toISOString(),
    };
    set((state) => ({ eysenckResults: [...state.eysenckResults, newResult] }));
  },

  mockData: () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mockProgress: UserProgress[] = [
      { date: '2026-05-27', tasksCompleted: 3, totalTasks: 5, productiveMinutes: 180, procrastinationMinutes: 45 },
      { date: '2026-05-28', tasksCompleted: 4, totalTasks: 6, productiveMinutes: 220, procrastinationMinutes: 30 },
      { date: '2026-05-29', tasksCompleted: 2, totalTasks: 4, productiveMinutes: 150, procrastinationMinutes: 60 },
      { date: '2026-05-30', tasksCompleted: 5, totalTasks: 5, productiveMinutes: 240, procrastinationMinutes: 20 },
      { date: '2026-05-31', tasksCompleted: 3, totalTasks: 4, productiveMinutes: 160, procrastinationMinutes: 40 },
      { date: '2026-06-01', tasksCompleted: 4, totalTasks: 5, productiveMinutes: 200, procrastinationMinutes: 35 },
      { date: '2026-06-02', tasksCompleted: 3, totalTasks: 4, productiveMinutes: 170, procrastinationMinutes: 50 },
    ];

    set({ tasks: mockTasks, dailyTimeLogs: mockDailyTimeLogs, userProgress: mockProgress });
  },
}));
