import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

interface CalendarProps {
  onTaskClick: (taskId: string) => void;
}

export function Calendar({ onTaskClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const tasks = useTaskStore((state) => state.tasks);
  const getQuadrantColor = useTaskStore((state) => state.getQuadrantColor);
  const calculateUrgency = useTaskStore((state) => state.calculateUrgency);

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
      days.push(<div key={`empty-${i}`} className="h-14" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = getTasksForDay(day);
      const isTodayClass = isToday(day) ? 'ring-2 ring-primary ring-offset-1' : '';
      
      days.push(
        <div
          key={day}
          className={`h-14 p-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${isTodayClass}`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium ${isToday(day) ? 'text-primary' : 'text-gray-800'}`}>
              {day}
            </span>
          </div>
          <div className="mt-1 space-y-1 max-h-24 overflow-y-auto">
            {dayTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task.id)}
                className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer ${getQuadrantColor(task)} hover:opacity-80`}
                title={task.title}
              >
                {calculateUrgency(task) === 'critical' && '⚠️'}
                {task.title}
              </div>
            ))}
            {dayTasks.length > 3 && (
              <span className="text-xs text-gray-400">+{dayTasks.length - 3} more</span>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">日历</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-medium text-gray-800">
            {year}年 {monthNames[month]}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        {renderDays()}
      </div>
      
      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className="px-2 py-1 bg-red-100 text-red-700 rounded">重要+紧急</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">重要+不紧急</span>
        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">不重要+紧急</span>
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">不重要+不紧急</span>
        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">长期</span>
      </div>
    </div>
  );
}