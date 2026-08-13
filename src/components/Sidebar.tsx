import { LayoutDashboard, ListTodo, Timer, BarChart3, Settings, Calendar, Stethoscope } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '今日概览' },
    { id: 'schedule', icon: Calendar, label: '日程' },
    { id: 'tasks', icon: ListTodo, label: '任务管理' },
    { id: 'timer', icon: Timer, label: '事件记录' },
    { id: 'diagnosis', icon: Stethoscope, label: '拖延诊断' },
    { id: 'analytics', icon: BarChart3, label: '数据统计' },
    { id: 'settings', icon: Settings, label: '设置' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Do it!</h1>
            <p className="text-xs text-gray-400">战胜拖延</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">用户</p>
            <p className="text-xs text-gray-400">user@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}