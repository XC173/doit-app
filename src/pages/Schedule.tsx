import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Play } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

export function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const tasks = useTaskStore((state) => state.tasks);
  const getQuadrantColor = useTaskStore((state) => state.getQuadrantColor);
  const calculateUrgency = useTaskStore((state) => state.calculateUrgency);
  const startTaskWork = useTaskStore((state) => state.startTaskWork);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isWeekend = (day: number) => {
    const dayOfWeek = new Date(year, month, day).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isHoliday = (day: number) => {
    const holidays = [
      { month: 0, day: 1 },
      { month: 0, day: 2 },
      { month: 0, day: 3 },
      { month: 4, day: 1 },
      { month: 4, day: 2 },
      { month: 4, day: 3 },
      { month: 10, day: 1 },
      { month: 10, day: 2 },
      { month: 10, day: 3 },
      { month: 11, day: 31 },
    ];
    return holidays.some(h => h.month === month && h.day === day);
  };

  const getTasksForDay = (day: number) => {
    return tasks.filter((task) => {
      if (task.deadline === 'long-term') return false;
      const deadline = new Date(task.deadline);
      return deadline.getDate() === day && 
             deadline.getMonth() === month && 
             deadline.getFullYear() === year &&
             task.status !== 'completed';
    });
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const renderDays = () => {
    const days = [];
    
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = getTasksForDay(day);
      const isTodayClass = isToday(day) ? 'ring-2 ring-primary ring-offset-2' : '';
      const isSelected = selectedDate?.getDate() === day && 
                        selectedDate?.getMonth() === month && 
                        selectedDate?.getFullYear() === year;
      const weekendClass = isWeekend(day) ? 'bg-gray-50' : '';
      const holidayClass = isHoliday(day) ? 'bg-red-50' : '';
      
      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(new Date(year, month, day))}
          className={`h-24 p-2 rounded-lg cursor-pointer transition-colors ${isTodayClass} ${isSelected ? 'bg-primary/10' : ''} ${weekendClass} ${holidayClass} hover:bg-gray-100`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1">
              <span className={`text-sm font-semibold ${isToday(day) ? 'text-primary' : isHoliday(day) ? 'text-red-600' : isWeekend(day) ? 'text-gray-400' : 'text-gray-800'}`}>
                {day}
              </span>
              {isHoliday(day) && <span className="text-xs text-red-500">节</span>}
            </div>
            {isToday(day) && (
              <span className="text-xs px-1.5 py-0.5 bg-primary text-white rounded-full">今日</span>
            )}
          </div>
          <div className="space-y-1 max-h-16 overflow-y-auto">
            {dayTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className={`text-xs px-1.5 py-0.5 rounded truncate ${getQuadrantColor(task)}`}
                title={task.title}
              >
                {calculateUrgency(task) === 'critical' && '⚠️'}
                {task.title}
              </div>
            ))}
            {dayTasks.length > 4 && (
              <span className="text-xs text-gray-400">+{dayTasks.length - 4}</span>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const selectedDayTasks = selectedDate 
    ? tasks.filter((task) => {
        if (task.deadline === 'long-term') return false;
        const deadline = new Date(task.deadline);
        return deadline.toDateString() === selectedDate.toDateString() && task.status !== 'completed';
      })
    : [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">日程</h1>
          <p className="text-gray-500 mt-1">查看和管理您的日程安排</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <span className="text-xl font-medium text-gray-800 px-4">
            {year}年 {monthNames[month]}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={24} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="card">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, index) => (
                <div 
                  key={day} 
                  className={`text-center py-3 font-semibold ${index === 0 || index === 6 ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {day}
                </div>
              ))}
              {renderDays()}
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                <span className="text-gray-600">工作日</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                <span className="text-gray-600">周末</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                <span className="text-gray-600">节假日</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary/20 rounded"></div>
                <span className="text-gray-600">今日</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="card">
            {selectedDate ? (
              <>
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">
                    {selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                    {isHoliday(selectedDate.getDate()) && <span className="ml-2 text-red-500">节假日</span>}
                  </h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500">当日任务</span>
                    <button className="btn-secondary flex items-center gap-1 text-sm">
                      <Plus size={16} />添加任务
                    </button>
                  </div>
                  {selectedDayTasks.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">暂无任务</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-3 rounded-lg ${getQuadrantColor(task)} cursor-pointer hover:opacity-80 flex items-center justify-between`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{task.title}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {task.description ? task.description.substring(0, 30) + '...' : '无描述'}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startTaskWork(task.id);
                            }}
                            className="ml-3 p-2 bg-white/50 hover:bg-white rounded-lg transition-colors"
                            title="开始处理"
                          >
                            <Play size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-400">点击日历中的日期查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}