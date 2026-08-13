import { useState } from 'react';
import { User, Bell, Palette, Shield, HelpCircle, LogOut, Save, LucideIcon, Wrench } from 'lucide-react';

interface SettingItem {
  icon: LucideIcon;
  label: string;
  description: string;
  action: () => void;
  toggle?: boolean;
  value?: boolean | string;
  select?: boolean;
  options?: string[];
  onChange?: (value: string) => void;
}

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

export function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [reminderTime, setReminderTime] = useState('10');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSave = () => {
    showToast('设置已保存');
  };

  const handleComingSoon = () => {
    showToast('功能开发中');
  };

  const settingGroups: SettingGroup[] = [
    {
      title: '账户设置',
      items: [
        {
          icon: User,
          label: '个人资料',
          description: '管理您的姓名、头像和联系方式',
          action: handleComingSoon,
        },
        {
          icon: Shield,
          label: '隐私设置',
          description: '控制您的数据和隐私选项',
          action: handleComingSoon,
        },
      ],
    },
    {
      title: '应用设置',
      items: [
        {
          icon: Bell,
          label: '通知提醒',
          description: `任务提醒${notifications ? '已开启' : '已关闭'}`,
          action: () => setNotifications(!notifications),
          toggle: true,
          value: notifications,
        },
        {
          icon: Palette,
          label: '深色模式',
          description: `界面主题${darkMode ? '深色' : '浅色'}`,
          action: () => setDarkMode(!darkMode),
          toggle: true,
          value: darkMode,
        },
        {
          icon: Bell,
          label: '提醒间隔',
          description: `任务提醒间隔：${reminderTime}分钟`,
          action: handleComingSoon,
          select: true,
          options: ['5', '10', '15', '30'],
          value: reminderTime,
          onChange: setReminderTime,
        },
      ],
    },
    {
      title: '帮助与支持',
      items: [
        {
          icon: HelpCircle,
          label: '帮助中心',
          description: '查看常见问题和使用指南',
          action: handleComingSoon,
        },
        {
          icon: HelpCircle,
          label: '反馈意见',
          description: '向我们发送您的建议和反馈',
          action: handleComingSoon,
        },
      ],
    },
  ];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">设置</h1>
          <p className="text-gray-500 mt-1">管理您的账户和应用设置</p>
        </div>
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save size={18} />保存设置
        </button>
      </div>

      <div className="space-y-8">
        {settingGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{group.title}</h2>
            <div className="space-y-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="card flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                    onClick={item.action}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Icon size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    
                    {item.toggle && typeof item.value === 'boolean' && item.action && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          item.action();
                        }}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          item.value ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                            item.value ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    )}
                    
                    {item.select && item.options && typeof item.value === 'string' && item.onChange && (
                      <select
                        value={item.value}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          item.onChange?.(e.target.value);
                        }}
                        className="input-field w-24 text-sm"
                      >
                        {item.options.map((option) => (
                          <option key={option} value={option}>
                            {option}分钟
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {!item.toggle && !item.select && (
                      <Wrench size={18} className="text-gray-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="card bg-red-50 border-red-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              showToast('功能开发中');
            }}
            className="w-full flex items-center gap-4 text-red-600 hover:text-red-700 transition-colors"
          >
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <LogOut size={20} />
            </div>
            <div className="text-left">
              <p className="font-medium">退出登录</p>
              <p className="text-sm text-red-500">安全退出您的账户</p>
            </div>
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
            <Wrench size={16} />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
