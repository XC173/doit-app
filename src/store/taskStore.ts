import { create } from 'zustand';
import type { Task, Subtask, TimeRecord, UserProgress, DiagnosisResult, DailyTimeLog, RecurringTask, EysenckDiagnosisResult } from '@/types';
import { track } from '@/utils/track';

interface TaskStore {
  tasks: Task[];
  recurringTasks: RecurringTask[];
  timeRecords: TimeRecord[];
  userProgress: UserProgress[];
  diagnosisResults: DiagnosisResult[];
  eysenckResults: EysenckDiagnosisResult[];
  dailyTimeLogs: DailyTimeLog[];
  currentTimer: {
    isRunning: boolean;
    elapsedSeconds: number;
    currentTaskId: string | null;
  };
  showWorkModal: boolean;
  workModalPhase: 'confirm' | 'countdown' | 'working' | 'finished';
  workModalCountdown: number;
  showDiagnosis: boolean;
  hasCompletedDiagnosis: boolean;
  workModalTaskId: string | null;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  
  addSubtask: (taskId: string, subtask: Omit<Subtask, 'id'>) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
  resetTimer: () => void;
  incrementTimer: () => void;
  
  addTimeRecord: (record: Omit<TimeRecord, 'id'>) => void;
  
  addDailyTimeLog: (entry: { date: string; startTime: string; endTime: string; activity: string; duration: number }) => void;
  
  addRecurringTask: (task: Omit<RecurringTask, 'id' | 'createdAt'>) => void;
  deleteRecurringTask: (id: string) => void;
  generateTasksFromRecurring: () => void;
  
  updateProgress: (date: string, completed: number, total: number, productive: number, procrastination: number) => void;
  
  addDiagnosis: (results: DiagnosisResult['results']) => void;
  
  addEysenckDiagnosis: (result: Omit<EysenckDiagnosisResult, 'id' | 'completedAt'>) => void;
  
  getTasksByImportance: (importance: Task['importance']) => Task[];
  getTodayTasks: () => Task[];
  getPendingTasks: () => Task[];
  
  calculateUrgency: (task: Task) => 'green' | 'yellow' | 'red' | 'critical' | 'long-term';
  getQuadrantColor: (task: Task) => string;
  
  setShowWorkModal: (show: boolean) => void;
  setWorkModalPhase: (phase: 'confirm' | 'countdown' | 'working' | 'finished') => void;
  setWorkModalCountdown: (countdown: number) => void;
  setWorkModalTaskId: (id: string | null) => void;
  
  setShowDiagnosis: (show: boolean) => void;
  
  getWeeklyDuration: (weekStart: string) => number;
  
  startTaskWork: (taskId: string) => void;
  restartTask: (taskId: string) => void;
  
  mockData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  recurringTasks: [],
  timeRecords: [],
  userProgress: [],
  diagnosisResults: [],
  eysenckResults: [],
  dailyTimeLogs: [],
  currentTimer: {
    isRunning: false,
    elapsedSeconds: 0,
    currentTaskId: null,
  },
  showWorkModal: false,
  workModalPhase: 'confirm',
  workModalCountdown: 300,
  showDiagnosis: false,
  hasCompletedDiagnosis: false,
  workModalTaskId: null,

  addTask: (task) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    // 埋点：任务创建
    track('task_created', {
      difficulty: task.difficulty,
      importance: task.importance,
      hasSubtasks: task.subtasks.length > 0,
    });
    // 困难任务创建埋点
    if (task.difficulty === 'hard') {
      track('hard_task_created');
    }
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
        // 埋点：任务完成
        if (newStatus === 'completed') {
          track('task_completed', {
            difficulty: task.difficulty,
            importance: task.importance,
            hasSubtasks: task.subtasks.length > 0,
          });
        }
        return { ...task, status: newStatus, updatedAt: new Date().toISOString() };
      }),
    }));
  },

  addSubtask: (taskId, subtask) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [...task.subtasks, { ...subtask, id: generateId() }],
              updatedAt: new Date().toISOString(),
            }
          : task
      ),
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
    const { currentTimer, tasks } = get();
    if (currentTimer.currentTaskId && currentTimer.elapsedSeconds > 0) {
      const task = tasks.find(t => t.id === currentTimer.currentTaskId);
      const taskTitle = task ? task.title : '工作';
      
      get().addTimeRecord({
        taskId: currentTimer.currentTaskId,
        startTime: new Date(Date.now() - currentTimer.elapsedSeconds * 1000).toISOString(),
        endTime: new Date().toISOString(),
        duration: Math.floor(currentTimer.elapsedSeconds / 60),
        category: 'work',
      });
      
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

  addTimeRecord: (record) => {
    const newRecord: TimeRecord = { ...record, id: generateId() };
    set((state) => ({ timeRecords: [...state.timeRecords, newRecord] }));
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

  addRecurringTask: (task) => {
    const now = new Date().toISOString();
    const newTask: RecurringTask = {
      ...task,
      id: generateId(),
      createdAt: now,
    };
    set((state) => ({ recurringTasks: [...state.recurringTasks, newTask] }));
  },

  deleteRecurringTask: (id) => {
    set((state) => ({ recurringTasks: state.recurringTasks.filter((task) => task.id !== id) }));
  },

  generateTasksFromRecurring: () => {
    const { recurringTasks, addTask } = get();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    recurringTasks.forEach((recurring) => {
      if (recurring.endDate && todayStr > recurring.endDate) return;
      if (todayStr < recurring.startDate) return;
      
      const dayOfWeek = today.getDay();
      let shouldCreate = false;
      
      switch (recurring.recurrenceType) {
        case 'daily':
          shouldCreate = true;
          break;
        case 'weekdays':
          shouldCreate = dayOfWeek >= 1 && dayOfWeek <= 5;
          break;
        case 'custom':
          shouldCreate = recurring.customDays.includes(dayOfWeek);
          break;
      }
      
      if (shouldCreate) {
        const endTime = (() => {
          const [hours, mins] = recurring.startTime.split(':').map(Number);
          const endHours = hours + Math.floor(recurring.duration / 60);
          const endMins = mins + (recurring.duration % 60);
          return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
        })();

        const deadline = new Date(today);
        const [hours, mins] = endTime.split(':').map(Number);
        deadline.setHours(hours, mins, 0, 0);

        addTask({
          title: recurring.title,
          description: recurring.description,
          importance: recurring.importance,
          difficulty: recurring.difficulty,
          startTime: todayStr + 'T' + recurring.startTime + ':00',
          deadline: deadline.toISOString(),
          status: 'pending',
          subtasks: [],
          tags: ['routine'], // 日常任务自动标记 routine 标签
        });
      }
    });
  },

  updateProgress: (date, completed, total, productive, procrastination) => {
    set((state) => {
      const existingIndex = state.userProgress.findIndex((p) => p.date === date);
      if (existingIndex >= 0) {
        const updated = [...state.userProgress];
        updated[existingIndex] = { date, tasksCompleted: completed, totalTasks: total, productiveMinutes: productive, procrastinationMinutes: procrastination };
        return { userProgress: updated };
      }
      return { userProgress: [...state.userProgress, { date, tasksCompleted: completed, totalTasks: total, productiveMinutes: productive, procrastinationMinutes: procrastination }] };
    });
  },

  addDiagnosis: (results) => {
    const newDiagnosis: DiagnosisResult = {
      id: generateId(),
      results,
      completedAt: new Date().toISOString(),
    };
    set((state) => ({ diagnosisResults: [...state.diagnosisResults, newDiagnosis] }));
  },

  addEysenckDiagnosis: (result: Omit<EysenckDiagnosisResult, 'id' | 'completedAt'>) => {
    const newResult: EysenckDiagnosisResult = {
      ...result,
      id: generateId(),
      completedAt: new Date().toISOString(),
    };
    set((state) => ({ eysenckResults: [...state.eysenckResults, newResult] }));
  },

  getTasksByImportance: (importance) => {
    return get().tasks.filter((task) => task.importance === importance && task.status !== 'completed');
  },

  getTodayTasks: () => {
    const today = new Date().toDateString();
    return get().tasks.filter((task) => {
      if (task.deadline === 'long-term') return false;
      const deadline = new Date(task.deadline);
      return deadline.toDateString() === today && task.status !== 'completed';
    });
  },

  getPendingTasks: () => {
    return get().tasks.filter((task) => task.status !== 'completed');
  },

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
    
    // 重要+紧急 = 红色 (urgent-important)
    // 重要+不紧急 = 蓝色 (important-not-urgent)
    // 不重要+紧急 = 橙色 (urgent-not-important)
    // 不重要+不紧急 = 灰色 (not-urgent-not-important)
    // 长期任务 = 紫色
    
    if (urgency === 'long-term') return 'bg-purple-100 text-purple-700';
    
    const isUrgent = urgency === 'red' || urgency === 'critical';
    
    if (isImportant && isUrgent) return 'bg-red-100 text-red-700';
    if (isImportant && !isUrgent) return 'bg-blue-100 text-blue-700';
    if (!isImportant && isUrgent) return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-700';
  },

  setShowWorkModal: (show) => {
    set({ showWorkModal: show });
  },

  setWorkModalPhase: (phase) => {
    set({ workModalPhase: phase });
  },

  setWorkModalCountdown: (countdown) => {
    set({ workModalCountdown: countdown });
  },
  
  setWorkModalTaskId: (id) => {
    set({ workModalTaskId: id });
  },
  
  setShowDiagnosis: (show) => {
    set({ showDiagnosis: show });
  },
  
  setHasCompletedDiagnosis: (completed: boolean) => {
    set({ hasCompletedDiagnosis: completed });
  },
  
  startTaskWork: (taskId: string) => {
    set({
      showWorkModal: true,
      workModalPhase: 'working',
      workModalTaskId: taskId,
    });
    // 埋点：使用"开始工作"计时
    track('task_start_work', { taskId });
  },
  
  restartTask: (taskId: string) => {
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
  
  getWeeklyDuration: (weekStart: string) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    return get().dailyTimeLogs
      .filter((log) => log.date >= weekStart && log.date < weekEndStr)
      .flatMap((log) => log.entries)
      .reduce((sum, entry) => sum + entry.duration, 0);
  },
  
  mockData: () => {
    const now = new Date();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const inThreeDays = new Date(today);
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const yesterdayForDeadline = new Date(today);
    yesterdayForDeadline.setDate(yesterdayForDeadline.getDate() - 1);

    const mockTasks: Task[] = [
      {
        id: '1',
        title: '完成项目报告',
        description: '完成季度项目总结报告，包括数据分析和成果展示',
        importance: 'important',
        difficulty: 'hard',
        startTime: twoDaysAgo.toISOString(),
        deadline: yesterdayForDeadline.toISOString(),
        status: 'pending',
        subtasks: [
          { id: 's1', title: '收集数据', completed: false },
          { id: 's2', title: '分析结果', completed: false },
          { id: 's3', title: '撰写报告', completed: false },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: '2',
        title: '准备客户演示',
        description: '准备下周客户演示的PPT和Demo',
        importance: 'important',
        difficulty: 'medium',
        startTime: today.toISOString(),
        deadline: tomorrow.toISOString(),
        status: 'pending',
        subtasks: [
          { id: 's4', title: '阅读文档', completed: true },
          { id: 's5', title: '实践练习', completed: false },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: '3',
        title: '撰写技术方案',
        description: '撰写新系统的技术选型方案和架构设计文档',
        importance: 'important',
        difficulty: 'medium',
        startTime: today.toISOString(),
        deadline: inThreeDays.toISOString(),
        status: 'pending',
        subtasks: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: '4',
        title: '每日阅读30分钟',
        description: '每天保持阅读习惯，提升专业能力',
        importance: 'important',
        difficulty: 'easy',
        startTime: today.toISOString(),
        deadline: today.toISOString(),
        status: 'pending',
        subtasks: [],
        tags: ['routine'],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // === 不触发提醒的任务（7天后到期）===
      {
        id: '5',
        title: '学习React新特性',
        description: '7天后截止，不触发提醒',
        importance: 'important',
        difficulty: 'medium',
        startTime: today.toISOString(),
        deadline: nextWeek.toISOString(),
        status: 'pending',
        subtasks: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // === 已完成任务（不触发提醒）===
      {
        id: '6',
        title: '健身锻炼',
        description: '已完成，不触发提醒',
        importance: 'important',
        difficulty: 'medium',
        startTime: today.toISOString(),
        deadline: today.toISOString(),
        status: 'completed',
        subtasks: [
          { id: 's6', title: '有氧运动30分钟', completed: true },
          { id: 's7', title: '力量训练', completed: true },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // === 长期任务（不触发提醒）===
      {
        id: '7',
        title: '长期学习计划',
        description: '长期任务，不触发提醒',
        importance: 'important',
        difficulty: 'hard',
        startTime: today.toISOString(),
        deadline: 'long-term',
        status: 'pending',
        subtasks: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    const mockProgress: UserProgress[] = [
      { date: '2026-05-27', tasksCompleted: 3, totalTasks: 5, productiveMinutes: 180, procrastinationMinutes: 45 },
      { date: '2026-05-28', tasksCompleted: 4, totalTasks: 6, productiveMinutes: 220, procrastinationMinutes: 30 },
      { date: '2026-05-29', tasksCompleted: 2, totalTasks: 4, productiveMinutes: 150, procrastinationMinutes: 60 },
      { date: '2026-05-30', tasksCompleted: 5, totalTasks: 5, productiveMinutes: 240, procrastinationMinutes: 20 },
      { date: '2026-05-31', tasksCompleted: 3, totalTasks: 4, productiveMinutes: 160, procrastinationMinutes: 40 },
      { date: '2026-06-01', tasksCompleted: 4, totalTasks: 5, productiveMinutes: 200, procrastinationMinutes: 35 },
      { date: '2026-06-02', tasksCompleted: 3, totalTasks: 4, productiveMinutes: 170, procrastinationMinutes: 50 },
    ];

    const mockDailyLogs: DailyTimeLog[] = [
      {
        date: twoDaysAgo.toISOString().split('T')[0],
        entries: [
          { startTime: '09:00', endTime: '10:30', activity: '项目开发', duration: 90 },
          { startTime: '10:30', endTime: '11:00', activity: '休息', duration: 30 },
          { startTime: '11:00', endTime: '12:00', activity: '会议', duration: 60 },
          { startTime: '14:00', endTime: '16:00', activity: '学习React', duration: 120 },
        ],
      },
      {
        date: yesterday.toISOString().split('T')[0],
        entries: [
          { startTime: '09:00', endTime: '11:00', activity: '撰写报告', duration: 120 },
          { startTime: '11:00', endTime: '11:30', activity: '休息', duration: 30 },
          { startTime: '14:00', endTime: '15:30', activity: '代码审查', duration: 90 },
        ],
      },
      {
        date: today.toISOString().split('T')[0],
        entries: [
          { startTime: '09:00', endTime: '10:00', activity: '邮件处理', duration: 60 },
          { startTime: '10:00', endTime: '11:30', activity: '项目开发', duration: 90 },
        ],
      },
    ];

    set({ tasks: mockTasks, userProgress: mockProgress, dailyTimeLogs: mockDailyLogs });
  },
}));