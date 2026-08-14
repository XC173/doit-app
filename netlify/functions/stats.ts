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
    visitorFirstDates: {} as Record<string, string>,
    visitorVisitDays: {} as Record<string, string[]>,
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

    // 留存计算：按访客逐个判断 —— 首访日 >= N天前 且 首访后第N天有回访
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const addDays = (d: Date, n: number) => {
      const r = new Date(d); r.setDate(r.getDate() + n); return r;
    };
    // N日留存: 候选(首访日距今>=N天的访客)中, 首访后第N天那天有回访的比例
    const calcRetention = (days: number) => {
      const cutoff = fmt(addDays(today, -days)); // 今天往前N天
      let candidates = 0;
      let retained = 0;
      const vids = Object.keys(stats.visitorFirstDates || {});
      for (const vid of vids) {
        const first = stats.visitorFirstDates[vid];
        if (!first || first > cutoff) continue; // 首访不足N天，不算候选
        candidates++;
        const nthDay = fmt(addDays(new Date(first), days)); // 首访后第N天
        const visits = stats.visitorVisitDays?.[vid] || [];
        if (visits.includes(nthDay)) retained++;
      }
      return { candidates, retained, ratio: candidates > 0 ? retained / candidates : 0 };
    };
    // 判断"是否存在至少1个留存用户"给二进制用
    const checkRetention = (days: number) => {
      const r = calcRetention(days);
      return r.retained > 0;
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
      retention3DayDetail: calcRetention(3),
      retention7DayDetail: calcRetention(7),
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
