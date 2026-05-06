import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'new' | 'popular' | 'downloaded' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    new: 'bg-blue-100 text-blue-700',
    popular: 'bg-primary/10 text-primary',
    downloaded: 'bg-purple-100 text-purple-700',
    default: 'bg-gray-100 text-gray-700'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
