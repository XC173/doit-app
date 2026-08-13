import { useState } from 'react';
import { Plus, Save, Clock } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

const colors = [
  'bg-gradient-to-r from-primary to-purple-500',
  'bg-gradient-to-r from-secondary to-teal-500',
  'bg-gradient-to-r from-amber-500 to-orange-500',
  'bg-gradient-to-r from-rose-500 to-pink-500',
  'bg-gradient-to-r from-emerald-500 to-green-500',
  'bg-gradient-to-r from-cyan-500 to-blue-500',
];

export function Timer() {
  const dailyTimeLogs = useTaskStore((state) => state.dailyTimeLogs);
  const addDailyTimeLog = useTaskStore((state) => state.addDailyTimeLog);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    startTime: '09:00',
    endTime: '10:00',
    activity: '',
  });

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = dailyTimeLogs.find((log) => log.date === today);
  const todayEntries = todayLogs ? [...todayLogs.entries].sort((a, b) => a.startTime.localeCompare(b.startTime)) : [];

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const handleAddEntry = () => {
    if (!newEntry.activity.trim()) return;
    
    const startParts = newEntry.startTime.split(':').map(Number);
    const endParts = newEntry.endTime.split(':').map(Number);
    const duration = (endParts[0] * 60 + endParts[1]) - (startParts[0] * 60 + startParts[1]);
    
    if (duration <= 0) return;
    
    addDailyTimeLog({
      date: today,
      startTime: newEntry.startTime,
      endTime: newEntry.endTime,
      activity: newEntry.activity.trim(),
      duration,
    });
    
    setNewEntry({ startTime: '09:00', endTime: '10:00', activity: '' });
    setShowAddModal(false);
  };

  const handleShowAddModal = () => {
    setShowAddModal(true);
  };

  const totalWorkDuration = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);

  const getPositionAndWidth = (entry: { startTime: string; endTime: string }) => {
    const startParts = entry.startTime.split(':').map(Number);
    const endParts = entry.endTime.split(':').map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    
    const left = (startMinutes / 1440) * 100;
    const width = ((endMinutes - startMinutes) / 1440) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const getTimeLabels = () => {
    const labels = [];
    for (let i = 0; i <= 24; i += 2) {
      labels.push({
        time: `${i.toString().padStart(2, '0')}:00`,
        position: `${(i / 24) * 100}%`,
      });
    }
    return labels;
  };

  

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">事件记录</h1>
          <p className="text-gray-500 mt-1">记录和管理您的时间使用</p>
        </div>
        <button onClick={handleShowAddModal} className="btn-primary flex items-center gap-2">
          <Plus size={20} />添加记录
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">今日工作时长</p>
              <p className="text-2xl font-bold text-gray-800">{formatDuration(totalWorkDuration)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">记录条数</p>
              <p className="text-2xl font-bold text-gray-800">{todayEntries.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">24小时时间线</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            {getTimeLabels().map((label) => (
              <div key={label.time} className="text-center" style={{ width: `${100 / 13}%` }}>
                {label.time}
              </div>
            ))}
          </div>
          
          <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex">
              {Array.from({ length: 24 }).map((_, hourIndex) => (
                <div
                  key={hourIndex}
                  className="flex-1 border-r border-gray-100 last:border-r-0"
                  style={{ width: `${100 / 24}%` }}
                >
                  <div
                    className={`h-16 ${
                      (hourIndex >= 9 && hourIndex < 18) ? 'bg-primary/5' : ''
                    }`}
                  />
                </div>
              ))}
            </div>
            
            {todayEntries.map((entry, index) => {
              const { left, width } = getPositionAndWidth(entry);
              const colorIndex = index % colors.length;
              return (
                <div
                  key={index}
                  className={`absolute rounded-lg flex items-center px-2 text-xs text-white font-medium shadow-md cursor-pointer transition-all hover:scale-y-110 hover:shadow-lg ${colors[colorIndex]}`}
                  style={{
                    left,
                    width: `${Math.max(parseFloat(width), 2)}%`,
                    top: `${(index % 3) * 14 + 2}px`,
                    height: '44px',
                  }}
                  title={`${entry.activity}\n${entry.startTime} - ${entry.endTime}\n${formatDuration(entry.duration)}`}
                >
                  <span className="truncate">{entry.activity}</span>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary/10 border border-primary/30 rounded"></div>
              <span className="text-gray-600">工作时间 (9:00-18:00)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">记录颜色：</span>
              {colors.slice(0, 4).map((color, index) => (
                <div key={index} className={`w-4 h-4 rounded ${color}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="font-semibold text-gray-800 mb-4">今日记录</h3>
        {todayEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">暂无记录</p>
            <button onClick={handleShowAddModal} className="btn-primary mt-4">添加记录</button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayEntries.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${colors[index % colors.length]} rounded-full flex items-center justify-center`}>
                    <Clock size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{entry.activity}</p>
                    <p className="text-sm text-gray-500">
                      {entry.startTime} - {entry.endTime}
                    </p>
                  </div>
                </div>
                <span className="text-primary font-bold">{formatDuration(entry.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">添加时间记录</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <input
                    type="time"
                    value={newEntry.startTime}
                    onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <input
                    type="time"
                    value={newEntry.endTime}
                    onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动内容</label>
                <input
                  type="text"
                  value={newEntry.activity}
                  onChange={(e) => setNewEntry({ ...newEntry, activity: e.target.value })}
                  placeholder="例如：项目开发、会议、学习..."
                  className="input-field"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleAddEntry}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Save size={18} />保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
