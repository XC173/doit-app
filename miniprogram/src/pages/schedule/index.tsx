import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useTaskStore } from '@/store/taskStore';
import styles from './index.module.scss';

const HOLIDAYS = [
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

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

const SchedulePage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const tasks = useTaskStore((state) => state.tasks);
  const getQuadrantColor = useTaskStore((state) => state.getQuadrantColor);
  const calculateUrgency = useTaskStore((state) => state.calculateUrgency);
  const startTaskWork = useTaskStore((state) => state.startTaskWork);
  const mockData = useTaskStore((state) => state.mockData);

  useEffect(() => {
    mockData();
  }, [mockData]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
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
    return HOLIDAYS.some(h => h.month === month && h.day === day);
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

  const selectedDayTasks = selectedDate
    ? tasks.filter((task) => {
        if (task.deadline === 'long-term') return false;
        const deadline = new Date(task.deadline);
        return deadline.toDateString() === selectedDate.toDateString() && task.status !== 'completed';
      })
    : [];

  const formatSelectedDate = (date: Date) => {
    const weekDayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekDayNames[date.getDay()]}`;
  };

  const handleStartTask = (taskId: string) => {
    startTaskWork(taskId);
    Taro.navigateTo({ url: '/pages/work-timer/index' });
  };

  const handleAddTask = () => {
    Taro.navigateTo({ url: '/pages/task-add/index' });
  };

  const renderCalendar = () => {
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < startDay; i++) {
      cells.push(<View key={`empty-${i}`} className={`${styles.dayCell} ${styles.empty}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = getTasksForDay(day);
      const todayClass = isToday(day) ? ` ${styles.today}` : '';
      const selectedClass = selectedDate?.getDate() === day &&
        selectedDate?.getMonth() === month &&
        selectedDate?.getFullYear() === year ? ` ${styles.selected}` : '';
      const weekendClass = isWeekend(day) ? ` ${styles.weekend}` : '';
      const holidayClass = isHoliday(day) ? ` ${styles.holiday}` : '';

      cells.push(
        <View
          key={day}
          className={`${styles.dayCell}${selectedClass}${weekendClass}${holidayClass}`}
          onClick={() => setSelectedDate(new Date(year, month, day))}
        >
          <View className={styles.dayTop}>
            <Text className={`${styles.dayDate}${todayClass}${holidayClass ? ` ${styles.holiday}` : ''}${isWeekend(day) && !isToday(day) && !isHoliday(day) ? ` ${styles.weekend}` : ''}`}>
              {day}
            </Text>
            {isHoliday(day) && <Text className={styles.holidayTag}>节</Text>}
            {isToday(day) && <Text className={styles.todayBadge}>今日</Text>}
          </View>
          <View className={styles.dayTasks}>
            {dayTasks.slice(0, 3).map((task) => {
              const quadrant = getQuadrantColor(task);
              return (
                <View
                  key={task.id}
                  className={styles.taskTag}
                  style={{ background: quadrant.bg, color: quadrant.text }}
                >
                  {calculateUrgency(task) === 'critical' && '⚠️'}
                  {task.title}
                </View>
              );
            })}
            {dayTasks.length > 3 && (
              <Text className={styles.moreTasks}>+{dayTasks.length - 3}</Text>
            )}
          </View>
        </View>
      );
    }

    return cells;
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>日程</Text>
        <View className={styles.monthNav}>
          <View className={styles.navBtn} onClick={prevMonth}>
            <Text className={styles.navIcon}>◀</Text>
          </View>
          <Text className={styles.monthLabel}>
            {year}年 {MONTH_NAMES[month]}
          </Text>
          <View className={styles.navBtn} onClick={nextMonth}>
            <Text className={styles.navIcon}>▶</Text>
          </View>
        </View>
      </View>

      <View className={styles.calendarCard}>
        <View className={styles.weekDays}>
          {WEEK_DAYS.map((day, index) => (
            <Text
              key={day}
              className={`${styles.weekDay} ${index === 0 || index === 6 ? ` ${styles.weekend}` : ''}`}
            >
              {day}
            </Text>
          ))}
        </View>

        <View className={styles.calendarGrid}>
          {renderCalendar()}
        </View>

        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ background: '#fff' }} />
            <Text className={styles.legendLabel}>工作日</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ background: 'rgba(107, 114, 128, 0.06)' }} />
            <Text className={styles.legendLabel}>周末</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ background: 'rgba(239, 68, 68, 0.06)' }} />
            <Text className={styles.legendLabel}>节假日</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ background: 'rgba(99, 102, 241, 0.2)' }} />
            <Text className={styles.legendLabel}>今日</Text>
          </View>
        </View>
      </View>

      {selectedDate ? (
        <View className={styles.selectedPanel}>
          <View className={styles.selectedHeader}>
            <Text className={styles.selectedDateTitle}>
              {formatSelectedDate(selectedDate)}
              {isHoliday(selectedDate.getDate()) && <Text className={styles.selectedHolidayTag}> 节假日</Text>}
            </Text>
          </View>
          <View className={styles.selectedBody}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionLabel}>当日任务</Text>
              <View className={styles.addBtn} onClick={handleAddTask}>
                <Text className={styles.addBtnIcon}>+</Text>
                <Text className={styles.addBtnText}>添加任务</Text>
              </View>
            </View>

            {selectedDayTasks.length === 0 ? (
              <View className={styles.emptyPanel}>
                <Text className={styles.emptyIcon}>📋</Text>
                <Text className={styles.emptyText}>暂无任务</Text>
              </View>
            ) : (
              <View className={styles.taskList}>
                {selectedDayTasks.map((task) => {
                  const quadrant = getQuadrantColor(task);
                  return (
                    <View
                      key={task.id}
                      className={styles.taskItem}
                      style={{ background: quadrant.bg }}
                    >
                      <View className={styles.taskInfo}>
                        <Text className={styles.taskTitle} style={{ color: quadrant.text }}>
                          {task.title}
                        </Text>
                        <Text className={styles.taskDesc}>
                          {task.description ? task.description.substring(0, 30) + '...' : '无描述'}
                        </Text>
                      </View>
                      <View
                        className={styles.taskStartBtn}
                        style={{ background: quadrant.text }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTask(task.id);
                        }}
                      >
                        <Text className={styles.taskStartBtnText}>开始</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      ) : (
        <View className={styles.selectedPanel}>
          <View className={styles.emptyPanel}>
            <Text className={styles.emptyIcon}>📅</Text>
            <Text className={styles.emptyText}>点击日历中的日期查看详情</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default SchedulePage;