import React, { useState } from 'react';
import { Home, BarChart3, Upload, Settings, HelpCircle, Zap, Users, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Nova Conta', icon: Upload },
    { id: 'history', label: 'Histórico', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'help', label: 'Ajuda', icon: HelpCircle },
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'bills', label: 'Contas', icon: Upload },
    { id: 'feedback', label: 'Feedbacks', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <div className={`bg-white shadow-lg h-full flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">EnergyReader</h1>
                <p className="text-xs text-gray-500">Leitura Inteligente</p>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>Versão 2.0.0</p>
            <p className="mt-1">© 2024 EnergyReader</p>
          </div>
        </div>
      )}
    </div>
  );
};