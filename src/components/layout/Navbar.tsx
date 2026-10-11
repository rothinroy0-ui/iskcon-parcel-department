import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserProfile } from '../../types';
import { RoleBadge } from '../common/RoleBadge';
import { DevoteeAvatar } from '../common/DevoteeAvatar';
import { 
  LayoutDashboard,
  Users, 
  Cake,
  Package,
  ArchiveX,
  ShieldCheck,
  UserCog,
  Database,
  Lock,
  RotateCcw, 
  ChevronDown, 
  Sparkles,
  Server,
  LogOut,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Check
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

interface NavbarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  celebrationsCount: number;
  auditCount: number;
  parcelCount?: number;
  removalsCount?: number;
  onOpenNewDevotee: () => void;
  onNavigateToArchitecture: () => void;
  onOpenSupabaseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab,
  onSelectTab,
  celebrationsCount,
  auditCount,
  parcelCount = 1,
  removalsCount = 1,
  onOpenNewDevotee, 
  onNavigateToArchitecture,
  onOpenSupabaseModal,
}) => {
  const { 
    currentUser, 
    usersList, 
    switchUser, 
    verifyAndSwitchUser,
    canEditDevotees, 
    canViewAuditLogs, 
    canManageUsers, 
    logout 
  } = useAuth();
  const { isLiveSupabase, resetToSampleData } = useData();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Secure User Switch State
  const [switchTargetUser, setSwitchTargetUser] = useState<UserProfile | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [showSwitchPassword, setShowSwitchPassword] = useState(false);
  const [switchError, setSwitchError] = useState('');
  const [switchSuccess, setSwitchSuccess] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);

  // Danger Reset Data Confirmation State
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchTargetUser) return;
    setSwitchError('');
    setSwitchSuccess('');
    setIsSwitching(true);

    try {
      const res = verifyAndSwitchUser(switchTargetUser.id, switchPassword);
      if (res.success) {
        setSwitchSuccess(res.message);
        setTimeout(() => {
          setSwitchTargetUser(null);
          setSwitchPassword('');
          setIsSwitching(false);
        }, 500);
      } else {
        setSwitchError(res.message);
        setIsSwitching(false);
      }
    } catch (err: any) {
      setSwitchError(err.message || 'Verification error.');
      setIsSwitching(false);
    }
  };

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
      label: 'Birthdays & Anniversaries',
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/60 shadow-xs">
      {/* Role Testing Notice Banner (Shown when operating in Staff or non-Super Admin role) */}
      {(currentUser.role !== 'SUPER_ADMIN' || !currentUser.is_owner) && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white px-4 py-2 border-b border-indigo-400/30 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-amber-300 flex items-center space-x-1">
              <span>🎭 Role Testing Mode Active:</span>
            </span>
            <RoleBadge role={currentUser.role} size="sm" />
            <span className="text-slate-300">
              Operating as <strong className="text-white">{currentUser.spiritual_name || currentUser.full_name}</strong> ({currentUser.email})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-indigo-200 hidden md:inline">
              Testing UI & permissions
            </span>
            <button
              type="button"
              onClick={() => switchUser('user-owner')}
              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-lg text-xs shadow-xs transition-all active:scale-95 flex items-center space-x-1 cursor-pointer"
            >
              <span>👑 Return to Super Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Top Bar: Brand, Live Supabase Status, Actions & User */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-serif font-black text-xl tracking-tighter">
            ॥ॐ॥
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold text-slate-900 tracking-tight font-serif">
                ISKCON DEVOTEE CARE
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">
                Parcel Dept
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Multi-User Database & Pastoral Logistics Portal
            </p>
          </div>
        </div>

        {/* Center / Database Status & Pipeline pill */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isLiveSupabase 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
            title="Click to Connect with Live Supabase Database"
          >
            <Server className={`w-3.5 h-3.5 ${isLiveSupabase ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span>{isLiveSupabase ? 'Supabase PostgreSQL: LIVE' : 'Supabase: Connect Data'}</span>
            <span className={`w-2 h-2 rounded-full ${isLiveSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {/* Quick Add Devotee Button (Role-gated) */}
          {canEditDevotees && (
            <button
              onClick={onOpenNewDevotee}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Register Devotee</span>
            </button>
          )}

          {/* Quick Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2.5 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-left"
            >
              <DevoteeAvatar
                photoUrl={currentUser.avatar_url}
                name={currentUser.spiritual_name || currentUser.full_name}
                id={currentUser.id}
                size="xs"
                className="ring-2 ring-amber-400/50"
              />
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.spiritual_name || currentUser.full_name}
                </div>
                <div className="flex items-center space-x-1 mt-0.5">
                  <RoleBadge role={currentUser.role} size="sm" showIcon={false} />
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 bg-amber-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                      <span>Authenticated Account</span>
                    </span>
                    <span className="text-[9px] bg-purple-100 text-purple-900 font-bold px-1.5 py-0.5 rounded border border-purple-200">
                      👑 Super Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5 font-medium">
                    {currentUser.spiritual_name || currentUser.full_name} ({currentUser.email})
                  </p>
                </div>

                <div className="max-h-60 overflow-y-auto py-1">
                  {usersList.map((user) => {
                    const isCurrent = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          if (!isCurrent) {
                            switchUser(user.id);
                            setShowUserDropdown(false);
                          }
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          isCurrent ? 'bg-amber-50/90 ring-1 ring-amber-300/50' : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <DevoteeAvatar
                            photoUrl={user.avatar_url}
                            name={user.spiritual_name || user.full_name}
                            id={user.id}
                            size="xs"
                          />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-800 truncate flex items-center space-x-1">
                              <span>{user.spiritual_name || user.full_name}</span>
                              {(user.is_owner || user.email.toLowerCase() === 'rothinroy0@gmail.com') && (
                                <span className="text-[10px]" title="Permanent System Owner">👑</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                          <RoleBadge role={user.role} size="sm" showIcon={false} />
                          {isCurrent && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {currentUser.role === 'SUPER_ADMIN' ? (
                  <div className="px-3 pt-2 pb-1 border-t border-slate-100 mt-1 flex justify-between items-center text-[11px]">
                    <button
                      onClick={() => {
                        setShowResetConfirm(true);
                        setShowUserDropdown(false);
                      }}
                      className="text-slate-500 hover:text-rose-700 flex items-center space-x-1 transition-colors"
                      title="Reset sample database"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Data</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigateToArchitecture();
                        setShowUserDropdown(false);
                      }}
                      className="text-amber-700 hover:text-amber-800 font-semibold"
                    >
                      Setup Supabase →
                    </button>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 border-t border-slate-100 mt-1 flex items-center justify-between text-[10px] text-slate-500 bg-slate-50/50">
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>RLS Policy Active</span>
                    </span>
                    <span className="font-semibold text-slate-600">Staff Access</span>
                  </div>
                )}

                <div className="px-3 py-2 border-t border-slate-100 mt-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center space-x-1.5 transition-colors border border-rose-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Sign Out icon button */}
          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors hidden sm:flex items-center"
            title="Sign Out of Portal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 2. Integrated Horizontal Menu Bar Sector */}
      <nav className="border-t border-slate-200/70 bg-slate-50/90 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-[1720px] mx-auto flex items-center space-x-1.5 py-1.5 overflow-x-auto no-scrollbar scroll-smooth">
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
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all group ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : isLocked
                    ? 'text-slate-300 cursor-not-allowed opacity-60'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-2xs'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : isLocked ? 'text-slate-300' : 'text-slate-500 group-hover:text-amber-600'}`} />
                <span className="whitespace-nowrap">{item.label}</span>

                {isLocked && <Lock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />}

                {item.badge && !isLocked && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                    isActive ? 'bg-white/25 text-white' : item.badgeColor
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. Secure Switch Account Password Modal */}
      {switchTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-200/80 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                  <KeyRound className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Secure Account Switch</h3>
                  <p className="text-[11px] text-amber-100/90 font-medium">Verify credentials to assume role & test RLS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSwitchTargetUser(null); setSwitchError(''); }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmSwitch} className="p-5 space-y-4">
              {/* Target User Card */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DevoteeAvatar
                    photoUrl={switchTargetUser.avatar_url}
                    name={switchTargetUser.spiritual_name || switchTargetUser.full_name}
                    id={switchTargetUser.id}
                    size="sm"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                      <span>{switchTargetUser.spiritual_name || switchTargetUser.full_name}</span>
                      {(switchTargetUser.is_owner || switchTargetUser.email.toLowerCase() === 'rothinroy0@gmail.com') && (
                        <span className="text-xs" title="Permanent System Owner">👑</span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">{switchTargetUser.email}</p>
                  </div>
                </div>
                <RoleBadge role={switchTargetUser.role} size="sm" />
              </div>

              {/* Error / Success Feedback */}
              {switchError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{switchError}</p>
                </div>
              )}

              {switchSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="font-medium leading-relaxed">{switchSuccess}</p>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Account Password *
                </label>
                <div className="relative">
                  <input
                    type={showSwitchPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={switchPassword}
                    onChange={(e) => setSwitchPassword(e.target.value)}
                    placeholder="Enter manual password"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-3 pr-10 py-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSwitchPassword(!showSwitchPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showSwitchPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Manual password protected</span>
                  {switchTargetUser.email.toLowerCase() === 'rothinroy0@gmail.com' ? (
                    <span className="text-amber-700 font-medium">Recovery: Rothin@108 / HareKrishna@108</span>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center space-x-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setSwitchTargetUser(null); setSwitchError(''); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSwitching}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isSwitching ? 'Verifying...' : 'Authenticate & Switch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Danger Reset Database Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-rose-600 px-5 py-4 text-white flex items-center space-x-2.5">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Reset to Default Data?</h3>
                <p className="text-[11px] text-rose-100">Super Admin action</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                This will reset all local devotee modifications, care logs, and parcels back to template sample records.
              </p>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetToSampleData();
                    setShowResetConfirm(false);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all"
                >
                  Yes, Reset Everything
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
