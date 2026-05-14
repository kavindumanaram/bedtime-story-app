import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Sparkles,
  CreditCard,
  Settings,
  User,
  X,
  LogOut,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/library', label: 'Library', icon: BookOpen },
  { path: '/create', label: 'Create Story', icon: Sparkles },
  { path: '/billing', label: 'Billing', icon: CreditCard },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'Profile', icon: User },
];


export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { profile, signOut, children, activeChild, setActiveChild } = useAuth();

  const displayName = profile?.display_name || 'Parent';
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: 'linear-gradient(180deg,#FFF8FF 0%,#F6FBFF 60%,#F4F3F9 100%)',
          borderRight: '1px solid rgba(124,58,237,0.08)',
          boxShadow: '4px 0 24px rgba(124,58,237,0.06)',
        }}
      >
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
            <Link to="/" onClick={onClose} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-black"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
                H
              </div>
              <span className="text-xl font-extrabold text-[#0b1220]">
                <span style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hush</span>Tales
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center text-[#6B7280] hover:bg-[#f3f0ff] hover:text-[#7c3aed] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === '/' && (location.pathname === '/home' || location.pathname === '/dashboard'));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-[#374151] hover:bg-[#f3f0ff] hover:text-[#7c3aed]'
                  }`}
                  style={isActive ? { background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' } : undefined}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-[#f3f0ff]'}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#7c3aed]'}`} />
                  </span>
                  <span className="text-sm font-semibold">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                </Link>
              );
            })}
          </nav>

          {/* Child switcher */}
          <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(124,58,237,0.08)' }}>
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">
              Storytelling for
            </p>
            {children.length === 0 ? (
              <Link
                to="/profile"
                onClick={onClose}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#7c3aed] hover:text-[#06b6d4] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add a child
              </Link>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {children.slice(0, 3).map((child) => {
                  const active = activeChild?.id === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => { setActiveChild(child); onClose(); }}
                      title={child.name}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        active ? 'text-white shadow-md' : 'text-[#374151] bg-white border border-[#e5e7eb] hover:border-[#c4b5fd]'
                      }`}
                      style={active ? { background: `linear-gradient(135deg,${child.avatar_color},${child.avatar_color}cc)` } : undefined}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: active ? 'rgba(255,255,255,0.3)' : child.avatar_color }}
                      >
                        {child.name[0].toUpperCase()}
                      </span>
                      {child.name}
                    </button>
                  );
                })}
                {children.length > 3 && (
                  <Link to="/profile" onClick={onClose} className="text-xs text-[#9CA3AF] hover:text-[#7c3aed] transition-colors">
                    +{children.length - 3} more
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={onClose}
                  title="Manage children"
                  className="w-7 h-7 rounded-xl bg-[#f3f0ff] hover:bg-[#ede9fe] flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#7c3aed]" />
                </Link>
              </div>
            )}
          </div>

          {/* User footer */}
          <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(124,58,237,0.08)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0b1220] truncate">{displayName}</p>
                <p className="text-[10px] text-[#9CA3AF]">Parent account</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#6B7280] hover:text-[#ef4444] hover:bg-red-50 rounded-xl transition-all w-full"
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
