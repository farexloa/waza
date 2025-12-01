
import React from 'react';
import { Icons } from './Icons';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, activeTab, setActiveTab, isDarkMode }) => {
  // Simplified Menu - Only core functions
  const menuItems = [
    { id: 'dashboard', label: 'Panel principal', icon: Icons.Dashboard },
    { id: 'settings', label: 'Ajustes', icon: Icons.Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 transform transition-transform duration-200 ease-in-out
        flex flex-col h-full border-r
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}
      `}>
        <div className="p-6 flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <Icons.Shield className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className={`text-lg font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>COAR Puno</h1>
            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Familias</p>
          </div>
          <button onClick={toggleSidebar} className="ml-auto lg:hidden text-gray-400">
            <Icons.Close size={20} />
          </button>
        </div>

        <div className="px-4 py-2">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-colors
                  ${activeTab === item.id 
                    ? (isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700 shadow-sm') 
                    : (isDarkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}
                `}
              >
                <item.icon 
                  className={`mr-3 h-5 w-5 ${activeTab === item.id ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') : 'text-gray-400'}`} 
                />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
           {/* Bottom Content could go here */}
        </div>
      </aside>
    </>
  );
};
