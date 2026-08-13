export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  importance: 'important' | 'not-important';
  difficulty: 'easy' | 'medium' | 'hard';
  startTime: string;
  deadline: string | 'long-term';
  status: 'pending' | 'in-progress' | 'completed';
  subtasks: Subtask[];
  tags?: string[]; // 任务标签，如 'routine' 表示日常任务
  createdAt: string;
  updatedAt: string;
}

export interface TimeRecord {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string;
  duration: number;
  category: 'work' | 'break' | 'learning';
}

export interface UserProgress {
  date: string;
  tasksCompleted: number;
  totalTasks: number;
  productiveMinutes: number;
  procrastinationMinutes: number;
}

export interface DiagnosisResult {
  id: string;
  results: {
    perfectionism: number;
    taskAversion: number;
    timeManagement: number;
    motivation: number;
  };
  completedAt: string;
}

export interface EysenckDiagnosisResult {
  id: string;
  totalScore: number;
  subscales: {
    decisionalProcrastination: number;
    avoidantProcrastination: number;
    arousalProcrastination: number;
  };
  interpretation: {
    level: 'low' | 'mild' | 'moderate' | 'severe';
    description: string;
    suggestions: string[];
  };
  completedAt: string;
}

export const eysenckQuestions = [
  { id: 1, text: '我常常推迟做决定', category: 'decisionalProcrastination' },
  { id: 2, text: '我发现很难开始一项新任务', category: 'avoidantProcrastination' },
  { id: 3, text: '我喜欢在压力下工作', category: 'arousalProcrastination' },
  { id: 4, text: '我常常把事情拖到最后一刻', category: 'avoidantProcrastination' },
  { id: 5, text: '我倾向于推迟处理不愉快的任务', category: 'avoidantProcrastination' },
  { id: 6, text: '我常常犹豫不决', category: 'decisionalProcrastination' },
  { id: 7, text: '我喜欢在截止日期前冲刺', category: 'arousalProcrastination' },
  { id: 8, text: '我发现很难对事情说"不"', category: 'decisionalProcrastination' },
  { id: 9, text: '我常常拖延那些需要集中注意力的任务', category: 'avoidantProcrastination' },
  { id: 10, text: '我觉得最后一分钟的工作效率最高', category: 'arousalProcrastination' },
  { id: 11, text: '我常常推迟回复邮件或消息', category: 'avoidantProcrastination' },
  { id: 12, text: '我很难做出重要的决定', category: 'decisionalProcrastination' },
  { id: 13, text: '我喜欢在压力下发挥最佳水平', category: 'arousalProcrastination' },
  { id: 14, text: '我常常把困难的任务留到以后', category: 'avoidantProcrastination' },
  { id: 15, text: '我倾向于拖延需要创造力的任务', category: 'avoidantProcrastination' },
  { id: 16, text: '我常常改变主意', category: 'decisionalProcrastination' },
  { id: 17, text: '截止日期临近时我才会真正开始工作', category: 'arousalProcrastination' },
  { id: 18, text: '我常常推迟处理文书工作', category: 'avoidantProcrastination' },
  { id: 19, text: '我发现很难优先处理任务', category: 'decisionalProcrastination' },
  { id: 20, text: '我喜欢在有时间压力时工作', category: 'arousalProcrastination' },
];

export const procrastinationReasons = [
  {
    id: 1,
    title: '完美主义',
    description: '害怕做得不够完美而迟迟不敢开始，追求完美的心态导致拖延。',
    suggestions: ['接受不完美，先完成再优化', '将任务分解成小步骤', '设定"足够好"的标准'],
  },
  {
    id: 2,
    title: '任务厌恶',
    description: '对任务本身感到厌烦或焦虑，下意识地逃避不愉快的任务。',
    suggestions: ['使用5分钟启动法', '将任务与喜欢的活动结合', '改变任务的呈现方式'],
  },
  {
    id: 3,
    title: '决策困难',
    description: '面对多种选择时难以做出决定，导致拖延行动。',
    suggestions: ['设定时间限制做出决定', '使用利弊分析法', '接受"足够好"的选择'],
  },
  {
    id: 4,
    title: '寻求刺激',
    description: '喜欢在压力下工作，只有在最后一刻才能感受到动力。',
    suggestions: ['提前设定小截止日期', '分解任务并设置多个里程碑', '培养内在动力'],
  },
  {
    id: 5,
    title: '缺乏动力',
    description: '对任务缺乏兴趣或看不到意义，缺乏行动的动力。',
    suggestions: ['明确任务与目标的关联', '寻找内在动机', '使用奖励机制'],
  },
  {
    id: 6,
    title: '时间管理不善',
    description: '缺乏有效的时间管理策略，导致任务堆积。',
    suggestions: ['使用四象限法', '制定每日计划', '使用时间块技术'],
  },
  {
    id: 7,
    title: '过度自信',
    description: '低估完成任务所需的时间，导致拖延。',
    suggestions: ['使用三点估算法', '预留缓冲时间', '记录实际耗时'],
  },
  {
    id: 8,
    title: '害怕失败',
    description: '对失败的恐惧阻止了行动的开始。',
    suggestions: ['重新定义失败为学习机会', '设定可实现的小目标', '练习自我同情'],
  },
];

export interface DailyTimeLog {
  date: string;
  entries: TimeEntry[];
}

export interface TimeEntry {
  startTime: string;
  endTime: string;
  activity: string;
  duration: number;
}

export interface RecurringTask {
  id: string;
  title: string;
  description: string;
  importance: 'important' | 'not-important';
  difficulty: 'easy' | 'medium' | 'hard';
  startTime: string;
  duration: number;
  recurrenceType: 'daily' | 'weekdays' | 'custom';
  customDays: number[];
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export type ImportanceType = Task['importance'];
export type StatusType = Task['status'];
export type DifficultyType = Task['difficulty'];

// 认知重评内容 - 用于工作计时过程中显示
export const cognitiveReappraisalQuotes = [
  '我可以先完成，然后再改进。完美主义会阻碍行动，完成比完美更重要。',
  '失败是学习的机会，每个人都会经历。害怕失败是拖延的常见原因。',
  '我可以把任务分解成小步骤，一步一步来。任务分解可以降低畏难情绪。',
  '先开始5分钟，看看感觉如何。动机往往在行动之后才出现，而不是之前。',
  '我不必一次性完成所有事情，可以分阶段进行。',
  '现在的努力是为了更好的未来，每一步都有意义。',
  '困难是暂时的，我有能力克服它。',
  '我不需要做到完美，只需要做到足够好。',
  '拖延只会增加焦虑，行动才能带来平静。',
  '我选择现在开始，而不是等待"完美时机"。',
];

// 自我宽恕内容 - 用于工作时间下降时显示
export const selfForgivenessContent = [
  '拖延是人类的正常行为，不要因此过度自责。接受自己的不完美，才能更好地前进。',
  '研究表明，自我宽恕可以减少未来的拖延行为。对自己宽容一些，明天又是新的一天。',
  '当你感到焦虑或自责时，试着做几次深呼吸。吸气4秒，屏息4秒，呼气4秒。',
  '用鼓励的话语代替自我批评。把"我真没用"换成"我正在努力，这已经很棒了"。',
  '每个人都有低谷期，这并不代表你失败了。休息一下，重新开始。',
  '过去的一周已经过去了，关注当下你能做什么才是最重要的。',
  '你值得被善待，包括被自己善待。给自己一些温柔和理解。',
];

// 鼓励表扬内容 - 用于工作时间提升或持平时显示
export const encouragementContent = [
  '太棒了！你这周的努力值得肯定，继续保持！',
  '你的专注和坚持令人钦佩，继续加油！',
  '做得很好！保持这个势头，你会越来越棒！',
  '你正在进步，每一步都在向着目标靠近！',
  '坚持就是胜利，你的努力一定会有回报！',
  '出色的表现！继续保持这种积极的态度！',
  '你已经做得很棒了，相信自己，继续前进！',
  '这周的表现非常出色，再接再厉！',
];