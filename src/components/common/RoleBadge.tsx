import React from 'react';
import { UserRole } from '../../types';
import { ShieldCheck, ShieldAlert, UserCheck, Eye } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showIcon = true, size = 'md' }) => {
  const getBadgeStyle = () => {
    const normalized = String(role || 'STAFF').toUpperCase().replace(/\s+/g, '_');
    switch (normalized) {
      case 'SUPER_ADMIN':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
          icon: <ShieldAlert className="w-3.5 h-3.5 mr-1 text-purple-600" />,
          label: 'Super Admin',
          desc: 'Full system & security control',
        };
      case 'ADMIN':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
          icon: <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-600" />,
          label: 'Admin',
          desc: 'Manage devotees & audit logs',
        };
      case 'STAFF':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
          icon: <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />,
          label: 'Staff',
          desc: 'Record & update devotee care',
        };
      case 'VIEWER':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          icon: <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />,
          label: 'Viewer',
          desc: 'Read-only access',
        };
      default:
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />,
          label: String(role || 'Staff'),
          desc: 'Devotee Staff access',
        };
    }
  };

  const style = getBadgeStyle();
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  return (
    <span
      title={style.desc}
      className={`inline-flex items-center font-semibold rounded-full border shadow-xs tracking-wide transition-all ${sizeClasses} ${style.bg}`}
    >
      {showIcon && style.icon}
      <span>{style.label}</span>
    </span>
  );
};
