import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const statsKey = 'doit_track_stats_global';
    let stats = getDefaultStats();

    // 尝试从 Netlify Blobs 读取
    try {
      const { getStore } = getStoreInternal();
      if (getStore) {
        const raw = await getStore(statsKey);
        if (raw) {
          stats = { ...getDefaultStats(), ...JSON.parse(raw) };
        }
      }
    } catch {
      // 降级处理
    }

    // 计算衍生指标
    const aiSubtaskUsageRate =
      stats.aiSubtaskTotalHardTasks > 0
        ? Math.round((stats.aiSubtaskUsageCount / stats.aiSubtaskTotalHardTasks) * 100)
        : 0;

    const taskCompletionRate =
      stats.taskTotalCount > 0
        ? Math.round((stats.taskCompletedCount / stats.taskTotalCount) * 100)
        : 0;

    // 留存计算
    const now = new Date();
    const checkRetention = (days: number) => {
      const past = new Date(now);
      past.setDate(past.getDate() - days);
      const pastStr = past.toISOString().split('T')[0];
      return stats.firstVisitDate && pastStr >= stats.firstVisitDate && stats.visitDays.includes(pastStr) ? 1 : 0;
    };

    const result = {
      // 核心指标
      fiveMinuteStartCount: stats.fiveMinuteStartCount,
      continueAfterFiveMinCount: stats.continueAfterFiveMinCount,
      taskStartWorkCount: stats.taskStartWorkCount,
      aiSubtaskUsageRate: `${aiSubtaskUsageRate}%`,
      taskCompletionRate: `${taskCompletionRate}%`,
      retention3Day: checkRetention(3) ? '是' : '否',
      retention7Day: checkRetention(7) ? '是' : '否',
      // 额外信息
      firstVisitDate: stats.firstVisitDate,
      totalVisitDays: stats.visitDays.length,
      uniqueVisitorCount: stats.uniqueVisitors.length,
      totalEvents: stats.totalEvents,
      // 原始统计
      raw: stats,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result, null, 2),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', detail: String(err) }),
    };
  }
};

function getStoreInternal() {
  try {
    const storeModule = require('@netlify/blobs');
    return {
      getStore: async (key: string, value?: string) => {
        const store = storeModule.getStore('doit-tracking');
        if (value !== undefined) {
          await store.setJSON(key, value);
        }
        return await store.get(key);
      },
      type: 'netlify-blobs',
    };
  } catch {
    const memStore: Record<string, string> = {};
    return {
      getStore: async (key: string, value?: string) => {
        if (value !== undefined) memStore[key] = value;
        return memStore[key] || null;
      },
      type: 'memory',
    };
  }
}
