import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface TrackEventPayload {
  event: string;
  timestamp: number;
  date: string;
  properties?: Record<string, any>;
  visitorId: string;
}

// 事件 → 统计字段映射
const STAT_MAPPINGS: Record<string, { field: string; mode: 'increment' | 'first_date' }> = {
  five_minute_start: { field: 'fiveMinuteStartCount', mode: 'increment' },
  continue_after_five_min: { field: 'continueAfterFiveMinCount', mode: 'increment' },
  task_start_work: { field: 'taskStartWorkCount', mode: 'increment' },
  ai_subtask_used: { field: 'aiSubtaskUsageCount', mode: 'increment' },
  hard_task_created: { field: 'aiSubtaskTotalHardTasks', mode: 'increment' },
  task_completed: { field: 'taskCompletedCount', mode: 'increment' },
  task_created: { field: 'taskTotalCount', mode: 'increment' },
  app_visit: { field: 'firstVisitDate', mode: 'first_date' },
};

function getDefaultStats() {
  return {
    fiveMinuteStartCount: 0,
    continueAfterFiveMinCount: 0,
    taskStartWorkCount: 0,
    aiSubtaskUsageCount: 0,
    aiSubtaskTotalHardTasks: 0,
    taskCompletedCount: 0,
    taskTotalCount: 0,
    firstVisitDate: null as string | null,
    visitDays: [] as string[],
    uniqueVisitors: [] as string[],
    totalEvents: 0,
  };
}

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // 处理 CORS 预检
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const payload: TrackEventPayload = JSON.parse(event.body || '{}');

    if (!payload.event) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing event name' }),
      };
    }

    // 读取现有统计数据
    const statsKey = 'doit_track_stats_global';
    let stats = getDefaultStats();

    // Netlify Blobs 存储（如果可用）
    // 这里使用环境变量存储的 JSON 作为简单方案
    // 实际部署时可通过 Netlify Blobs API 持久化
    const { getStore } = await getStoreInternal();

    if (getStore) {
      const existing = await getStore(statsKey);
      if (existing && typeof existing === 'object') {
        stats = { ...getDefaultStats(), ...existing };
      }
    }

    // 更新统计
    const mapping = STAT_MAPPINGS[payload.event];
    if (mapping) {
      if (mapping.mode === 'increment') {
        (stats as any)[mapping.field]++;
      } else if (mapping.mode === 'first_date' && !(stats as any)[mapping.field]) {
        (stats as any)[mapping.field] = payload.date;
      }
    }

    // 记录访问天数
    if (payload.event === 'app_visit' && !stats.visitDays.includes(payload.date)) {
      stats.visitDays.push(payload.date);
    }

    // 记录唯一访客
    if (payload.visitorId && !stats.uniqueVisitors.includes(payload.visitorId)) {
      stats.uniqueVisitors.push(payload.visitorId);
    }

    stats.totalEvents++;

    // 保存统计数据
    if (getStore) {
      await getStore(statsKey, stats);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, event: payload.event }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', detail: String(err) }),
    };
  }
};

// Netlify Blobs 存储辅助函数
// 部署后自动使用 Netlify 的 KV 存储
async function getStoreInternal() {
  try {
    // 动态 import 兼容 ESM 环境（项目 type:module 下 require 不可用）
    const storeModule = await import('@netlify/blobs');
    // 若 Netlify 未自动注入 Blobs 上下文（旧版 Functions 运行时），
    // 从环境变量读取 siteID + token 手动提供
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_API_TOKEN || process.env.BLOB_TOKEN;
    const opts = (siteID && token) ? { siteID, token } : undefined;
    const store = opts
      ? storeModule.getStore('doit-tracking', opts)
      : storeModule.getStore('doit-tracking');
    return {
      getStore: async (key: string, value?: any) => {
        if (value !== undefined) {
          await store.setJSON(key, value);
          return value;
        }
        return await store.get(key, { type: 'json' });
      },
      type: 'netlify-blobs',
    };
  } catch {
    // 本地开发或未安装 @netlify/blobs 时降级为内存存储
    const memStore: Record<string, any> = {};
    return {
      getStore: async (key: string, value?: any) => {
        if (value !== undefined) {
          memStore[key] = value;
        }
        return memStore[key] || null;
      },
      type: 'memory',
    };
  }
}
