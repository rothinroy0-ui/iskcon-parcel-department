import React, { useState, useEffect } from 'react';
import { Devotee, InitiationStatus } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, Save, ShieldCheck, AlertCircle } from 'lucide-react';
import { DevoteeAvatar } from '../common/DevoteeAvatar';

interface DevoteeModalProps {
  devotee: Devotee | null; // null for add, object for edit
  isOpen: boolean;
  onClose: () => void;
}

export const DevoteeModal: React.FC<DevoteeModalProps> = ({ devotee, isOpen, onClose }) => {
  const { addDevotee, updateDevotee, departments } = useData();
  const { currentUser, canEditDevotees } = useAuth();

  const isEdit = Boolean(devotee);

  const [formData, setFormData] = useState<Partial<Devotee>>({
    spiritual_name: '',
    legal_name: '',
    initiation_status: 'ASPIRANT',
    diksha_guru: '',
    gender: 'MALE',
    date_of_birth: '1990-01-01',
    marriage_anniversary: '',
    initiation_date: '',
    phone: '',
    whatsapp_number: '',
    email: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    counselor_name: '',
    department_id: departments[0]?.id || '',
    primary_seva: '',
    blood_group: 'B+',
    emergency_contact: '',
    emergency_phone: '',
    notes: '',
    status: 'ACTIVE',
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'spiritual' | 'contact' | 'seva'>('profile');

  useEffect(() => {
    if (devotee) {
      setFormData({ ...devotee });
    } else {
      setFormData({
        spiritual_name: '',
        legal_name: '',
        initiation_status: 'ASPIRANT',
        diksha_guru: '',
        gender: 'MALE',
        date_of_birth: '1990-01-01',
        marriage_anniversary: '',
        initiation_date: '',
        phone: '',
        whatsapp_number: '',
        email: '',
        address: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        counselor_name: '',
        department_id: departments[0]?.id || '',
        primary_seva: '',
        blood_group: 'B+',
        emergency_contact: '',
        emergency_phone: '',
        notes: '',
        status: 'ACTIVE',
      });
    }
  }, [devotee, departments]);

  if (!isOpen) return null;

  // Compute live changes for preview when editing
  const detectedDiffs: { field: string; oldVal: any; newVal: any }[] = [];
  if (isEdit && devotee) {
    (Object.keys(formData) as (keyof Devotee)[]).forEach((key) => {
      if (key !== 'updated_at' && key !== 'updated_by' && formData[key] !== devotee[key]) {
        detectedDiffs.push({
          field: key,
          oldVal: devotee[key] ?? '(empty)',
          newVal: formData[key] ?? '(cleared)',
        });
      }
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.legal_name || !formData.phone) {
      alert('Please fill in required fields: Legal Name and Phone Number.');
      return;
    }

    if (isEdit && devotee) {
      const res = await updateDevotee(devotee.id, formData);
      if (res.success) {
        onClose();
      } else {
        alert(res.message);
      }
    } else {
      // Create new
      const res = await addDevotee(formData as Omit<Devotee, 'id' | 'created_at' | 'updated_at'>);
      if (res.success) {
        onClose();
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif">
                {isEdit ? `Edit Devotee: ${devotee?.spiritual_name || devotee?.legal_name}` : 'Register New Devotee'}
              </h3>
              <p className="text-[11px] text-amber-200">
                Logged by {currentUser.spiritual_name || currentUser.full_name} ({currentUser.role})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === 'profile' ? 'border-amber-600 text-amber-900 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Basic Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spiritual')}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === 'spiritual' ? 'border-amber-600 text-amber-900 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Spiritual & Initiation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === 'contact' ? 'border-amber-600 text-amber-900 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Contact & Address
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seva')}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === 'seva' ? 'border-amber-600 text-amber-900 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Seva & Care
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Tab 1: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Spiritual Name (Initiated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vrindavan Chandra Das"
                    value={formData.spiritual_name || ''}
                    onChange={(e) => setFormData({ ...formData, spiritual_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Legal / Official Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Chandrakant Joshi"
                    value={formData.legal_name || ''}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender || 'MALE'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="MALE">Prabhu (Male)</option>
                    <option value="FEMALE">Mataji (Female)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                  <input
                    type="text"
                    placeholder="e.g. B+, O+, AB+"
                    value={formData.blood_group || ''}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Marriage Anniversary Date (if Grihastha)
                </label>
                <input
                  type="date"
                  value={formData.marriage_anniversary || ''}
                  onChange={(e) => setFormData({ ...formData, marriage_anniversary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
                <p className="text-[11px] text-slate-400 mt-1">Used for automatic pastoral anniversary wishes.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Devotee Photo / Avatar URL
                </label>
                <div className="flex items-center space-x-3">
                  <DevoteeAvatar
                    photoUrl={formData.photo_url}
                    name={formData.spiritual_name || formData.legal_name || 'Devotee'}
                    id={formData.id || 'new'}
                    size="lg"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Google Drive link or direct image URL..."
                      value={formData.photo_url || ''}
                      onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Supports Google Drive links, URLs, or auto-generates a Vaishnava avatar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Spiritual */}
          {activeTab === 'spiritual' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initiation Status</label>
                <select
                  value={formData.initiation_status || 'ASPIRANT'}
                  onChange={(e) => setFormData({ ...formData, initiation_status: e.target.value as InitiationStatus })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="UNINITIATED">Uninitiated</option>
                  <option value="ASPIRANT">Aspirant / Taking Shelter</option>
                  <option value="FIRST_DIKSHA">1st Diksha (Harinama)</option>
                  <option value="SECOND_DIKSHA">2nd Diksha (Brahmana)</option>
                  <option value="SANNYASA">Sannyasa</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Diksha Guru</label>
                  <input
                    type="text"
                    placeholder="e.g. HH Radhanath Swami Maharaj"
                    value={formData.diksha_guru || ''}
                    onChange={(e) => setFormData({ ...formData, diksha_guru: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initiation Date</label>
                  <input
                    type="date"
                    value={formData.initiation_date || ''}
                    onChange={(e) => setFormData({ ...formData, initiation_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Counselor / Spiritual Mentor</label>
                <input
                  type="text"
                  placeholder="e.g. HG Sundar Gopal Das"
                  value={formData.counselor_name || ''}
                  onChange={(e) => setFormData({ ...formData, counselor_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Contact */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98210 11223"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    (Notice: changing this will trigger an automated audit log entry)
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="devotee@iskcon.org"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  placeholder="Flat No, Building, Road, Landmark..."
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode || ''}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Seva */}
          {activeTab === 'seva' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Department</label>
                  <select
                    value={formData.department_id || ''}
                    onChange={(e) => {
                      const dept = departments.find((d) => d.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        department_id: e.target.value,
                        department_name: dept?.name 
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="">General Congregation</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Seva / Service</label>
                  <input
                    type="text"
                    placeholder="e.g. Parcel Dispatch Seva / Pujari"
                    value={formData.primary_seva || ''}
                    onChange={(e) => setFormData({ ...formData, primary_seva: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pastoral & Care Notes</label>
                <textarea
                  rows={3}
                  placeholder="Special pastoral needs, family background, health status, or parcel delivery instructions..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>
          )}

          {/* Live Diff Preview Alert (Showing User -> RLS -> Audit flow) */}
          {detectedDiffs.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Detected {detectedDiffs.length} Change(s) to be Recorded in Audit Trail:</span>
              </div>
              <ul className="text-[11px] text-amber-800 space-y-1 list-disc list-inside">
                {detectedDiffs.map((d, i) => (
                  <li key={i}>
                    Field <strong className="font-mono">{d.field}</strong>: changed from{' '}
                    <span className="line-through text-rose-700">{String(d.oldVal)}</span> to{' '}
                    <span className="font-semibold text-emerald-800">{String(d.newVal)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {isEdit ? 'Changes will be saved and audited immediately' : 'Creates verified record in database'}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Save Changes' : 'Register Devotee'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
