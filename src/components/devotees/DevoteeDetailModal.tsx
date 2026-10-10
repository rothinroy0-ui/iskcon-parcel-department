import React from 'react';
import { Devotee } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { DevoteeAvatar } from '../common/DevoteeAvatar';
import { 
  X, 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Calendar, 
  Award, 
  ShieldCheck, 
  Package, 
  HeartHandshake, 
  Clock, 
  Edit3,
  UserCheck
} from 'lucide-react';

interface DevoteeDetailModalProps {
  devotee: Devotee | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (devotee: Devotee) => void;
}

export const DevoteeDetailModal: React.FC<DevoteeDetailModalProps> = ({
  devotee,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { auditLogs, careInteractions, parcelDispatches, settings } = useData();
  const { canEditDevotees } = useAuth();

  if (!isOpen || !devotee) return null;

  // Filter devotee-specific logs and parcels
  const devoteeAuditLogs = auditLogs.filter(
    (l) => l.record_id === devotee.id || l.record_title?.includes(devotee.spiritual_name || devotee.legal_name)
  );

  const devoteeParcels = parcelDispatches.filter((p) => p.devotee_id === devotee.id);
  const devoteeCare = careInteractions.filter((c) => c.devotee_id === devotee.id);

  const devTitle = devotee.spiritual_name || devotee.legal_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-4">
            <DevoteeAvatar
              photoUrl={devotee.photo_url}
              name={devTitle}
              id={devotee.id}
              size="xl"
              className="rounded-2xl ring-2 ring-white/60 shadow-lg"
            />

            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/20 text-white">
                  {devotee.initiation_status.replace('_', ' ')}
                </span>
                {devotee.id.includes('ISKCON_') && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-900/60 text-amber-200">
                    ID: {devotee.id}
                  </span>
                )}
                <span className="text-xs text-amber-200">{devotee.city}, {devotee.state}</span>
              </div>
              <h2 className="text-xl font-bold font-serif mt-1">{devTitle}</h2>
              {devotee.spiritual_name && (
                <p className="text-xs text-amber-100">Legal Name: {devotee.legal_name}</p>
              )}
              {devotee.spouse_name && (
                <p className="text-[11px] text-amber-200 mt-0.5">Spouse: {devotee.spouse_name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Quick Actions Row */}
          <div className="flex flex-wrap gap-2 pt-1 pb-3 border-b border-slate-100">
            {devotee.phone && (
              <a
                href={`tel:${devotee.phone}`}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-slate-600" />
                <span>Call {devotee.phone}</span>
              </a>
            )}

            {devotee.phone && (
              <a
                href={`https://wa.me/${devotee.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hare Krishna ${devTitle}! Please accept our humble obeisances. All glories to Srila Prabhupada! From ISKCON Devotee Care.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send WhatsApp Blessing</span>
              </a>
            )}

            {canEditDevotees && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(devotee);
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ml-auto"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* 2-column info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Devotional Life */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center">
                <Award className="w-3.5 h-3.5 mr-1 text-amber-600" /> Devotional Information
              </h3>
              <div>
                <span className="text-slate-400 block text-[11px]">Diksha Guru:</span>
                <span className="font-semibold text-slate-800">{devotee.diksha_guru || 'None (Sheltered / Aspirant)'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Counselor / Spiritual Mentor:</span>
                <span className="font-semibold text-slate-800">{devotee.counselor_name || 'Not assigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Department & Primary Seva:</span>
                <span className="font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                  {devotee.primary_seva || 'General Congregation Seva'}
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">{devotee.department_name}</span>
              </div>
            </div>

            {/* Dates & Celebrations */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-rose-600" /> Celebrations & Welfare
              </h3>
              <div>
                <span className="text-slate-400 block text-[11px]">Date of Birth:</span>
                <span className="font-semibold text-slate-800">{devotee.date_of_birth}</span>
              </div>
              {devotee.marriage_anniversary && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Marriage Anniversary:</span>
                  <span className="font-semibold text-slate-800">{devotee.marriage_anniversary}</span>
                </div>
              )}
              {devotee.blood_group && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Blood Group:</span>
                  <span className="font-semibold text-slate-800">{devotee.blood_group}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block text-[11px]">Full Address:</span>
                <span className="text-slate-700 block text-[11px] leading-relaxed">
                  {devotee.address}, {devotee.city}, {devotee.state} - {devotee.pincode}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {devotee.notes && (
            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-xs">
              <span className="font-bold text-amber-950 block mb-1">Pastoral Notes:</span>
              <p className="text-amber-900 leading-relaxed">{devotee.notes}</p>
            </div>
          )}

          {/* Parcel Dispatches History */}
          {devoteeParcels.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="font-bold text-xs text-slate-800 flex items-center mb-2">
                <Package className="w-4 h-4 text-blue-600 mr-1.5" />
                Parcel Department Dispatches ({devoteeParcels.length})
              </h3>
              <div className="space-y-2">
                {devoteeParcels.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{p.parcel_type}</span>
                      <span className="text-[11px] text-slate-500 block font-mono">
                        {p.courier_service} • Tracking: {p.tracking_number}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Associated Audit Trail */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <h3 className="font-bold text-xs text-slate-800 flex items-center mb-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 mr-1.5" />
              Audit Log History for this Devotee ({devoteeAuditLogs.length} events)
            </h3>
            {devoteeAuditLogs.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {devoteeAuditLogs.map((log) => (
                  <div key={log.id} className="p-2 bg-white rounded-lg border border-slate-200 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">{log.action}: {log.details}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      By: {log.user_name} ({log.user_role})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">No specific audit logs logged for this record yet.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-400 text-[11px]">
            Created by: {devotee.created_by || 'Staff'} • Updated: {new Date(devotee.updated_at).toLocaleDateString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
