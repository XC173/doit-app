import { useState } from 'react';
import { X, Upload, FileText, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

interface ImportTasksModalProps {
  onClose: () => void;
}

interface ParsedTask {
  title: string;
  description: string;
  importance: 'important' | 'not-important';
  difficulty: 'easy' | 'medium' | 'hard';
}

export function ImportTasksModal({ onClose }: ImportTasksModalProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const addTask = useTaskStore((state) => state.addTask);

  const parseTextToTasks = (text: string): ParsedTask[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const tasks: ParsedTask[] = [];
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      let importance: 'important' | 'not-important' = 'important';
      let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
      let title = trimmed;
      let description = '';
      
      if (trimmed.includes('[重要]')) {
        importance = 'important';
        title = trimmed.replace('[重要]', '').trim();
      } else if (trimmed.includes('[不重要]')) {
        importance = 'not-important';
        title = trimmed.replace('[不重要]', '').trim();
      }
      
      if (trimmed.includes('[困难]') || trimmed.includes('[难]')) {
        difficulty = 'hard';
        title = title.replace('[困难]', '').replace('[难]', '').trim();
      } else if (trimmed.includes('[简单]') || trimmed.includes('[易]')) {
        difficulty = 'easy';
        title = title.replace('[简单]', '').replace('[易]', '').trim();
      } else if (trimmed.includes('[中等]')) {
        difficulty = 'medium';
        title = title.replace('[中等]', '').trim();
      }
      
      const colonIndex = title.indexOf('：');
      if (colonIndex > 0) {
        description = title.substring(colonIndex + 1).trim();
        title = title.substring(0, colonIndex).trim();
      } else {
        const englishColonIndex = title.indexOf(':');
        if (englishColonIndex > 0) {
          description = title.substring(englishColonIndex + 1).trim();
          title = title.substring(0, englishColonIndex).trim();
        }
      }
      
      if (title.length > 0) {
        tasks.push({ title, description, importance, difficulty });
      }
    });
    
    return tasks;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/plain') {
      setFile(selectedFile);
    }
  };

  const analyzeText = async () => {
    let text = '';
    
    if (activeTab === 'file' && file) {
      try {
        text = await file.text();
      } catch {
        setImportStatus('error');
        setStatusMessage('读取文件失败');
        return;
      }
    } else if (activeTab === 'text') {
      text = textInput;
    }
    
    if (!text.trim()) {
      setImportStatus('error');
      setStatusMessage('请输入内容');
      return;
    }
    
    setIsAnalyzing(true);
    setImportStatus('idle');
    
    setTimeout(() => {
      const tasks = parseTextToTasks(text);
      setParsedTasks(tasks);
      setIsAnalyzing(false);
      
      if (tasks.length === 0) {
        setImportStatus('error');
        setStatusMessage('未识别到任务');
      }
    }, 800);
  };

  const handleImport = () => {
    if (parsedTasks.length === 0) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    parsedTasks.forEach((task) => {
      addTask({
        title: task.title,
        description: task.description,
        importance: task.importance,
        difficulty: task.difficulty,
        startTime: today + 'T09:00:00',
        deadline: today + 'T23:59:00',
        status: 'pending',
        subtasks: [],
      });
    });
    
    setImportStatus('success');
    setStatusMessage(`成功导入 ${parsedTasks.length} 个任务`);
  };

  const updateTaskField = (index: number, field: keyof ParsedTask, value: string) => {
    const updated = [...parsedTasks];
    updated[index] = { ...updated[index], [field]: value };
    setParsedTasks(updated);
  };

  const removeTask = (index: number) => {
    const updated = parsedTasks.filter((_, i) => i !== index);
    setParsedTasks(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">导入任务</h2>
              <p className="text-sm text-gray-500">通过文件或文字批量导入任务</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setActiveTab('file');
                setParsedTasks([]);
                setImportStatus('idle');
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'file'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText size={18} />
              TXT文件导入
            </button>
            <button
              onClick={() => {
                setActiveTab('text');
                setParsedTasks([]);
                setImportStatus('idle');
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'text'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles size={18} />
              文字输入
            </button>
          </div>

          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload size={24} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">点击或拖拽文件到此处</p>
                    <p className="text-sm text-gray-500 mt-1">支持 .txt 格式文件</p>
                  </div>
                </label>
                {file && (
                  <p className="text-sm text-green-600 mt-4">已选择: {file.name}</p>
                )}
              </div>
              
              <div className="card bg-blue-50 border-blue-100">
                <p className="text-sm text-blue-600">
                  <strong>格式说明:</strong> 每行一个任务，支持标记 [重要]、[不重要]、[困难]、[简单]、[中等]，
                  使用冒号分隔标题和描述，例如："[重要][困难]完成项目报告：收集资料并撰写"
                </p>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="输入任务列表，每行一个任务...

示例:
[重要][困难]完成项目报告：收集资料并撰写
[重要]学习React新特性
[简单]回复邮件：回复客户咨询
整理桌面文件"
                className="input-field resize-none h-48"
              />
              
              <div className="card bg-blue-50 border-blue-100">
                <p className="text-sm text-blue-600">
                  <strong>格式说明:</strong> 每行一个任务，支持标记 [重要]、[不重要]、[困难]、[简单]、[中等]，
                  使用冒号分隔标题和描述，例如："[重要][困难]完成项目报告：收集资料并撰写"
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={analyzeText}
              disabled={isAnalyzing || (activeTab === 'file' && !file) || (activeTab === 'text' && !textInput.trim())}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} className={isAnalyzing ? 'animate-spin' : ''} />
              {isAnalyzing ? '分析中...' : '智能识别任务'}
            </button>
          </div>

          {parsedTasks.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">识别到的任务 ({parsedTasks.length})</h3>
                <button
                  onClick={handleImport}
                  className="btn-primary flex items-center gap-2"
                >
                  <Check size={16} />
                  导入全部
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {parsedTasks.map((task, index) => (
                  <div key={index} className="card p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTaskField(index, 'title', e.target.value)}
                          className="input-field text-sm p-2"
                          placeholder="任务标题"
                        />
                        <textarea
                          value={task.description}
                          onChange={(e) => updateTaskField(index, 'description', e.target.value)}
                          className="input-field text-sm p-2 resize-none h-16"
                          placeholder="任务描述（可选）"
                        />
                        <div className="flex gap-3">
                          <select
                            value={task.importance}
                            onChange={(e) => updateTaskField(index, 'importance', e.target.value)}
                            className="input-field text-sm flex-1"
                          >
                            <option value="important">重要</option>
                            <option value="not-important">不重要</option>
                          </select>
                          <select
                            value={task.difficulty}
                            onChange={(e) => updateTaskField(index, 'difficulty', e.target.value)}
                            className="input-field text-sm flex-1"
                          >
                            <option value="easy">简单</option>
                            <option value="medium">中等</option>
                            <option value="hard">困难</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => removeTask(index)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importStatus === 'success' && (
            <div className="mt-6 card bg-green-50 border-green-200 flex items-center gap-3 p-4">
              <Check size={20} className="text-green-600" />
              <span className="text-green-700">{statusMessage}</span>
            </div>
          )}

          {importStatus === 'error' && (
            <div className="mt-6 card bg-red-50 border-red-200 flex items-center gap-3 p-4">
              <AlertCircle size={20} className="text-red-600" />
              <span className="text-red-700">{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
