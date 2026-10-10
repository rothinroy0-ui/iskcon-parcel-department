import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AuditLog, AuditAction, UserRole } from '../../types';
import { RoleBadge } from '../common/RoleBadge';
import { AuditDiffModal } from '../common/AuditDiffModal';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Clock, 
  HardDrive, 
  User, 
  FileText,
  AlertCircle
} from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs, exportAuditLogsCSV } = useData();
  const { currentUser, canViewAuditLogs, isSuperAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        search === '' ||
        log.record_title?.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.user_name.toLowerCase().includes(search.toLowerCase()) ||
        log.id.toLowerCase().includes(search.toLowerCase());

      const matchAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchRole = roleFilter === 'ALL' || log.user_role === roleFilter;

      return matchSearch && matchAction && matchRole;
    });
  }, [auditLogs, search, actionFilter, roleFilter]);

  if (!canViewAuditLogs) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto mt-12 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Restricted by Row Level Security (RLS)</h3>
        <p className="text-xs text-slate-500 mt-1">
          Your active role (<strong className="text-slate-800">{currentUser.role}</strong>) does not have PostgreSQL SELECT permissions on the <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700">public.audit_logs</code> table.
        </p>
        <p className="text-[11px] text-slate-400 mt-2">
          Switch to <strong className="text-amber-800">ADMIN</strong> or <strong className="text-purple-800">SUPER_ADMIN</strong> in the top navbar to inspect audit trails.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-950 rounded-2xl p-6 text-white shadow-lg shadow-purple-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
              Immutable Governance Trail
            </span>
          </div>
          <h2 className="text-2xl font-black font-serif tracking-tight mt-1">
            Row Level Security & Audit Log Hub
          </h2>
          <p className="text-purple-200 text-xs mt-1 max-w-xl">
            Every creation, modification, deletion, and export across the portal is irrevocably logged with who changed it, what changed, and when.
          </p>
        </div>

        <button
          onClick={exportAuditLogsCSV}
          className="px-4 py-2.5 bg-white text-purple-950 hover:bg-purple-50 rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 shrink-0"
        >
          <Download className="w-4 h-4 text-purple-800" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Explanatory Pipeline Card */}
      <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 text-xs text-purple-900 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-purple-950">Architectural Security Guarantee: </strong>
          In Supabase PostgreSQL, the <code className="bg-purple-200/70 px-1 py-0.5 rounded font-mono text-[11px]">fn_audit_devotees_trigger()</code> trigger runs with <code className="bg-purple-200/70 px-1 py-0.5 rounded font-mono text-[11px]">SECURITY DEFINER</code>. RLS policies disallow <code className="font-mono text-rose-700">UPDATE</code> and <code className="font-mono text-rose-700">DELETE</code> operations on the <code className="font-mono font-bold">audit_logs</code> table by any staff user, guaranteeing complete compliance.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by devotee title, staff name, change details, or event ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden"
        >
          <option value="ALL">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="CARE_LOGGED">CARE_LOGGED</option>
          <option value="EXPORT">EXPORT</option>
          <option value="LOGIN">LOGIN</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden"
        >
          <option value="ALL">All Roles</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          <option value="ADMIN">ADMIN</option>
          <option value="STAFF">STAFF</option>
          <option value="VIEWER">VIEWER</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Event Summary</th>
                <th className="py-3 px-4 text-right">Field Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-slate-700 font-semibold">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.user_name}</div>
                      <div className="mt-0.5">
                        <RoleBadge role={log.user_role} size="sm" showIcon={false} />
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                        log.action === 'CARE_LOGGED' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 truncate max-w-[180px]" title={log.record_title}>
                        {log.record_title}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {log.entity_type}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-600 line-clamp-1 max-w-[320px]">
                        {log.details}
                      </div>
                      {log.ip_address && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          IP: {log.ip_address}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {log.changes && log.changes.length > 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[11px] transition-colors"
                        >
                          Diff ({log.changes.length})
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">View Details</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                    No audit records match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal */}
      <AuditDiffModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};
