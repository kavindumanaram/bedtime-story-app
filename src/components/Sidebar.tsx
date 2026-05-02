import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Library,
  Sparkles,
  CreditCard,
  Settings,
  User,
  X,
  LogOut,
  Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/library', label: 'Story Library', icon: Library },
  { path: '/create', label: 'Create Story', icon: Sparkles },
  { path: '/billing', label: 'Billing', icon: CreditCard },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'Profile', icon: User }
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { profile, session, signOut, children, activeChild, setActiveChild } = useAuth();

  const displayName = profile?.display_name || session?.user?.email?.split("@")[0] || "Parent";
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              <span className="text-primary">Hush</span>Tales
            </h1>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Child switcher */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Storytelling for
            </p>
            {children.length === 0 ? (
              <Link
                to="/profile"
                onClick={onClose}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add a child
              </Link>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {children.slice(0, 3).map((child) => {
                  const isActive = activeChild?.id === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => { setActiveChild(child); onClose(); }}
                      title={child.name}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      style={isActive ? { backgroundColor: child.avatar_color } : undefined}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : child.avatar_color }}
                      >
                        {child.name[0].toUpperCase()}
                      </span>
                      {child.name}
                    </button>
                  );
                })}
                {children.length > 3 && (
                  <Link
                    to="/profile"
                    onClick={onClose}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    +{children.length - 3} more
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={onClose}
                  title="Manage children"
                  className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </Link>
              </div>
            )}
          </div>

          {/* User footer */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                {initials}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{displayName}</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/60 rounded-lg transition-colors w-full"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
