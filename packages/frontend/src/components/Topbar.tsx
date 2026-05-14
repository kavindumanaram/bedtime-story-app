import React, { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { profile, activeChild } = useAuth();

  const initials = (profile?.display_name || 'P').slice(0, 1).toUpperCase();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/library?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'rgba(255,248,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(124,58,237,0.08)',
        boxShadow: '0 2px 16px rgba(124,58,237,0.04)',
      }}
    >
      <div className="flex items-center gap-3 px-4 lg:px-8 py-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#7c3aed] hover:bg-[#f3f0ff] transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search stories, themes…"
              className="w-full pl-10 pr-9 py-2.5 text-sm text-[#0b1220] placeholder:text-[#9CA3AF] rounded-2xl outline-none transition-all"
              style={{
                background: 'rgba(124,58,237,0.05)',
                border: '1.5px solid rgba(124,58,237,0.12)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.background = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.12)'; e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-[#9CA3AF] hover:text-[#374151]" />
              </button>
            )}
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {activeChild && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#374151]"
              style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.1)' }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: activeChild.avatar_color }}>
                {activeChild.name[0].toUpperCase()}
              </span>
              {activeChild.name}
            </div>
          )}
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};
