import React from 'react';
import { AuditLog } from '../../types';
import { X, ArrowRight, ShieldCheck, Clock, User, HardDrive } from 'lucide-react';
import { RoleBadge } from './RoleBadge';

interface AuditDiffModalProps {
  log: AuditLog | null;
  onClose: () => void;
}

export const AuditDiffModal: React.FC<AuditDiffModalProps> = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Audit Trail Verification</h3>
              <p className="text-xs text-amber-200">Immutable Record ID: {log.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-slate-400" /> Actor
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{log.user_name}</span>
              <div className="mt-1">
                <RoleBadge role={log.user_role} size="sm" />
              </div>
            </div>

            <div>
              <span className="text-slate-500 block flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" /> Timestamp
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-slate-400 text-[11px]">
                {new Date(log.timestamp).toLocaleDateString()}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block">Action Type</span>
              <span className={`inline-block mt-1 font-bold px-2 py-0.5 rounded text-xs ${
                log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                log.action === 'DELETE' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                log.action === 'CARE_LOGGED' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                'bg-slate-100 text-slate-800 border border-slate-300'
              }`}>
                {log.action}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block flex items-center">
                <HardDrive className="w-3.5 h-3.5 mr-1 text-slate-400" /> Target Entity
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block capitalize">{log.entity_type}</span>
              <span className="text-slate-400 text-[11px] truncate block" title={log.record_title}>
                {log.record_title}
              </span>
            </div>
          </div>

          {/* Details summary */}
          <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-lg text-sm text-amber-900">
            <span className="font-semibold text-amber-950">Logged Event: </span>
            {log.details}
          </div>

          {/* Changes Field Diff */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Field-Level Audit Diff (Old Value vs New Value)
            </h4>

            {log.changes && log.changes.length > 0 ? (
              <div className="space-y-3">
                {log.changes.map((change, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                    <div className="bg-slate-100 px-3 py-1.5 font-mono font-semibold text-slate-700 border-b border-slate-200 flex justify-between items-center">
                      <span>Column: <span className="text-amber-800 font-bold">{change.field}</span></span>
                      <span className="text-[10px] text-slate-500 font-sans">Changed</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 p-3 gap-2">
                      <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-200/60">
                        <span className="text-rose-700 font-bold text-[10px] uppercase block mb-1">
                          Previous State (Old Value)
                        </span>
                        <div className="font-mono text-rose-900 break-all whitespace-pre-wrap">
                          {change.old_value !== null && change.old_value !== undefined 
                            ? (typeof change.old_value === 'object' ? JSON.stringify(change.old_value, null, 2) : String(change.old_value))
                            : <span className="italic text-slate-400 font-sans">null (not set)</span>
                          }
                        </div>
                      </div>

                      <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/60">
                        <span className="text-emerald-700 font-bold text-[10px] uppercase block mb-1">
                          Updated State (New Value)
                        </span>
                        <div className="font-mono text-emerald-900 break-all whitespace-pre-wrap">
                          {change.new_value !== null && change.new_value !== undefined 
                            ? (typeof change.new_value === 'object' ? JSON.stringify(change.new_value, null, 2) : String(change.new_value))
                            : <span className="italic text-slate-400 font-sans">null (cleared)</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-500 text-sm">
                No specific field mutations logged (Snapshot / Action level event)
              </div>
            )}
          </div>

          {/* RLS Security Guarantee Note */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              This audit record was written by PostgreSQL database trigger <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">fn_audit_devotees_trigger()</code>. Row Level Security guarantees this entry cannot be altered or purged by staff.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
