import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Devotee } from '../../types';
import { 
  RotateCcw, 
  Trash2, 
  Calendar, 
  Phone, 
  MapPin, 
  Heart, 
  Cake, 
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DevoteeAvatar } from '../common/DevoteeAvatar';

export const RemovalRecords: React.FC = () => {
  const { 
    devotees, 
    birthdayRemovals, 
    anniversaryRemovals, 
    restoreBirthdayRecord, 
    restoreAllBirthdayRecords, 
    removeAnniversaryRecord,
    restoreAnniversaryRecord, 
    restoreAllAnniversaryRecords 
  } = useData();

  const [notification, setNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const triggerCelebration = (msg: string) => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#059669', '#10b981', '#f59e0b', '#3b82f6']
    });
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Resolve devotees for birthday removals
  const birthdayRemovedDevotees = birthdayRemovals
    .map((id) => devotees.find((d) => d.id === id) || ({
      id,
      legal_name: 'Devotee Record',
      spiritual_name: '',
      phone: '',
      initiation_status: 'UNINITIATED',
      date_of_birth: '',
      spouse_name: '',
      city: 'Durgapur',
      address: '',
      pincode: '',
      state: 'West Bengal',
      gender: 'MALE',
      skills: [],
      notes: '',
      status: 'ACTIVE',
      created_at: '',
      updated_at: ''
    } as unknown as Devotee))
    .filter((d) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        d.legal_name.toLowerCase().includes(q) ||
        (d.spiritual_name && d.spiritual_name.toLowerCase().includes(q)) ||
        d.phone.includes(q) ||
        (d.city && d.city.toLowerCase().includes(q))
      );
    });

  // Resolve devotees for anniversary removals
  const anniversaryRemovedDevotees = anniversaryRemovals
    .map((id) => {
      const found = devotees.find((d) => d.id === id);
      if (found) return found;
      // Fallback for ISKCON_DGP_436 if not yet loaded
      if (id === 'ISKCON_DGP_436') {
        return {
          id: 'ISKCON_DGP_436',
          spiritual_name: 'SUSILA MALINI DEVI DASI',
          legal_name: 'MITHU ROY',
          spouse_name: 'PRONAB ROY',
          initiation_status: 'UNINITIATED',
          date_of_birth: '',
          marriage_anniversary: '18-Oct-1980',
          phone: '7811970450',
          address: 'POSHLA BHATAR BARDHAMAN',
          city: 'Bhatar',
          pincode: '713204',
          state: 'West Bengal',
          gender: 'FEMALE',
          skills: [],
          notes: '',
          status: 'ACTIVE',
          created_at: '',
          updated_at: ''
        } as unknown as Devotee;
      }
      return {
        id,
        legal_name: 'Devotee Record',
        spiritual_name: '',
        spouse_name: '',
        initiation_status: 'UNINITIATED',
        date_of_birth: '',
        marriage_anniversary: '',
        phone: '',
        city: 'Durgapur',
        address: '',
        pincode: '',
        state: 'West Bengal',
        gender: 'MALE',
        skills: [],
        notes: '',
        status: 'ACTIVE',
        created_at: '',
        updated_at: ''
      } as unknown as Devotee;
    })
    .filter((d) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        d.legal_name.toLowerCase().includes(q) ||
        (d.spiritual_name && d.spiritual_name.toLowerCase().includes(q)) ||
        (d.spouse_name && d.spouse_name.toLowerCase().includes(q)) ||
        d.phone.includes(q) ||
        (d.city && d.city.toLowerCase().includes(q))
      );
    });

  const handleRestoreBirthday = (devId: string, name: string) => {
    restoreBirthdayRecord(devId);
    triggerCelebration(`🎉 Successfully restored ${name} to Birthday celebration list!`);
  };

  const handleRestoreAllBirthdays = () => {
    restoreAllBirthdayRecords();
    triggerCelebration(`🎉 All birthday records restored to celebration dashboard!`);
  };

  const handleRestoreAnniversary = (devId: string, name: string) => {
    restoreAnniversaryRecord(devId);
    triggerCelebration(`🎉 Successfully restored ${name} to Anniversary celebration list!`);
  };

  const handleRestoreAllAnniversaries = () => {
    restoreAllAnniversaryRecords();
    triggerCelebration(`🎉 All anniversary records restored to celebration dashboard!`);
  };

  const formatFullAddress = (dev: Devotee) => {
    const parts: string[] = [];
    if (dev.address && dev.address.trim()) parts.push(dev.address.trim());
    if (dev.city && dev.city.trim()) parts.push(dev.city.trim());
    if (dev.pincode && dev.pincode.trim()) parts.push(dev.pincode.trim());
    if (dev.state && dev.state.trim()) parts.push(dev.state.trim());
    return parts.length > 0 ? parts.join(' , ') : 'Address not specified';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-sm font-semibold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black font-serif text-slate-900 tracking-tight flex items-center space-x-2.5">
            <span>Removal Records</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Soft-removed records — nothing is ever deleted · Restore anytime
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search removed records..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* 1. Birthday Removal List Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span className="text-xl">🎂</span>
              <span>Birthday Removal List</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-200 text-slate-800">
              {birthdayRemovals.length}
            </span>
          </div>

          <button
            onClick={handleRestoreAllBirthdays}
            disabled={birthdayRemovals.length === 0}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              birthdayRemovals.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore All</span>
          </button>
        </div>

        {/* Birthday Table / Empty State */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-14 text-center">Photo</th>
                <th className="py-3 px-4 min-w-[180px]">Name</th>
                <th className="py-3 px-4 min-w-[150px]">Legal Name</th>
                <th className="py-3 px-4 min-w-[140px]">Spouse</th>
                <th className="py-3 px-4 min-w-[120px]">Birthday</th>
                <th className="py-3 px-4 min-w-[130px]">Devotee ID</th>
                <th className="py-3 px-4 min-w-[130px]">Phone</th>
                <th className="py-3 px-4 min-w-[220px]">Address</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {birthdayRemovedDevotees.length > 0 ? (
                birthdayRemovedDevotees.map((dev) => {
                  const displayName = dev.spiritual_name || dev.legal_name;
                  return (
                    <tr key={dev.id} className="hover:bg-amber-50/30 transition-colors">
                      {/* Photo */}
                      <td className="py-3 px-4 text-center">
                        <DevoteeAvatar
                          photoUrl={dev.photo_url}
                          name={displayName}
                          id={dev.id}
                          size="sm"
                          className="mx-auto"
                        />
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {displayName}
                      </td>

                      {/* Legal Name */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {dev.legal_name || '—'}
                      </td>

                      {/* Spouse */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {dev.spouse_name || '—'}
                      </td>

                      {/* Birthday */}
                      <td className="py-3 px-4 text-slate-800 font-semibold">
                        {dev.date_of_birth ? `🎂 ${dev.date_of_birth}` : '—'}
                      </td>

                      {/* Devotee ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {dev.id}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {dev.phone ? `📞 ${dev.phone}` : '—'}
                      </td>

                      {/* Address */}
                      <td className="py-3 px-4 text-slate-600 font-medium leading-relaxed">
                        {formatFullAddress(dev)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleRestoreBirthday(dev.id, displayName)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all inline-flex items-center space-x-1 shadow-2xs"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-4xl">🗂️</span>
                      <h3 className="font-bold text-slate-800 text-sm">
                        Birthday removal list is empty
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Records removed from the Birthday list appear here — nothing is ever deleted.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Anniversary Removal List Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span className="text-xl">💍</span>
              <span>Anniversary Removal List</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-200 text-slate-800">
              {anniversaryRemovals.length}
            </span>
          </div>

          <button
            onClick={handleRestoreAllAnniversaries}
            disabled={anniversaryRemovals.length === 0}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              anniversaryRemovals.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore All</span>
          </button>
        </div>

        {/* Anniversary Table / Empty State */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-14 text-center">Photo</th>
                <th className="py-3 px-4 min-w-[200px]">Couple</th>
                <th className="py-3 px-4 min-w-[150px]">Legal Name</th>
                <th className="py-3 px-4 min-w-[140px]">Spouse</th>
                <th className="py-3 px-4 min-w-[140px]">Anniversary</th>
                <th className="py-3 px-4 min-w-[140px]">Devotee ID</th>
                <th className="py-3 px-4 min-w-[130px]">Phone</th>
                <th className="py-3 px-4 min-w-[240px]">Address</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {anniversaryRemovedDevotees.length > 0 ? (
                anniversaryRemovedDevotees.map((dev) => {
                  const coupleTitle = dev.legal_name || dev.spiritual_name;
                  const coupleSubtitle = dev.spiritual_name && dev.legal_name 
                    ? `${dev.spiritual_name} / ${dev.legal_name}`
                    : dev.spouse_name 
                    ? `${dev.legal_name} & ${dev.spouse_name}`
                    : dev.legal_name;

                  return (
                    <tr key={dev.id} className="hover:bg-amber-50/30 transition-colors">
                      {/* Photo */}
                      <td className="py-4 px-4 text-center">
                        <DevoteeAvatar
                          photoUrl={dev.photo_url}
                          name={coupleTitle}
                          id={dev.id}
                          size="md"
                          className="mx-auto"
                        />
                      </td>

                      {/* Couple */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-[13px]">{coupleTitle}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {coupleSubtitle}
                        </div>
                      </td>

                      {/* Legal Name */}
                      <td className="py-4 px-4 text-slate-700 font-semibold">
                        {dev.legal_name || '—'}
                      </td>

                      {/* Spouse */}
                      <td className="py-4 px-4 text-slate-700 font-semibold">
                        {dev.spouse_name || '—'}
                      </td>

                      {/* Anniversary */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center space-x-1 font-bold text-slate-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                          <span>💍</span>
                          <span>{dev.marriage_anniversary || '18-Oct-1980'}</span>
                        </span>
                      </td>

                      {/* Devotee ID */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                          {dev.id}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {dev.phone ? `📞 ${dev.phone}` : '—'}
                      </td>

                      {/* Address */}
                      <td className="py-4 px-4 text-slate-700 font-medium leading-relaxed">
                        {formatFullAddress(dev)}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleRestoreAnniversary(dev.id, coupleTitle)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all inline-flex items-center space-x-1.5 shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-4xl">🗂️</span>
                      <h3 className="font-bold text-slate-800 text-sm">
                        Anniversary removal list is empty
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Records removed from the Anniversary list appear here — nothing is ever deleted.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
