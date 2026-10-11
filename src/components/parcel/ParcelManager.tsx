import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ParcelDispatch } from '../../types';
import confetti from 'canvas-confetti';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Cake, 
  Heart, 
  AlertTriangle, 
  Calendar, 
  Search, 
  Trash2, 
  Printer, 
  Plus, 
  X, 
  Lock, 
  ExternalLink,
  ChevronDown,
  RotateCcw,
  MapPin,
  Phone
} from 'lucide-react';
import { DevoteeAvatar } from '../common/DevoteeAvatar';
import { DatePickerWithOptions, DateOptionEvent } from '../common/DatePickerWithOptions';

export const ParcelManager: React.FC = () => {
  const { 
    parcelDispatches, 
    addParcelDispatch, 
    updateParcelStatus, 
    deleteParcelDispatch, 
    deleteMultipleParcelDispatches,
    updateParcelDispatch,
    devotees 
  } = useData();
  const { currentUser } = useAuth();

  // Filters State
  const [deliveryModeFilter, setDeliveryModeFilter] = useState<string>('ALL');
  const [dateCreatedFilter, setDateCreatedFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [purposeFilter, setPurposeFilter] = useState<string>('ALL');

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Add Consignment Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newLegalName, setNewLegalName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPurpose, setNewPurpose] = useState<'ANNIVERSARY' | 'BIRTHDAY' | 'FESTIVAL_PRASAD' | 'GENERAL'>('ANNIVERSARY');
  const [newMode, setNewMode] = useState('Self Mode');
  const [newCity, setNewCity] = useState('Durgapur Region');
  const [newTracking, setNewTracking] = useState('SELF_MODE');
  const [newNotes, setNewNotes] = useState('Temple pickup — tracking locked');

  // Detect Duplicates (same devotee name receiving multiple consignments in the same month)
  const duplicateIdSet = useMemo(() => {
    const counts: Record<string, string[]> = {};
    parcelDispatches.forEach((p) => {
      const monthKey = p.dispatch_date ? p.dispatch_date.slice(0, 7) : '2026-10';
      const key = `${p.devotee_name.toLowerCase().trim()}_${monthKey}`;
      if (!counts[key]) counts[key] = [];
      counts[key].push(p.id);
    });

    const dupes = new Set<string>();
    Object.values(counts).forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach((id) => dupes.add(id));
      }
    });
    return dupes;
  }, [parcelDispatches]);

  // Event dates for parcel date picker
  const parcelEventDates = useMemo<DateOptionEvent[]>(() => {
    const counts: Record<string, { day: number; month: number; count: number }> = {};
    parcelDispatches.forEach((p) => {
      if (p.dispatch_date) {
        const parts = p.dispatch_date.split('-').map(Number);
        if (parts.length === 3) {
          const m = parts[1];
          const d = parts[2];
          const key = `${m}-${d}`;
          if (!counts[key]) counts[key] = { day: d, month: m, count: 0 };
          counts[key].count += 1;
        }
      }
    });

    return Object.values(counts).map((c) => ({
      day: c.day,
      month: c.month,
      year: 2026,
      formattedDate: `${String(c.day).padStart(2, '0')}-${String(c.month).padStart(2, '0')}-2026`,
      label: `${c.day} Oct (${c.count} parcels)`,
      count: c.count,
      type: 'parcel',
    }));
  }, [parcelDispatches]);

  // Filtered Consignments
  const filteredConsignments = useMemo(() => {
    return parcelDispatches.filter((p) => {
      // 1. Delivery Mode
      if (deliveryModeFilter !== 'ALL') {
        const pMode = (p.courier_service || '').toLowerCase();
        const fMode = deliveryModeFilter.toLowerCase();
        if (!pMode.includes(fMode)) return false;
      }

      // 2. Date Created (e.g. "dd-mm-yyyy" or "yyyy-mm-dd")
      if (dateCreatedFilter && dateCreatedFilter.trim()) {
        const clean = dateCreatedFilter.trim().toLowerCase();
        const pDate = (p.dispatch_date || '').toLowerCase();
        let targetDay = 0;
        let targetMonth = 0;
        const dmyMatch = clean.match(/^(\d{1,2})-(\d{1,2})/);
        if (dmyMatch) {
          targetDay = parseInt(dmyMatch[1], 10);
          targetMonth = parseInt(dmyMatch[2], 10);
        }
        if (targetDay > 0 && targetMonth > 0) {
          const expectedIso = `2026-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
          const expectedSlash = `${String(targetDay).padStart(2, '0')}-${String(targetMonth).padStart(2, '0')}`;
          if (!pDate.includes(expectedIso) && !pDate.includes(expectedSlash)) return false;
        } else {
          if (!pDate.includes(clean)) return false;
        }
      }

      // 3. Search Query (Name, Phone, Tracking ID, City)
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const m1 = (p.devotee_name || '').toLowerCase().includes(q);
        const m2 = (p.legal_name || '').toLowerCase().includes(q);
        const m3 = (p.phone || '').includes(q);
        const m4 = (p.tracking_number || '').toLowerCase().includes(q);
        const m5 = (p.destination_city || '').toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4 && !m5) return false;
      }

      // 4. Purpose
      if (purposeFilter !== 'ALL') {
        const pPurpose = (p.purpose || '').toUpperCase();
        if (pPurpose !== purposeFilter.toUpperCase()) return false;
      }

      return true;
    });
  }, [parcelDispatches, deliveryModeFilter, dateCreatedFilter, searchQuery, purposeFilter]);

  // Top KPI Counters
  const totalConsignments = parcelDispatches.length;
  const outForDeliveryCount = parcelDispatches.filter(
    (p) => p.status === 'IN_TRANSIT' || p.status === 'DISPATCHED'
  ).length;
  const deliveredCount = parcelDispatches.filter((p) => p.status === 'DELIVERED').length;
  const birthdayConsignmentsCount = parcelDispatches.filter((p) => p.purpose === 'BIRTHDAY').length;
  const anniversaryConsignmentsCount = parcelDispatches.filter((p) => p.purpose === 'ANNIVERSARY').length;
  const duplicatesCount = duplicateIdSet.size;

  // Selection handlers
  const isAllSelected = 
    filteredConsignments.length > 0 && 
    filteredConsignments.every((p) => selectedIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const visible = new Set(filteredConsignments.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !visible.has(id)));
    } else {
      const visible = filteredConsignments.map((p) => p.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...visible])));
    }
  };

  const handleToggleRowSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Delete Selected
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected consignment(s)?`)) {
      await deleteMultipleParcelDispatches(selectedIds);
      setSelectedIds([]);
    }
  };

  // Delete Single
  const handleDeleteSingle = async (id: string, name: string) => {
    if (window.confirm(`Delete consignment for ${name}?`)) {
      await deleteParcelDispatch(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Toggle delivery status
  const handleToggleStatus = async (item: ParcelDispatch) => {
    const nextStatus: ParcelDispatch['status'] = 
      item.status === 'DELIVERED' ? 'DISPATCHED' :
      item.status === 'DISPATCHED' ? 'IN_TRANSIT' :
      'DELIVERED';

    await updateParcelStatus(item.id, nextStatus);
  };

  // Clear filters
  const handleClearFilters = () => {
    setDeliveryModeFilter('ALL');
    setDateCreatedFilter('');
    setSearchQuery('');
    setPurposeFilter('ALL');
  };

  // Submit new manual consignment
  const handleCreateConsignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientName) {
      alert('Please fill recipient devotee name.');
      return;
    }

    const trackNo = newMode === 'Self Mode' ? 'SELF_MODE' : (newTracking || `DEL-ISK-${Math.floor(100000 + Math.random() * 900000)}`);

    await addParcelDispatch({
      devotee_id: `dev-${Date.now()}`,
      devotee_name: newRecipientName,
      legal_name: newLegalName || newRecipientName,
      phone: newPhone || '',
      purpose: newPurpose,
      parcel_type: 'PRASADAM',
      tracking_number: trackNo,
      courier_service: newMode,
      dispatch_date: new Date().toISOString().split('T')[0],
      status: 'IN_TRANSIT',
      destination_city: newCity,
      dispatched_by: currentUser.spiritual_name || currentUser.full_name,
      pre_calling: newMode === 'Self Mode' ? '🏠 Self Mode — editable now' : 'Pending Call',
      post_calling: newMode === 'Self Mode' ? '🔒' : 'Pending Confirmation',
      notes: newNotes,
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });

    setIsAddModalOpen(false);
    setNewRecipientName('');
    setNewLegalName('');
    setNewPhone('');
  };

  // Export Report to PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up was blocked. Please allow pop-ups to export PDF report.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ISKCON Parcel & Tracking Consignment Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #ea580c; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; color: #c2410c; margin: 0; }
            .sub { font-size: 12px; color: #64748b; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
            th { background: #fff7ed; color: #9a3412; font-weight: bold; border: 1px solid #fed7aa; padding: 8px 6px; text-align: left; }
            td { border: 1px solid #e2e8f0; padding: 8px 6px; vertical-align: top; }
            .badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 4px; background: #ffedd5; color: #9a3412; }
            @media print { button { display: none; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">SRI SRI RADHA MADAN MOHAN MANDIR, DURGAPUR</h1>
            <h2 style="font-size: 14px; margin: 4px 0; color: #475569;">PARCEL DEPARTMENT & CONSIGNMENT TRACKING REPORT</h2>
            <div class="sub">Generated on ${new Date().toLocaleDateString()} • Total Consignments: ${filteredConsignments.length}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 35px;">S.No.</th>
                <th>Recipient Devotee</th>
                <th>Purpose</th>
                <th>Tracking / Mode</th>
                <th>Pre Calling</th>
                <th>Post Calling</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredConsignments
                .map(
                  (p, idx) => `
                <tr>
                  <td style="text-align: center; font-weight: bold;">${String(idx + 1).padStart(2, '0')}</td>
                  <td><strong>${p.devotee_name}</strong><br/><span style="color:#64748b;">${p.legal_name || ''} • ${p.phone || ''} (${p.destination_city || ''})</span></td>
                  <td><span class="badge">${p.purpose === 'ANNIVERSARY' ? '💍 Anniversary' : p.purpose === 'BIRTHDAY' ? '🎂 Birthday' : 'Maha Prasadam'}</span></td>
                  <td>${p.courier_service === 'Self Mode' ? '🏠 Self Mode (Temple pickup)' : `${p.courier_service} - #${p.tracking_number}`}</td>
                  <td>${p.pre_calling || '—'}</td>
                  <td>${p.post_calling || '—'}</td>
                  <td>${p.status === 'DELIVERED' ? '🟢 Delivered' : p.status === 'IN_TRANSIT' ? '🟡 Out for Delivery' : '🔴 Not Delivered'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-5 pb-16 font-sans">
      
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">📦</span>
            <h1 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
              Parcel & Tracking
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
            <span className="font-semibold text-amber-700">Logistics Hub:</span>
            <span>Sri Sri Radha Madan Mohan Mandir, Durgapur</span>
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Consignment</span>
        </button>
      </div>

      {/* 2. Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Card 1: Total Consignments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>📦</span>
            <span>Total Consignments</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {totalConsignments}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Created Parcels
          </div>
        </div>

        {/* Card 2: Out for Delivery */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>🚚</span>
            <span>Out for Delivery</span>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600">
            {outForDeliveryCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Packed & En Route
          </div>
        </div>

        {/* Card 3: Delivered */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>✅</span>
            <span>Delivered</span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {deliveredCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Received with Blessings
          </div>
        </div>

        {/* Card 4: Birthday 🎂 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>🎂</span>
            <span>Birthday 🎂</span>
          </div>
          <div className="mt-2 text-2xl font-black text-pink-600">
            {birthdayConsignmentsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Birthday Consignments
          </div>
        </div>

        {/* Card 5: Anniversary 💍 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>💍</span>
            <span>Anniversary 💍</span>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-600">
            {anniversaryConsignmentsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Anniversary Consignments
          </div>
        </div>

        {/* Card 6: Duplicates ⚠️ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>⚠️</span>
            <span>Duplicates ⚠️</span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-500">
            {duplicatesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Same Month Duplicates
          </div>
        </div>

      </div>

      {/* 3. Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Mode of Delivery */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Mode of Delivery:
            </label>
            <select
              value={deliveryModeFilter}
              onChange={(e) => setDeliveryModeFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Modes</option>
              <option value="Self Mode">Self Mode</option>
              <option value="Delhivery Courier">Delhivery Courier</option>
              <option value="Speed Post">Speed Post</option>
              <option value="DTDC Courier">DTDC Courier</option>
              <option value="By Hand">By Hand / Temple Delivery</option>
            </select>
          </div>

          {/* Date Created */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              📅 Date Created:
            </label>
            <DatePickerWithOptions
              value={dateCreatedFilter}
              onChange={(val) => setDateCreatedFilter(val)}
              eventDates={parcelEventDates}
              placeholder="All Dates / Pick..."
            />
          </div>

          {/* Consignment Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Consignment Search:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, Phone, Tracking ID, City..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Purpose:
            </label>
            <select
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Purposes</option>
              <option value="BIRTHDAY">Birthday 🎂</option>
              <option value="ANNIVERSARY">Anniversary 💍</option>
              <option value="FESTIVAL_PRASAD">Festival Prasad</option>
              <option value="GENERAL">General Seva</option>
            </select>
          </div>

        </div>

        {/* Clear Filters */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleClearFilters}
            className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center space-x-1 hover:underline cursor-pointer"
          >
            <span>🧹</span>
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* 4. Action Bar (Delete Selected & Export PDF) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              selectedIds.length > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>

          {selectedIds.length > 0 && (
            <span className="text-xs text-slate-500 font-medium ml-1">
              ({selectedIds.length} chosen)
            </span>
          )}
        </div>

        <button
          onClick={handleExportPDF}
          className="bg-rose-700 hover:bg-rose-800 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Export Report (PDF)</span>
        </button>
      </div>

      {/* 5. Consignments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-12 text-center">S.No.</th>
                <th className="py-3 px-4 min-w-[220px]">Recipient</th>
                <th className="py-3 px-4 min-w-[130px]">Purpose</th>
                <th className="py-3 px-4 min-w-[200px]">Tracking No.</th>
                <th className="py-3 px-4 min-w-[170px]">Pre Calling</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Post Calling</th>
                <th className="py-3 px-4 text-center min-w-[180px]">Status / Duplicate Warning</th>
                <th className="py-3 px-4 text-right min-w-[90px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsignments.length > 0 ? (
                filteredConsignments.map((item, idx) => {
                  const isChecked = selectedIds.includes(item.id);
                  const isDuplicate = duplicateIdSet.has(item.id);
                  const isSelfMode = item.courier_service === 'Self Mode' || item.tracking_number === 'SELF_MODE';

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-amber-50/30 transition-colors ${
                        isChecked ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRowSelect(item.id)}
                          className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>

                      {/* S.No. */}
                      <td className="py-3.5 px-3 text-center font-bold text-slate-500">
                        {String(idx + 1).padStart(2, '0')}
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <DevoteeAvatar
                            photoUrl={devotees.find((d) => d.id === item.devotee_id)?.photo_url}
                            name={item.devotee_name}
                            id={item.devotee_id}
                            size="md"
                          />
                          <div>
                            <div className="font-black text-xs text-slate-900 tracking-tight">
                              {item.devotee_name}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.legal_name || item.devotee_name} {item.phone ? `• ${item.phone}` : ''}
                            </div>
                            {item.destination_city && (
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{item.destination_city}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="py-3.5 px-4">
                        {item.purpose === 'ANNIVERSARY' ? (
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-100 text-purple-800">
                            <span>💍</span>
                            <span>Anniversary</span>
                          </div>
                        ) : item.purpose === 'BIRTHDAY' ? (
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800">
                            <span>🎂</span>
                            <span>Birthday</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800">
                            <span>🎁</span>
                            <span>{item.parcel_type.replace('_', ' ')}</span>
                          </div>
                        )}
                      </td>

                      {/* Tracking No. */}
                      <td className="py-3.5 px-4">
                        {isSelfMode ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1 text-slate-700 font-semibold text-xs">
                              <span className="text-red-500 text-xs">❌</span>
                              <span>🏠 Self Mode</span>
                            </div>
                            <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Temple pickup — tracking locked</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-mono text-xs font-bold text-slate-800 flex items-center space-x-1">
                              <span>#{item.tracking_number}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              via {item.courier_service}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Pre Calling */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">
                          {isSelfMode ? (
                            <span>🏠 Self Mode — editable now</span>
                          ) : (
                            <span>{item.pre_calling || 'Address Verified'}</span>
                          )}
                        </div>
                      </td>

                      {/* Post Calling */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs">
                          {isSelfMode ? (
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <span>{item.post_calling || '—'}</span>
                          )}
                        </div>
                      </td>

                      {/* Status / Duplicate Warning */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center space-y-1">
                          
                          {/* Status Pill */}
                          <button
                            onClick={() => handleToggleStatus(item)}
                            title="Click to change consignment status"
                            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-2xs cursor-pointer transition-transform hover:scale-105"
                          >
                            {item.status === 'DELIVERED' ? (
                              <span className="flex items-center space-x-1 text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                <span>🟢</span>
                                <span>Delivered</span>
                              </span>
                            ) : item.status === 'IN_TRANSIT' || item.status === 'DISPATCHED' ? (
                              <span className="flex items-center space-x-1 text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                <span>🟡</span>
                                <span>Out for Delivery</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1 text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full">
                                <span>🔴</span>
                                <span>Not Delivered</span>
                              </span>
                            )}
                          </button>

                          {/* Duplicate Warning */}
                          {isDuplicate && (
                            <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              <span>⚠️ Same Month Duplicate</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteSingle(item.id, item.devotee_name)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-colors shadow-2xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No live consignments match current filters.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "Clear Filters" or add a new consignment.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 6. Footer Status */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Showing <strong>{filteredConsignments.length}</strong> of <strong>{totalConsignments}</strong> live consignments (auto-synced from Birthday / Anniversary lists)
          </div>
          <div className="font-medium text-slate-600">
            Logistics Hub: Sri Sri Radha Madan Mohan Mandir, Durgapur
          </div>
        </div>
      </div>

      {/* MODAL: New Consignment */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">New Parcel Consignment</h3>
                  <p className="text-xs text-slate-500">Register new prasad/gift consignment</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConsignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recipient Devotee Spiritual Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  placeholder="e.g. PRAMOPRIYO GOURANGA DAS."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Legal Name
                  </label>
                  <input
                    type="text"
                    value={newLegalName}
                    onChange={(e) => setNewLegalName(e.target.value)}
                    placeholder="e.g. PRASENJIT DAS"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="8972882201"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Purpose
                  </label>
                  <select
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="ANNIVERSARY">Anniversary 💍</option>
                    <option value="BIRTHDAY">Birthday 🎂</option>
                    <option value="FESTIVAL_PRASAD">Festival Prasad</option>
                    <option value="GENERAL">General Seva</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Delivery Mode
                  </label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Self Mode">Self Mode (Temple Pickup)</option>
                    <option value="Delhivery Courier">Delhivery Courier</option>
                    <option value="Speed Post">Speed Post</option>
                    <option value="DTDC Courier">DTDC Courier</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Destination City / Region
                </label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. Durgapur Region"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Temple pickup — tracking locked"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                >
                  Create Consignment
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
