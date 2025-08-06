import React from 'react';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.name}</span>
            </div>
            
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};