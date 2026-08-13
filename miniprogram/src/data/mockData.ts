import type { Task, DailyTimeLog } from '@/types';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

export const mockTasks: Task[] = [
  {
    id: '1',
    title: '完成项目报告',
    description: '整理本周项目进度，撰写周报报告',
    importance: 'important',
    difficulty: 'hard',
    startTime: yesterday.toISOString(),
    deadline: today.toISOString(),
    status: 'pending',
    subtasks: [
      { id: 's1', title: '收集数据', completed: false },
      { id: 's2', title: '分析结果', completed: false },
      { id: 's3', title: '撰写报告', completed: false },
    ],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: '2',
    title: '学习React新特性',
    description: '学习React 18的新功能和最佳实践',
    importance: 'important',
    difficulty: 'medium',
    startTime: today.toISOString(),
    deadline: tomorrow.toISOString(),
    status: 'pending',
    subtasks: [
      { id: 's4', title: '阅读文档', completed: true },
      { id: 's5', title: '实践练习', completed: false },
    ],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: '3',
    title: '回复邮件',
    description: '回复客户的咨询邮件',
    importance: 'not-important',
    difficulty: 'easy',
    startTime: today.toISOString(),
    deadline: today.toISOString(),
    status: 'pending',
    subtasks: [],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: '4',
    title: '整理桌面文件',
    description: '整理电脑桌面，归档旧文件',
    importance: 'not-important',
    difficulty: 'easy',
    startTime: today.toISOString(),
    deadline: tomorrow.toISOString(),
    status: 'pending',
    subtasks: [],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: '5',
    title: '健身锻炼',
    description: '完成今日健身计划',
    importance: 'important',
    difficulty: 'medium',
    startTime: today.toISOString(),
    deadline: today.toISOString(),
    status: 'completed',
    subtasks: [
      { id: 's6', title: '有氧运动30分钟', completed: true },
      { id: 's7', title: '力量训练', completed: true },
    ],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: '6',
    title: '长期学习计划',
    description: '持续学习新技术',
    importance: 'important',
    difficulty: 'hard',
    startTime: today.toISOString(),
    deadline: 'long-term',
    status: 'pending',
    subtasks: [],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
];

export const mockDailyTimeLogs: DailyTimeLog[] = [
  {
    date: yesterday.toISOString().split('T')[0],
    entries: [
      { startTime: '09:00', endTime: '10:30', activity: '项目开发', duration: 90 },
      { startTime: '10:30', endTime: '11:00', activity: '休息', duration: 30 },
      { startTime: '11:00', endTime: '12:00', activity: '会议', duration: 60 },
      { startTime: '14:00', endTime: '16:00', activity: '学习React', duration: 120 },
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

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
