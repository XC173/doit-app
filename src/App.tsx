import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { TaskManagement } from '@/pages/TaskManagement';
import { Timer } from '@/pages/Timer';
import { Analytics } from '@/pages/Analytics';
import { Settings } from '@/pages/Settings';
import { SchedulePage as Schedule } from '@/pages/Schedule';
import { Diagnosis } from '@/pages/Diagnosis';
import { Welcome } from '@/pages/Welcome';
import { WorkModal } from '@/components/WorkModal';
import { TaskReminder } from '@/components/TaskReminder';
import { useTaskStore } from '@/store/taskStore';
import { track, trackPageView } from '@/utils/track';

type PageType = 'dashboard' | 'schedule' | 'tasks' | 'timer' | 'diagnosis' | 'analytics' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [showDiagnosisOnLoad, setShowDiagnosisOnLoad] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const mockData = useTaskStore((state) => state.mockData);

  useEffect(() => {
    mockData();
  }, [mockData]);

  // 埋点：记录页面访问和留存
  useEffect(() => {
    track('app_visit');
    trackPageView(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    const firstVisit = localStorage.getItem('firstVisit');
    const lastDiagnosisDate = localStorage.getItem('lastDiagnosisDate');
    
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    } else if (!firstVisit) {
      localStorage.setItem('firstVisit', 'true');
      setTimeout(() => setShowDiagnosisOnLoad(true), 1500);
    } else {
      const now = new Date();
      const lastDate = lastDiagnosisDate ? new Date(lastDiagnosisDate) : null;
      
      if (lastDate) {
        const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 7) {
          setTimeout(() => setShowDiagnosisOnLoad(true), 1500);
        }
      }
    }
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcome(false);
    localStorage.setItem('firstVisit', 'true');
    setTimeout(() => setShowDiagnosisOnLoad(true), 1500);
  };

  const handleDiagnosisComplete = () => {
    localStorage.setItem('lastDiagnosisDate', new Date().toISOString());
    setShowDiagnosisOnLoad(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'schedule':
        return <Schedule />;
      case 'tasks':
        return <TaskManagement />;
      case 'timer':
        return <Timer />;
      case 'diagnosis':
        return <Diagnosis />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (showWelcome) {
    return <Welcome onGetStarted={handleGetStarted} />;
  }

  if (showDiagnosisOnLoad) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Diagnosis />
        <button
          onClick={handleDiagnosisComplete}
          className="fixed top-4 right-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          跳过诊断
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as PageType)} />
      <main className="ml-64 min-h-screen">
        {renderPage()}
      </main>
      <WorkModal />
      {!showDiagnosisOnLoad && <TaskReminder />}
    </div>
  );
}

export default App;