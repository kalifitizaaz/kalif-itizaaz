
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'today' | 'history' | 'insights' | 'settings';
  setActiveTab: (tab: 'today' | 'history' | 'insights' | 'settings') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0c] text-gray-200">
      <nav className="border-b border-gray-800 px-8 py-4 flex justify-between items-center bg-[#0c0c0c]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="text-xl font-light tracking-widest text-white">MIRROR</div>
        <div className="flex space-x-8 text-sm uppercase tracking-widest font-medium">
          <button 
            onClick={() => setActiveTab('today')}
            className={`${activeTab === 'today' ? 'text-white' : 'text-gray-500'} hover:text-white transition-colors`}
          >
            Today
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`${activeTab === 'history' ? 'text-white' : 'text-gray-500'} hover:text-white transition-colors`}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab('insights')}
            className={`${activeTab === 'insights' ? 'text-white' : 'text-gray-500'} hover:text-white transition-colors`}
          >
            Insights
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`${activeTab === 'settings' ? 'text-white' : 'text-gray-500'} hover:text-white transition-colors`}
          >
            Settings
          </button>
        </div>
      </nav>
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
};
