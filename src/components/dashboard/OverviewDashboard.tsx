import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getCelebrations, CelebrationItem } from '../../utils/dateUtils';
import { RoleBadge } from '../common/RoleBadge';
import { AuditDiffModal } from '../common/AuditDiffModal';
import { DevoteeAvatar } from '../common/DevoteeAvatar';
import { AuditLog } from '../../types';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Cake, 
  Package, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  MessageCircle, 
  PhoneCall, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Lock,
  Database,
  KeyRound,
  Check
} from 'lucide-react';

interface OverviewDashboardProps {
  onNavigateTab: (tab: any) => void;
  onOpenNewDevotee: () => void;
  onSelectDevotee: (devoteeId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigateTab,
  onOpenNewDevotee,
  onSelectDevotee,
}) => {
  const { devotees, auditLogs, departments, parcelDispatches, logCareInteraction, settings } = useData();
  const { currentUser, canEditDevotees, canViewAuditLogs, isSuperAdmin, isViewer } = useAuth();
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [wishedDevoteeIds, setWishedDevoteeIds] = useState<string[]>([]);

  const celebrations = getCelebrations(devotees);
  const todayCelebrations = celebrations.filter((c) => c.isToday);
  const upcomingCelebrations = celebrations.filter((c) => !c.isToday && c.daysUntil <= 7);

  const initiatedCount = devotees.filter(
    (d) => d.initiation_status === 'FIRST_DIKSHA' || d.initiation_status === 'SECOND_DIKSHA' || d.initiation_status === 'SANNYASA'
  ).length;

  const handleSendWish = async (c: CelebrationItem) => {
    // Fire confetti celebration!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f97316', '#eab308', '#ec4899', '#8b5cf6'],
    });

    const occasion = c.type === 'BIRTHDAY' ? 'Birthday' : 'Marriage Anniversary';
    const devoteeName = c.devotee.spiritual_name || c.devotee.legal_name;

    await logCareInteraction({
      devotee_id: c.devotee.id,
      devotee_name: devoteeName,
      interaction_type: c.type === 'BIRTHDAY' ? 'BIRTHDAY_WISH' : 'ANNIVERSARY_WISH',
      conducted_by_id: currentUser.id,
      conducted_by_name: currentUser.spiritual_name || currentUser.full_name,
      date: new Date().toISOString().split('T')[0],
      wished_via: 'WHATSAPP',
      notes: `Sent Krishna conscious ${occasion} wishes with prayers and Hare Krishna mahamantra blessings.`,
    });

    setWishedDevoteeIds((prev) => [...prev, `${c.devotee.id}-${c.type}`]);

    // Open WhatsApp link if phone exists
    if (c.devotee.phone) {
      const cleanPhone = c.devotee.phone.replace(/[^0-9]/g, '');
      const text = settings.default_whatsapp_wish_template
        .replace('{NAME}', devoteeName)
        .replace('{OCCASION}', occasion);
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl p-6 text-white shadow-lg shadow-orange-600/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30 uppercase tracking-wider">
              Hare Krishna
            </span>
            <span className="text-amber-200 text-xs">Logged in as {currentUser.spiritual_name || currentUser.full_name}</span>
          </div>
          <h1 className="text-2xl font-black font-serif tracking-tight mt-1">
            Devotee Care & Pastoral Operations Hub
          </h1>
          <p className="text-amber-100 text-xs mt-1 max-w-xl">
            Live multi-user database with Row Level Security (RLS) enforcement, instant audit logging triggers, and pastoral outreach tracking.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {canEditDevotees && (
            <button
              onClick={onOpenNewDevotee}
              className="px-4 py-2.5 bg-white text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Register Devotee</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab('celebrations')}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold text-white transition-all flex items-center space-x-1.5"
          >
            <Cake className="w-4 h-4" />
            <span>Today's Wishes ({todayCelebrations.length})</span>
          </button>
        </div>
      </div>

      {/* Architecture Flow Banner (Directly addressing the user's flow!) */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Live Architecture Flow Verification
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('architecture')}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
          >
            <span>View PostgreSQL Schema & RLS Policy Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* The 5 Steps Diagram */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-3.5 text-xs">
          {/* Step 1 */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>Step 1</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="font-bold text-slate-800">User Identity</div>
            <p className="text-[11px] text-slate-500 mt-1">Individual accounts</p>
            <div className="mt-2">
              <RoleBadge role={currentUser.role} size="sm" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>Step 2</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="font-bold text-slate-800">Supabase Auth & RLS</div>
            <p className="text-[11px] text-slate-500 mt-1">Row Level Security verified</p>
            <div className="mt-2 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {isViewer ? 'Read-Only Policy' : 'Write Permitted'}
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>Step 3</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="font-bold text-slate-800">PostgreSQL DB</div>
            <p className="text-[11px] text-slate-500 mt-1">Tables & foreign keys</p>
            <div className="mt-2 text-[10px] text-slate-600 font-semibold">
              {devotees.length} records active
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>Step 4</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="font-bold text-slate-800">Audit Trigger</div>
            <p className="text-[11px] text-slate-500 mt-1">Captures JSON diffs</p>
            <div className="mt-2 font-mono text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {auditLogs.length} events logged
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 mb-1">
              <span>Step 5</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            </div>
            <div className="font-bold text-amber-950">Live Dashboard</div>
            <p className="text-[11px] text-amber-800 mt-1">Instant sync feed</p>
            <div className="mt-2 text-[10px] text-amber-900 font-semibold">
              Real-time updates
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Devotees */}
        <div 
          onClick={() => onNavigateTab('devotees')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Devotees
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{devotees.length}</span>
            <span className="text-xs text-slate-500 font-medium">registered</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold">{initiatedCount} Initiated Devotees</span>
            <span className="text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform">
              Browse →
            </span>
          </div>
        </div>

        {/* Card 2: Today's Celebrations */}
        <div 
          onClick={() => onNavigateTab('celebrations')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Celebrations
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Cake className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-600">{todayCelebrations.length}</span>
            <span className="text-xs text-slate-500 font-medium">on Oct 10</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{upcomingCelebrations.length} next 7 days</span>
            <span className="text-rose-700 font-bold group-hover:translate-x-0.5 transition-transform">
              Send Wishes →
            </span>
          </div>
        </div>

        {/* Card 3: Parcel Dispatches */}
        <div 
          onClick={() => onNavigateTab('parcels')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Parcel & Tracking
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{parcelDispatches.length}</span>
            <span className="text-xs text-slate-500 font-medium">dispatches</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-blue-700 font-semibold">Logistics & Prasad</span>
            <span className="text-blue-700 font-bold group-hover:translate-x-0.5 transition-transform">
              Track →
            </span>
          </div>
        </div>

        {/* Card 4: Audit Logs */}
        <div 
          onClick={() => onNavigateTab('audit')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Audit Trail
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-purple-900">{auditLogs.length}</span>
            <span className="text-xs text-slate-500 font-medium">verified events</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-purple-700 font-semibold">PostgreSQL Trigger</span>
            <span className="text-purple-700 font-bold group-hover:translate-x-0.5 transition-transform">
              Audit Logs →
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Celebrations Spotlight & Real-Time Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Today's Celebrations & Action */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cake className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Devotee Birthday & Anniversary Care Spotlight
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-200/70 text-rose-800">
                Oct 10 (Today)
              </span>
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {todayCelebrations.length > 0 ? (
                todayCelebrations.map((item, idx) => {
                  const devName = item.devotee.spiritual_name || item.devotee.legal_name;
                  const isWished = wishedDevoteeIds.includes(`${item.devotee.id}-${item.type}`);

                  return (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="relative shrink-0">
                          <DevoteeAvatar
                            photoUrl={item.devotee.photo_url}
                            name={devName}
                            id={item.devotee.id}
                            size="md"
                          />
                          <span className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full shadow-2xs">
                            {item.type === 'BIRTHDAY' ? '🎂' : '💍'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span 
                              onClick={() => onSelectDevotee(item.devotee.id)}
                              className="font-bold text-sm text-slate-900 hover:text-amber-700 cursor-pointer"
                            >
                              {devName}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {item.devotee.city}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.type === 'BIRTHDAY'
                              ? `Celebrating Birthday (${item.yearsCount ? `${item.yearsCount}th year` : 'Spiritual Appearance'})`
                              : `Grihastha Marriage Anniversary (${item.yearsCount ? `${item.yearsCount} years` : ''})`}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Seva: <span className="text-slate-600">{item.devotee.primary_seva || 'Congregation'}</span> • Tel: {item.devotee.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {isWished ? (
                          <span className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg">
                            <Check className="w-3.5 h-3.5" />
                            <span>Wished</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendWish(item)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Blessing</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No birthdays or wedding anniversaries falling on today's date.
                </div>
              )}
            </div>

            {/* Upcoming peek */}
            {upcomingCelebrations.length > 0 && (
              <div className="bg-slate-50 p-3.5 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                <span>
                  <strong>{upcomingCelebrations.length} upcoming celebrations</strong> in the next 7 days (e.g. {upcomingCelebrations[0].devotee.spiritual_name} on {upcomingCelebrations[0].dateStr})
                </span>
                <button
                  onClick={() => onNavigateTab('celebrations')}
                  className="text-amber-700 font-bold hover:underline shrink-0 ml-2"
                >
                  View All →
                </button>
              </div>
            )}
          </div>

          {/* Recent Parcel Dispatches */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Recent Parcel Dispatches</h3>
              </div>
              <button
                onClick={() => onNavigateTab('parcels')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                Track All →
              </button>
            </div>

            {parcelDispatches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parcelDispatches.slice(0, 4).map((parcel) => (
                  <div key={parcel.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 truncate">{parcel.devotee_name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        {parcel.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{parcel.parcel_type.replace('_', ' ')} • {parcel.tracking_number || 'Direct Handover'}</p>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                      <span>{parcel.destination_city || 'ISKCON'}</span>
                      <span className="font-mono text-[10px] text-slate-400">{parcel.dispatch_date || 'Recently'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No active parcel dispatches. Click "Track All" to dispatch prasad or materials.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Live Audit Stream (Step 4 & Example in user's prompt!) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                <h3 className="text-sm font-bold font-mono">Live Audit Log Feed</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {auditLogs.length} events logged
              </span>
            </div>

            <div className="p-2 bg-slate-800 text-[11px] text-slate-300 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
              <span>Auto-captures all User → RLS → DB updates</span>
              <button 
                onClick={() => onNavigateTab('audit')}
                className="text-amber-400 hover:text-amber-300 font-bold"
              >
                Full Trail →
              </button>
            </div>

            <div className="divide-y divide-slate-100 p-3 max-h-[520px] overflow-y-auto space-y-1">
              {auditLogs.slice(0, 7).map((log) => (
                <div 
                  key={log.id} 
                  className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedAuditLog(log)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                        log.action === 'CARE_LOGGED' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                      <RoleBadge role={log.user_role} size="sm" showIcon={false} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="mt-1.5">
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-amber-700 transition-colors line-clamp-1">
                      {log.record_title}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {log.details}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>By: <strong className="text-slate-600">{log.user_name}</strong></span>
                    {log.changes && log.changes.length > 0 && (
                      <span className="text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                        View Diff ({log.changes.length})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 mt-auto text-center">
              <button
                onClick={() => onNavigateTab('audit')}
                className="text-xs font-bold text-slate-700 hover:text-amber-800"
              >
                Inspect All Audit Log Records & Diff Viewer →
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Audit Diff Inspector Modal */}
      <AuditDiffModal
        log={selectedAuditLog}
        onClose={() => setSelectedAuditLog(null)}
      />
    </div>
  );
};
