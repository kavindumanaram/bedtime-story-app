import React from 'react';
import { Search, Menu, User } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        {/* Left: Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center/Right: Search bar */}
        <div className="flex-1 max-w-2xl mx-auto lg:mx-0 lg:ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stories..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Right: User menu */}
        <div className="flex items-center gap-4 ml-4">
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <User className="w-5 h-5" />
            <span>Sign In</span>
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-medium text-sm">
            P
          </div>
        </div>
      </div>
    </header>
  );
};
