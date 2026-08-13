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
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  startTime: string;
  endTime: string;
  activity: string;
  duration: number;
}

export interface DailyTimeLog {
  date: string;
  entries: TimeEntry[];
}

export interface UserProgress {
  date: string;
  tasksCompleted: number;
  totalTasks: number;
  productiveMinutes: number;
  procrastinationMinutes: number;
}

export interface EysenckQuestion {
  id: number;
  text: string;
  category: 'decisionalProcrastination' | 'avoidantProcrastination' | 'arousalProcrastination';
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

export interface DiagnosisResult {
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

export const eysenckQuestions: EysenckQuestion[] = [
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

export const cognitiveReappraisalQuotes: string[] = [
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

export const procrastinationReasons = [
  { id: 1, title: '完美主义', description: '害怕做得不够完美而迟迟不敢开始', suggestions: ['接受不完美，先完成再优化', '将任务分解成小步骤'] },
  { id: 2, title: '任务厌恶', description: '对任务本身感到厌烦或焦虑', suggestions: ['使用5分钟启动法', '将任务与喜欢的活动结合'] },
  { id: 3, title: '决策困难', description: '面对多种选择时难以做出决定', suggestions: ['设定时间限制做出决定', '使用利弊分析法'] },
  { id: 4, title: '寻求刺激', description: '喜欢在压力下工作', suggestions: ['提前设定小截止日期', '分解任务并设置多个里程碑'] },
  { id: 5, title: '缺乏动力', description: '对任务缺乏兴趣或看不到意义', suggestions: ['明确任务与目标的关联', '使用奖励机制'] },
  { id: 6, title: '时间管理不善', description: '缺乏有效的时间管理策略', suggestions: ['使用四象限法', '制定每日计划'] },
];

export const selfForgivenessContent: string[] = [
  '今天的表现不够理想，但这没关系。每个成功者都有低谷期，重要的是你愿意继续前行。',
  '拖延是一种习惯，而不是性格缺陷。你已经在努力改变，这本身就值得肯定。',
  '请对自己温柔一些。改变需要时间和耐心，一步一步来，你正在变得更好。',
  '昨天的不完美不代表明天的失败。你可以在任何时候重新开始，现在就是最好的时机。',
  '你不是一个人在战斗。许多人都经历过同样的挣扎，你已经比昨天更了解自己了。',
];

export const encouragementContent: string[] = [
  '真棒！你今天完成了更多工作，继续保持这种势头！',
  '进步是实实在在的，为自己感到骄傲吧！',
  '你的努力开始得到回报了，继续加油！',
  '今天的你比昨天更高效，这就是进步！',
  '保持专注，你正在成为更好的自己！',
];
