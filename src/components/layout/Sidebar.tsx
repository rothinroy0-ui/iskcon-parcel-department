import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Cake, 
  Package, 
  ShieldCheck, 
  UserCog, 
  Database,
  Lock,
  ArchiveX
} from 'lucide-react';

export type TabKey = 
  | 'dashboard' 
  | 'devotees' 
  | 'celebrations' 
  | 'parcels' 
  | 'removals'
  | 'audit' 
  | 'users' 
  | 'architecture';

interface SidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  celebrationsCount: number;
  auditCount: number;
  parcelCount?: number;
  removalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  celebrationsCount,
  auditCount,
  parcelCount = 1,
  removalsCount = 1,
}) => {
  const { isSuperAdmin, isAdmin, canViewAuditLogs, canManageUsers } = useAuth();

  const navItems = [
    {
      key: 'dashboard' as TabKey,
      label: 'Live Dashboard',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Real-time overview & metrics',
    },
    {
      key: 'devotees' as TabKey,
      label: 'Devotee Directory (824)',
      icon: Users,
      badge: null,
      desc: 'All congregation records',
    },
    {
      key: 'celebrations' as TabKey,
      label: 'Birthday & Anniversary Wishes',
      icon: Cake,
      badge: celebrationsCount > 0 ? `${celebrationsCount} Today!` : null,
      badgeColor: 'bg-rose-500 text-white',
      desc: 'Wishes & bulk parcel dispatch',
    },
    {
      key: 'parcels' as TabKey,
      label: 'Parcel & Tracking',
      icon: Package,
      badge: parcelCount > 0 ? String(parcelCount) : '1',
      badgeColor: 'bg-amber-500 text-white',
      desc: 'Consignments & logistics hub',
    },
    {
      key: 'removals' as TabKey,
      label: 'Removal Records',
      icon: ArchiveX,
      badge: removalsCount > 0 ? String(removalsCount) : null,
      badgeColor: 'bg-rose-500 text-white',
      desc: 'Soft-removed records — restore anytime',
    },
    {
      key: 'audit' as TabKey,
      label: 'Audit Trail Logs',
      icon: ShieldCheck,
      badge: auditCount > 0 ? String(auditCount) : null,
      badgeColor: 'bg-purple-600 text-white',
      locked: !canViewAuditLogs,
      desc: 'Live RLS change records',
    },
    {
      key: 'users' as TabKey,
      label: 'Staff & Roles',
      icon: UserCog,
      badge: null,
      locked: !canManageUsers,
      desc: 'User accounts & RBAC',
    },
    {
      key: 'architecture' as TabKey,
      label: 'Architecture & Supabase',
      icon: Database,
      badge: 'Flow',
      badgeColor: 'bg-emerald-600 text-white',
      desc: 'Step 1-4 pipeline & SQL',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation list */}
      <div className="p-3 space-y-1 flex-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.key;
          const isLocked = item.locked;

          return (
            <button
              key={item.key}
              onClick={() => {
                if (!isLocked) onSelectTab(item.key);
              }}
              disabled={isLocked}
              title={isLocked ? 'Access restricted by Row Level Security (Admin only)' : item.desc}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30'
                  : isLocked
                  ? 'text-slate-300 cursor-not-allowed opacity-60'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : isLocked ? 'text-slate-300' : 'text-slate-500 group-hover:text-amber-600'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                {item.badge && !isLocked && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-100 bg-amber-50/40 text-[11px] text-amber-900/80">
        <div className="font-bold text-amber-950 flex items-center space-x-1.5">
          <span>Hare Krishna!</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
          Every devotee change triggers an immutable audit log entry.
        </p>
      </div>
    </aside>
  );
};
