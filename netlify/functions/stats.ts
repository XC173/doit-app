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
      const { getStore } = await getStoreInternal();
      if (getStore) {
        const raw = await getStore(statsKey);
        if (raw && typeof raw === 'object') {
          stats = { ...getDefaultStats(), ...raw };
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

async function getStoreInternal() {
  try {
    // 动态 import 兼容 ESM 环境
    const storeModule = await import('@netlify/blobs');
    // 若 Netlify 未自动注入 Blobs 上下文，从环境变量手动提供
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
        }
        return await store.get(key, { type: 'json' });
      },
      type: 'netlify-blobs',
    };
  } catch {
    const memStore: Record<string, any> = {};
    return {
      getStore: async (key: string, value?: any) => {
        if (value !== undefined) memStore[key] = value;
        return memStore[key] || null;
      },
      type: 'memory',
    };
  }
}
