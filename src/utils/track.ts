/**
 * Tracker - 轻量级本地埋点工具类
 *
 * 支持：
 * - 自定义事件上报
 * - 聚合统计自动累加
 * - 留存率计算（可配置天数）
 * - localStorage 持久化
 * - 可配置存储 key、最大事件数、事件-统计映射
 *
 * 用法：
 *   import { tracker } from '@/utils/track';
 *   tracker.track('my_event', { foo: 'bar' });
 *   const stats = tracker.getStats();
 *
 * 或创建独立实例：
 *   import { Tracker } from '@/utils/track';
 *   const myTracker = new Tracker({ storageKey: 'my_app_track' });
 */

// ==================== 类型定义 ====================

export interface TrackEvent {
  event: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
  properties?: Record<string, any>;
}

export interface TrackerConfig {
  /** localStorage 事件存储 key */
  storageKey: string;
  /** localStorage 统计存储 key */
  statsKey: string;
  /** 最大保留事件数（默认 2000） */
  maxEvents: number;
  /** 留存天数列表（默认 [3, 7]） */
  retentionDays: number[];
  /** 开发环境是否打印日志 */
  debug: boolean;
  /** 服务端上报地址（留空则不上报） */
  endpoint?: string;
  /** 访客唯一ID */
  visitorId?: string;
}

export interface TrackStats {
  [key: string]: number | string | null | string[];
  fiveMinuteStartCount: number;
  continueAfterFiveMinCount: number;
  taskStartWorkCount: number;
  aiSubtaskUsageCount: number;
  aiSubtaskTotalHardTasks: number;
  taskCompletedCount: number;
  taskTotalCount: number;
  firstVisitDate: string | null;
  visitDays: string[];
}

export interface TrackStatsResult {
  fiveMinuteStartCount: number;
  continueAfterFiveMinCount: number;
  taskStartWorkCount: number;
  aiSubtaskUsageRate: number;
  taskCompletionRate: number;
  retention3Day: number;
  retention7Day: number;
  firstVisitDate: string | null;
  totalVisitDays: number;
}

// ==================== 访客ID管理 ====================

function getOrCreateVisitorId(): string {
  const KEY = 'doit_visitor_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(KEY, id);
  }
  return id;
}

// ==================== 默认配置 ====================

const DEFAULT_CONFIG: TrackerConfig = {
  storageKey: 'doit_track_events',
  statsKey: 'doit_track_stats',
  maxEvents: 2000,
  retentionDays: [3, 7],
  debug: true,
  endpoint: typeof window !== 'undefined' ? '/.netlify/functions/track' : '',
  visitorId: typeof window !== 'undefined' ? getOrCreateVisitorId() : undefined,
};

// ==================== 事件 → 统计映射 ====================

interface StatMapping {
  /** 统计字段名 */
  field: keyof TrackStats;
  /** 累加方式: 'increment' 计数+1, 'list_add' 加入日期列表, 'first_date' 仅记录首次日期 */
  mode: 'increment' | 'list_add' | 'first_date';
}

const EVENT_STAT_MAPPINGS: Record<string, StatMapping> = {
  five_minute_start: { field: 'fiveMinuteStartCount', mode: 'increment' },
  continue_after_five_min: { field: 'continueAfterFiveMinCount', mode: 'increment' },
  task_start_work: { field: 'taskStartWorkCount', mode: 'increment' },
  ai_subtask_used: { field: 'aiSubtaskUsageCount', mode: 'increment' },
  hard_task_created: { field: 'aiSubtaskTotalHardTasks', mode: 'increment' },
  task_completed: { field: 'taskCompletedCount', mode: 'increment' },
  task_created: { field: 'taskTotalCount', mode: 'increment' },
  app_visit: { field: 'firstVisitDate', mode: 'first_date' },
};

// ==================== Tracker 类 ====================

export class Tracker {
  private config: TrackerConfig;
  private statMappings: Record<string, StatMapping>;

  constructor(config?: Partial<TrackerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.statMappings = { ...EVENT_STAT_MAPPINGS };
  }

  // -------------------- 事件存储 --------------------

  private getAllEvents(): TrackEvent[] {
    try {
      return JSON.parse(localStorage.getItem(this.config.storageKey) || '[]');
    } catch {
      return [];
    }
  }

  private saveEvents(events: TrackEvent[]) {
    localStorage.setItem(
      this.config.storageKey,
      JSON.stringify(events.slice(-this.config.maxEvents)),
    );
  }

  // -------------------- 统计存储 --------------------

  private getDefaultStats(): TrackStats {
    return {
      fiveMinuteStartCount: 0,
      continueAfterFiveMinCount: 0,
      taskStartWorkCount: 0,
      aiSubtaskUsageCount: 0,
      aiSubtaskTotalHardTasks: 0,
      taskCompletedCount: 0,
      taskTotalCount: 0,
      firstVisitDate: null,
      visitDays: [],
    };
  }

  private getRawStats(): TrackStats {
    try {
      const stats = JSON.parse(localStorage.getItem(this.config.statsKey) || 'null');
      return stats ? { ...this.getDefaultStats(), ...stats } : this.getDefaultStats();
    } catch {
      return this.getDefaultStats();
    }
  }

  private saveStats(stats: TrackStats) {
    localStorage.setItem(this.config.statsKey, JSON.stringify(stats));
  }

  private updateStats(event: TrackEvent) {
    const stats = this.getRawStats();
    const mapping = this.statMappings[event.event];

    if (mapping) {
      switch (mapping.mode) {
        case 'increment':
          (stats[mapping.field] as number)++;
          break;
        case 'first_date':
          if (!stats[mapping.field]) {
            stats[mapping.field] = event.date;
          }
          break;
      }
    }

    // app_visit 额外记录访问天数
    if (event.event === 'app_visit' && !stats.visitDays.includes(event.date)) {
      stats.visitDays.push(event.date);
    }

    this.saveStats(stats);
  }

  // -------------------- 公开方法 --------------------

  /**
   * 上报埋点事件
   * @param event 事件名
   * @param properties 附加属性
   */
  track(event: string, properties?: Record<string, any>) {
    const now = new Date();
    const eventData: TrackEvent = {
      event,
      timestamp: now.getTime(),
      date: now.toISOString().split('T')[0],
      properties,
    };

    // 本地存储
    const events = this.getAllEvents();
    events.push(eventData);
    this.saveEvents(events);

    this.updateStats(eventData);

    // 异步上报到服务端
    this.reportToServer(eventData);

    if (this.config.debug && (import.meta as any).env?.DEV) {
      console.log(`[Track] ${event}`, properties || '');
    }
  }

  /**
   * 异步上报事件到 Netlify Function（不阻塞主流程）
   */
  private reportToServer(eventData: TrackEvent) {
    if (!this.config.endpoint) return;

    const payload = {
      ...eventData,
      visitorId: this.config.visitorId || 'anonymous',
    };

    // 使用 sendBeacon 优先（页面卸载时也能发出）
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(this.config.endpoint, blob);
      return;
    }

    // 降级为 fetch
    fetch(this.config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // 静默失败，不影响用户体验
    });
  }

  /**
   * 记录页面访问（同时触发 app_visit）
   * @param page 页面标识
   */
  trackPageView(page: string) {
    this.track('page_view', { page });
    this.track('app_visit');
  }

  /**
   * 获取埋点统计概览
   * @returns 7项核心指标的计算结果
   */
  getStats(): TrackStatsResult {
    const stats = this.getRawStats();
    const now = new Date();

    // 计算留存
    const retention: Record<string, number> = {};
    for (const days of this.config.retentionDays) {
      const past = new Date(now);
      past.setDate(past.getDate() - days);
      const pastStr = past.toISOString().split('T')[0];
      retention[`retention${days}Day`] =
        stats.firstVisitDate &&
        pastStr >= stats.firstVisitDate &&
        stats.visitDays.includes(pastStr)
          ? 1
          : 0;
    }

    return {
      fiveMinuteStartCount: stats.fiveMinuteStartCount,
      continueAfterFiveMinCount: stats.continueAfterFiveMinCount,
      taskStartWorkCount: stats.taskStartWorkCount,
      aiSubtaskUsageRate:
        stats.aiSubtaskTotalHardTasks > 0
          ? Math.round((stats.aiSubtaskUsageCount / stats.aiSubtaskTotalHardTasks) * 100)
          : 0,
      taskCompletionRate:
        stats.taskTotalCount > 0
          ? Math.round((stats.taskCompletedCount / stats.taskTotalCount) * 100)
          : 0,
      retention3Day: retention['retention3Day'] ?? 0,
      retention7Day: retention['retention7Day'] ?? 0,
      firstVisitDate: stats.firstVisitDate,
      totalVisitDays: stats.visitDays.length,
    };
  }

  /**
   * 注册自定义事件到统计映射
   * @param eventName 事件名
   * @param field 统计字段名
   * @param mode 累加方式
   */
  registerStatMapping(eventName: string, field: keyof TrackStats, mode: 'increment' | 'first_date') {
    this.statMappings[eventName] = { field, mode };
  }

  /**
   * 获取所有原始事件（分页）
   * @param offset 起始位置
   * @param limit 数量
   */
  getEvents(offset = 0, limit = 100): TrackEvent[] {
    const events = this.getAllEvents();
    return events.slice(offset, offset + limit);
  }

  /**
   * 清除所有埋点数据
   */
  clear() {
    localStorage.removeItem(this.config.storageKey);
    localStorage.removeItem(this.config.statsKey);
  }

  // -------------------- 测试工具 --------------------

  /**
   * 注入模拟埋点数据，用于测试
   */
  injectMockData() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const day3 = new Date(now);
    day3.setDate(day3.getDate() - 3);
    const day3Str = day3.toISOString().split('T')[0];

    const day7 = new Date(now);
    day7.setDate(day7.getDate() - 7);
    const day7Str = day7.toISOString().split('T')[0];

    const day8 = new Date(now);
    day8.setDate(day8.getDate() - 8);
    const day8Str = day8.toISOString().split('T')[0];

    const mockEvents: TrackEvent[] = [
      { event: 'app_visit', timestamp: day8.getTime(), date: day8Str },
      { event: 'app_visit', timestamp: day3.getTime(), date: day3Str },
      { event: 'app_visit', timestamp: day7.getTime(), date: day7Str },
      { event: 'app_visit', timestamp: now.getTime(), date: todayStr },
    ];

    for (let i = 0; i < 5; i++) {
      mockEvents.push({
        event: 'five_minute_start',
        timestamp: day8.getTime() + i * 86400000,
        date: new Date(day8.getTime() + i * 86400000).toISOString().split('T')[0],
        properties: { taskId: `mock-task-${i}` },
      });
    }

    for (let i = 0; i < 3; i++) {
      mockEvents.push({
        event: 'continue_after_five_min',
        timestamp: day8.getTime() + i * 86400000,
        date: new Date(day8.getTime() + i * 86400000).toISOString().split('T')[0],
        properties: { totalMinutes: 35 + i * 10 },
      });
    }

    for (let i = 0; i < 8; i++) {
      mockEvents.push({
        event: 'task_start_work',
        timestamp: day8.getTime() + i * 86400000,
        date: new Date(day8.getTime() + i * 86400000).toISOString().split('T')[0],
        properties: { taskId: `mock-task-${i}` },
      });
    }

    for (let i = 0; i < 4; i++) {
      mockEvents.push({
        event: 'ai_subtask_used',
        timestamp: day8.getTime() + i * 86400000,
        date: new Date(day8.getTime() + i * 86400000).toISOString().split('T')[0],
        properties: { taskTitle: `困难任务${i}`, difficulty: 'hard' },
      });
    }

    for (let i = 0; i < 6; i++) {
      mockEvents.push({
        event: 'hard_task_created',
        timestamp: day8.getTime() + i * 86400000,
        date: new Date(day8.getTime() + i * 86400000).toISOString().split('T')[0],
      });
    }

    for (let i = 0; i < 10; i++) {
      mockEvents.push({
        event: 'task_created',
        timestamp: day8.getTime() + i * 86400000,
        date: new Date(day8.getTime() + i * 86400000).toISOString().split('T')[0],
        properties: { difficulty: i % 3 === 0 ? 'hard' : i % 3 === 1 ? 'medium' : 'easy' },
      });
    }

    for (let i = 0; i < 7; i++) {
      mockEvents.push({
        event: 'task_completed',
        timestamp: day8.getTime() + i * 86400000,
        date: new Date(day8.getTime() + i * 86400000).toISOString().split('T')[0],
        properties: { difficulty: 'medium' },
      });
    }

    this.saveEvents(mockEvents);

    const stats: TrackStats = {
      fiveMinuteStartCount: 5,
      continueAfterFiveMinCount: 3,
      taskStartWorkCount: 8,
      aiSubtaskUsageCount: 4,
      aiSubtaskTotalHardTasks: 6,
      taskCompletedCount: 7,
      taskTotalCount: 10,
      firstVisitDate: day8Str,
      visitDays: [day8Str, day7Str, day3Str, todayStr],
    };
    this.saveStats(stats);

    console.log('✅ 模拟埋点数据已注入！预期结果：');
    console.log('  5分钟启动法使用次数: 5');
    console.log('  5分钟后继续30分钟以上: 3');
    console.log('  开始工作计时次数: 8');
    console.log('  AI分解使用率: 67% (4/6)');
    console.log('  任务完成率: 70% (7/10)');
    console.log('  3日留存: 1 (是)');
    console.log('  7日留存: 1 (是)');
  }

  /**
   * 打印统计表格到控制台
   */
  printStats(): TrackStatsResult {
    const stats = this.getStats();
    console.log('📊 当前埋点统计：');
    console.table({
      '5分钟启动法使用次数': stats.fiveMinuteStartCount,
      '5分钟后继续30分钟+次数': stats.continueAfterFiveMinCount,
      '开始工作计时次数': stats.taskStartWorkCount,
      'AI分解使用率': `${stats.aiSubtaskUsageRate}%`,
      '任务完成率': `${stats.taskCompletionRate}%`,
      '3日留存': stats.retention3Day ? '是' : '否',
      '7日留存': stats.retention7Day ? '是' : '否',
      '首次访问日期': stats.firstVisitDate,
      '总访问天数': stats.totalVisitDays,
    });
    return stats;
  }
}

// ==================== 单例 + 兼容导出 ====================

/** 默认单例实例 */
export const tracker = new Tracker();

/** 向后兼容：track 函数 */
export function track(event: string, properties?: Record<string, any>) {
  tracker.track(event, properties);
}

/** 向后兼容：trackPageView 函数 */
export function trackPageView(page: string) {
  tracker.trackPageView(page);
}

/** 向后兼容：getTrackStats 函数 */
export function getTrackStats(): TrackStatsResult {
  return tracker.getStats();
}

/** 向后兼容：注入模拟数据 */
export function injectMockTrackData() {
  tracker.injectMockData();
}

/** 向后兼容：清除数据 */
export function clearTrackData() {
  tracker.clear();
  console.log('✅ 埋点数据已清除');
}

/** 向后兼容：打印统计 */
export function printTrackStats(): TrackStatsResult {
  return tracker.printStats();
}

// ==================== 挂载到 window 供控制台调用 ====================

if (typeof window !== 'undefined') {
  (window as any).__injectMockTrackData = injectMockTrackData;
  (window as any).__clearTrackData = clearTrackData;
  (window as any).__getTrackStats = printTrackStats;
  (window as any).__tracker = tracker;
}
