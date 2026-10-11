import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Devotee, ParcelDispatch } from '../../types';
import { parseRawDate } from '../../utils/dateUtils';
import confetti from 'canvas-confetti';
import { DevoteeAvatar } from '../common/DevoteeAvatar';
import { DatePickerWithOptions, DateOptionEvent } from '../common/DatePickerWithOptions';
import { 
  Cake, 
  Package, 
  PackagePlus, 
  Flame, 
  Truck, 
  CheckCircle2, 
  Search, 
  MapPin, 
  Calendar, 
  MessageCircle, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  X, 
  Printer,
  Heart
} from 'lucide-react';

interface DevoteeBirthdayWishDashboardProps {
  onSelectDevotee?: (devoteeId: string) => void;
}

const MONTH_NAMES = [
  'All Months',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const DELIVERY_MODES = [
  'Select Delivery Mode',
  'Delhivery Courier',
  'Self Mode',
  'Speed Post',
  'DTDC Courier',
  'By Hand / Temple Delivery'
];

export const DevoteeBirthdayWishDashboard: React.FC<DevoteeBirthdayWishDashboardProps> = ({
  onSelectDevotee
}) => {
  const { 
    devotees, 
    parcelDispatches, 
    addParcelDispatch, 
    logCareInteraction,
    birthdayRemovals,
    anniversaryRemovals,
    removeBirthdayRecord,
    removeAnniversaryRecord
  } = useData();
  const { currentUser } = useAuth();

  // Mode: Birthday Wish Dashboard vs Anniversary Wish Dashboard
  const [dashboardMode, setDashboardMode] = useState<'birthday' | 'anniversary'>('birthday');

  // Filters State - Defaulting to October & 10-10-2026
  const [selectedMonth, setSelectedMonth] = useState<string>('October');
  const [exactDate, setExactDate] = useState<string>('10-10-2026');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('ALL');
  const [maritalFilter, setMaritalFilter] = useState<string>('ALL');

  // Multi-selection state
  const [selectedDevoteeIds, setSelectedDevoteeIds] = useState<string[]>([]);

  // Per-devotee chosen delivery mode map (persisted in localStorage)
  const [deliveryModeMap, setDeliveryModeMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('iskcon_birthday_delivery_modes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Wished state
  const [wishedMap, setWishedMap] = useState<Record<string, boolean>>({});

  // Modals state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiSelectedDevotee, setAiSelectedDevotee] = useState<{ name: string; occasion: string; phone?: string } | null>(null);
  const [aiMessageTab, setAiMessageTab] = useState<'formal' | 'sweet' | 'bengali'>('formal');
  const [copiedAiMessage, setCopiedAiMessage] = useState(false);

  // Bulk dispatch modal form
  const [bulkParcelType, setBulkParcelType] = useState<ParcelDispatch['parcel_type']>('PRASADAM');
  const [bulkCourier, setBulkCourier] = useState('Delhivery Courier');
  const [bulkNotes, setBulkNotes] = useState('Maha Prasadam & Blessings Box');

  // Sync delivery mode map to localStorage
  useEffect(() => {
    localStorage.setItem('iskcon_birthday_delivery_modes', JSON.stringify(deliveryModeMap));
  }, [deliveryModeMap]);

  // When switching modes, set the date placeholder/default appropriately
  const handleSwitchMode = (mode: 'birthday' | 'anniversary') => {
    setDashboardMode(mode);
    setSelectedDevoteeIds([]);
    if (mode === 'birthday') {
      setExactDate('10-10-2026');
    } else {
      setExactDate('');
    }
  };

  // ==========================================
  // 1. BIRTHDAY CELEBRATIONS LIST
  // ==========================================
  const parsedBirthdayList = useMemo(() => {
    const refYear = 2026;

    return devotees
      .filter((dev) => !birthdayRemovals.includes(dev.id))
      .map((dev) => {
        const rawDob = dev.date_of_birth || '';
        const parsedDob = parseRawDate(rawDob);
        let monthNum = 0;
        let dayNum = 0;
        let birthYear = 0;

        if (parsedDob) {
          const parts = parsedDob.split('-').map(Number);
          birthYear = parts[0] || 0;
          monthNum = parts[1] || 0;
          dayNum = parts[2] || 0;
        } else if (rawDob) {
          const match = rawDob.match(/(\d{1,2})\s+([A-Za-z]+),?\s*(\d{4})?/);
          if (match) {
            dayNum = parseInt(match[1], 10);
            const mIdx = MONTH_NAMES.findIndex(
              (m) => m.toLowerCase() === match[2].toLowerCase()
            );
            if (mIdx > 0) monthNum = mIdx;
            if (match[3]) birthYear = parseInt(match[3], 10);
          }
        }

        const monthName = monthNum > 0 ? MONTH_NAMES[monthNum] : '';
        const turningYears = birthYear > 0 ? refYear - birthYear : 0;
        const formattedDate = dayNum > 0 && monthName 
          ? `${dayNum} ${monthName}${birthYear ? `, ${birthYear}` : ''}`
          : rawDob || 'N/A';

        const dateKeySlash = `${String(dayNum).padStart(2, '0')}-${String(monthNum).padStart(2, '0')}-${refYear}`;
        const dateKeyShort = `${String(dayNum).padStart(2, '0')}-${String(monthNum).padStart(2, '0')}`;
        const hasAddress = Boolean(dev.address && dev.address.trim().length > 3);
        const isMarried = Boolean(dev.spouse_name && dev.spouse_name.trim().length > 1);

        const assignedMode = deliveryModeMap[dev.id] || (
          dev.city?.toLowerCase().includes('durgapur') ? 'Self Mode' : 'Delhivery Courier'
        );

        return {
          id: dev.id,
          devotee: dev,
          rawDob,
          parsedDob,
          monthNum,
          monthName,
          dayNum,
          birthYear,
          turningYears,
          formattedDate,
          dateKeySlash,
          dateKeyShort,
          hasAddress,
          isMarried,
          assignedMode
        };
      })
      .filter((item) => item.monthNum > 0);
  }, [devotees, birthdayRemovals, deliveryModeMap]);

  // Filtered Birthdays
  const filteredBirthdays = useMemo(() => {
    return parsedBirthdayList.filter((item) => {
      if (selectedMonth && selectedMonth !== 'All Months') {
        if (item.monthName.toLowerCase() !== selectedMonth.toLowerCase()) return false;
      }
      if (exactDate && exactDate.trim()) {
        const cleanExact = exactDate.trim();
        let targetDay = 0;
        let targetMonth = 0;
        const dmyMatch = cleanExact.match(/^(\d{1,2})-(\d{1,2})/);
        if (dmyMatch) {
          targetDay = parseInt(dmyMatch[1], 10);
          targetMonth = parseInt(dmyMatch[2], 10);
        } else {
          const ymdMatch = cleanExact.match(/^\d{4}-(\d{1,2})-(\d{1,2})/);
          if (ymdMatch) {
            targetMonth = parseInt(ymdMatch[1], 10);
            targetDay = parseInt(ymdMatch[2], 10);
          }
        }

        if (targetDay > 0 && targetMonth > 0) {
          if (item.dayNum !== targetDay || item.monthNum !== targetMonth) return false;
        } else {
          const matchesDate = 
            item.dateKeySlash === cleanExact ||
            item.dateKeyShort === cleanExact ||
            (cleanExact.includes('10-10') && item.dayNum === 10 && item.monthNum === 10) ||
            (cleanExact.startsWith('2026-') && item.parsedDob.endsWith(cleanExact.slice(5)));
          if (!matchesDate) return false;
        }
      }
      if (cityFilter && cityFilter.trim()) {
        const cLower = cityFilter.toLowerCase().trim();
        if (!(item.devotee.city || '').toLowerCase().includes(cLower)) return false;
      }
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (item.devotee.spiritual_name || '').toLowerCase().includes(q);
        const matchLegal = (item.devotee.legal_name || '').toLowerCase().includes(q);
        const matchPhone = (item.devotee.phone || '').includes(q);
        const matchId = (item.devotee.id || '').toLowerCase().includes(q);
        if (!matchName && !matchLegal && !matchPhone && !matchId) return false;
      }
      if (deliveryFilter && deliveryFilter !== 'ALL') {
        if (item.assignedMode !== deliveryFilter) return false;
      }
      if (maritalFilter && maritalFilter !== 'ALL') {
        if (maritalFilter === 'Married' && !item.isMarried) return false;
        if (maritalFilter === 'Unmarried' && item.isMarried) return false;
      }
      return true;
    });
  }, [parsedBirthdayList, selectedMonth, exactDate, cityFilter, searchQuery, deliveryFilter, maritalFilter]);

  // ==========================================
  // 2. ANNIVERSARY COUPLES LIST (Matches Image 2)
  // ==========================================
  const parsedAnniversaryCouples = useMemo(() => {
    const refYear = 2026;

    // Helper to find month from date string
    const getMonthFromStr = (str?: string) => {
      if (!str) return 0;
      const lower = str.toLowerCase();
      const mIdx = MONTH_NAMES.findIndex((m) => m !== 'All Months' && lower.includes(m.toLowerCase().slice(0, 3)));
      return mIdx > 0 ? mIdx : 0;
    };

    // Helper to extract year from date string
    const getYearFromStr = (str?: string) => {
      if (!str) return 0;
      const m = str.match(/(\d{4})/);
      return m ? parseInt(m[1], 10) : 0;
    };

    // Defined October couple groups matching user dataset and Image 2
    const coupleGroups: Array<{
      id: string;
      husbandName: string;
      wifeName: string;
      dateStr: string;
      monthNum: number;
      dayNum: number;
      yearsCount: number;
      husbandPhone?: string;
      wifePhone?: string;
      singlePhone?: string;
      husbandCity?: string;
      wifeCity?: string;
      singleCity?: string;
      husbandPhoto?: string;
      wifePhoto?: string;
      hasHeartIcon?: boolean;
      defaultMode: string;
      addressVerified: boolean;
      primaryDevotee: Devotee;
    }> = [];

    // Filter devotees with marriage anniversary
    const withAnniv = devotees.filter((d) => Boolean(d.marriage_anniversary && d.marriage_anniversary.trim()));

    // Pair known couples
    const processedPairs = new Set<string>();

    withAnniv.forEach((d) => {
      if (processedPairs.has(d.id) || anniversaryRemovals.includes(d.id)) return;

      const annivStr = d.marriage_anniversary!;
      const mNum = getMonthFromStr(annivStr);
      const yr = getYearFromStr(annivStr);
      const yearsCount = yr > 0 ? refYear - yr : 0;
      let dayNum = 0;
      const parsedAnniv = parseRawDate(annivStr);
      if (parsedAnniv) {
        const parts = parsedAnniv.split('-').map(Number);
        dayNum = parts[2] || 0;
      } else {
        const dMatch = annivStr.match(/(\d{1,2})/);
        if (dMatch) dayNum = parseInt(dMatch[1], 10);
      }

      // Find partner in database
      const partner = devotees.find(
        (p) =>
          p.id !== d.id &&
          !anniversaryRemovals.includes(p.id) &&
          ((d.spouse_name && (p.legal_name.toLowerCase().includes(d.spouse_name.toLowerCase()) || (p.spiritual_name && p.spiritual_name.toLowerCase().includes(d.spouse_name.toLowerCase())))) ||
            (p.spouse_name && (d.legal_name.toLowerCase().includes(p.spouse_name.toLowerCase()) || (d.spiritual_name && d.spiritual_name.toLowerCase().includes(p.spouse_name.toLowerCase())))))
      );

      if (partner) {
        processedPairs.add(d.id);
        processedPairs.add(partner.id);

        const h = d.gender === 'MALE' ? d : partner;
        const w = d.gender === 'FEMALE' ? d : (partner.gender === 'FEMALE' ? partner : d);

        coupleGroups.push({
          id: `couple-${d.id}-${partner.id}`,
          husbandName: h.legal_name || h.spiritual_name,
          wifeName: w.legal_name || w.spiritual_name,
          dateStr: annivStr,
          monthNum: mNum,
          dayNum,
          yearsCount,
          husbandPhone: h.phone,
          wifePhone: w.phone,
          husbandCity: h.city || 'Durgapur',
          wifeCity: w.city || 'Durgapur',
          husbandPhoto: h.photo_url,
          wifePhoto: w.photo_url,
          defaultMode: 'Self Mode',
          addressVerified: Boolean(h.address || w.address),
          primaryDevotee: h
        });
      } else {
        processedPairs.add(d.id);
        coupleGroups.push({
          id: `couple-single-${d.id}`,
          husbandName: d.legal_name || d.spiritual_name,
          wifeName: d.spouse_name || 'Spouse',
          dateStr: annivStr,
          monthNum: mNum,
          dayNum,
          yearsCount,
          singlePhone: d.phone,
          singleCity: d.city || 'Durgapur Region',
          husbandPhoto: d.photo_url,
          hasHeartIcon: true,
          defaultMode: 'Select Delivery Mode',
          addressVerified: Boolean(d.address),
          primaryDevotee: d
        });
      }
    });

    return coupleGroups;
  }, [devotees, anniversaryRemovals]);

  // Filtered Anniversary Couples
  const filteredAnniversaryCouples = useMemo(() => {
    return parsedAnniversaryCouples.filter((item) => {
      if (selectedMonth && selectedMonth !== 'All Months') {
        const targetIdx = MONTH_NAMES.indexOf(selectedMonth);
        if (targetIdx > 0 && item.monthNum !== targetIdx) return false;
      }
      if (exactDate && exactDate.trim()) {
        const clean = exactDate.trim();
        let targetDay = 0;
        let targetMonth = 0;
        const dmyMatch = clean.match(/^(\d{1,2})-(\d{1,2})/);
        if (dmyMatch) {
          targetDay = parseInt(dmyMatch[1], 10);
          targetMonth = parseInt(dmyMatch[2], 10);
        } else {
          const ymdMatch = clean.match(/^\d{4}-(\d{1,2})-(\d{1,2})/);
          if (ymdMatch) {
            targetMonth = parseInt(ymdMatch[1], 10);
            targetDay = parseInt(ymdMatch[2], 10);
          }
        }

        if (targetDay > 0 && targetMonth > 0 && item.dayNum > 0) {
          if (item.dayNum !== targetDay || item.monthNum !== targetMonth) return false;
        } else {
          if (!item.dateStr.toLowerCase().includes(clean.toLowerCase())) return false;
        }
      }
      if (cityFilter && cityFilter.trim()) {
        const q = cityFilter.toLowerCase().trim();
        const c1 = (item.husbandCity || '').toLowerCase();
        const c2 = (item.wifeCity || '').toLowerCase();
        const c3 = (item.singleCity || '').toLowerCase();
        if (!c1.includes(q) && !c2.includes(q) && !c3.includes(q)) return false;
      }
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const m1 = item.husbandName.toLowerCase().includes(q);
        const m2 = item.wifeName.toLowerCase().includes(q);
        const m3 = (item.husbandPhone || '').includes(q) || (item.wifePhone || '').includes(q) || (item.singlePhone || '').includes(q);
        if (!m1 && !m2 && !m3) return false;
      }
      return true;
    });
  }, [parsedAnniversaryCouples, selectedMonth, exactDate, cityFilter, searchQuery]);

  // Multi-selection helper
  const activeListLength = dashboardMode === 'birthday' ? filteredBirthdays.length : filteredAnniversaryCouples.length;
  const isAllSelected = activeListLength > 0 && (
    dashboardMode === 'birthday' 
      ? filteredBirthdays.every((c) => selectedDevoteeIds.includes(c.id))
      : filteredAnniversaryCouples.every((c) => selectedDevoteeIds.includes(c.id))
  );

  // Compute celebration event dates for the date picker options
  const availableCelebrationDates = useMemo<DateOptionEvent[]>(() => {
    const countsByDay: Record<string, { count: number; day: number; month: number; type: 'birthday' | 'anniversary' }> = {};

    if (dashboardMode === 'birthday') {
      parsedBirthdayList.forEach((b) => {
        if (b.monthNum > 0 && b.dayNum > 0) {
          const key = `${b.monthNum}-${b.dayNum}`;
          if (!countsByDay[key]) {
            countsByDay[key] = { count: 0, day: b.dayNum, month: b.monthNum, type: 'birthday' };
          }
          countsByDay[key].count += 1;
        }
      });
    } else {
      parsedAnniversaryCouples.forEach((a) => {
        if (a.monthNum > 0 && a.dayNum > 0) {
          const key = `${a.monthNum}-${a.dayNum}`;
          if (!countsByDay[key]) {
            countsByDay[key] = { count: 0, day: a.dayNum, month: a.monthNum, type: 'anniversary' };
          }
          countsByDay[key].count += 1;
        }
      });
    }

    return Object.values(countsByDay).map((info) => {
      const mStr = String(info.month).padStart(2, '0');
      const dStr = String(info.day).padStart(2, '0');
      const mName = MONTH_NAMES[info.month] || 'Oct';
      return {
        day: info.day,
        month: info.month,
        year: 2026,
        formattedDate: `${dStr}-${mStr}-2026`,
        label: `${info.day} ${mName} (${info.count})`,
        count: info.count,
        type: info.type
      };
    });
  }, [dashboardMode, parsedBirthdayList, parsedAnniversaryCouples]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const visibleIds = new Set(
        dashboardMode === 'birthday' 
          ? filteredBirthdays.map((c) => c.id) 
          : filteredAnniversaryCouples.map((c) => c.id)
      );
      setSelectedDevoteeIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      const visibleIds = dashboardMode === 'birthday'
        ? filteredBirthdays.map((c) => c.id)
        : filteredAnniversaryCouples.map((c) => c.id);
      setSelectedDevoteeIds(Array.from(new Set([...selectedDevoteeIds, ...visibleIds])));
    }
  };

  const handleToggleRowSelect = (rowId: string) => {
    setSelectedDevoteeIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  // Change Delivery Mode for individual devotee/couple
  const handleSetRowDeliveryMode = (rowId: string, mode: string) => {
    setDeliveryModeMap((prev) => ({
      ...prev,
      [rowId]: mode
    }));
  };

  // KPI Calculations
  const birthdaysInView = filteredBirthdays.length;
  const couplesInView = filteredAnniversaryCouples.length;

  const todayTomorrowBirthdays = parsedBirthdayList.filter(
    (item) => item.monthNum === 10 && (item.dayNum === 10 || item.dayNum === 11)
  ).length;

  const giftsPackedCount = parcelDispatches.filter(
    (p) => p.status === 'PREPARING'
  ).length;

  const inTransitCount = parcelDispatches.filter(
    (p) => p.status === 'IN_TRANSIT' || p.status === 'DISPATCHED'
  ).length;

  const deliveredCount = parcelDispatches.filter(
    (p) => p.status === 'DELIVERED'
  ).length;

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedMonth('All Months');
    setExactDate('');
    setCityFilter('');
    setSearchQuery('');
    setDeliveryFilter('ALL');
    setMaritalFilter('ALL');
  };

  // Single Devotee WhatsApp Wish
  const handleSendWish = async (name: string, turningYears: number, phone?: string, isAnniversary = false) => {
    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#059669', '#10b981', '#f59e0b', '#ec4899']
    });

    setWishedMap((prev) => ({ ...prev, [name]: true }));

    const message = isAnniversary
      ? `Hare Krishna! 🙏🌺
Heartiest Krishna conscious Vivaha Anniversary wishes to ${name} (${turningYears} Years of Vivaha Harmony)!
May Sri Sri Radha Madhava and Srila Prabhupada shower unlimited devotional mercy, peace, mutual affection, and bhakti upon your grihastha ashrama.
Warm prayers from ISKCON Durgapur Devotee Care! Haribol! 💍✨`
      : `Hare Krishna ${name}! 🙏🌺
Heartiest Krishna conscious Happy Birthday wishes on turning ${turningYears || 'auspicious'} years!
May Sri Sri Radha Madhava and Srila Prabhupada shower unlimited devotional mercy, bhakti, good health, and bliss in their loving devotional service.
With warm prayers from ISKCON Durgapur Devotee Care! Haribol! 🎂✨`;

    await logCareInteraction({
      devotee_id: `wish-${Date.now()}`,
      devotee_name: name,
      interaction_type: isAnniversary ? 'ANNIVERSARY_WISH' : 'BIRTHDAY_WISH',
      conducted_by_id: currentUser.id,
      conducted_by_name: currentUser.spiritual_name || currentUser.full_name,
      date: new Date().toISOString().split('T')[0],
      wished_via: 'WHATSAPP',
      notes: `Sent personalized WhatsApp greeting.`
    });

    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  };

  // Soft-remove row from celebration view (never permanently deleted)
  const handleRemoveRow = (rowId: string) => {
    if (dashboardMode === 'birthday') {
      removeBirthdayRecord(rowId);
    } else {
      const match = parsedAnniversaryCouples.find((c) => c.id === rowId);
      if (match) {
        removeAnniversaryRecord(match.primaryDevotee.id);
      } else {
        removeAnniversaryRecord(rowId);
      }
    }
    setSelectedDevoteeIds((prev) => prev.filter((id) => id !== rowId));
  };

  // Open AI Greeting Modal
  const handleOpenAiModal = (name: string, occasion: string, phone?: string) => {
    setAiSelectedDevotee({ name, occasion, phone });
    setCopiedAiMessage(false);
    setIsAiModalOpen(true);
  };

  // Submit Bulk Create Parcel
  const handleConfirmBulkCreateParcel = async () => {
    if (selectedDevoteeIds.length === 0) {
      alert('Please select at least one record to create parcels.');
      return;
    }

    let count = 0;
    const isBirthdayMode = dashboardMode === 'birthday';

    if (isBirthdayMode) {
      const selected = parsedBirthdayList.filter((b) => selectedDevoteeIds.includes(b.id));
      for (const item of selected) {
        const trackNo = `DEL-ISK-${Math.floor(100000 + Math.random() * 900000)}`;
        const assignedCourier = deliveryModeMap[item.id] || bulkCourier;

        await addParcelDispatch({
          devotee_id: item.devotee.id,
          devotee_name: item.devotee.spiritual_name || item.devotee.legal_name,
          parcel_type: bulkParcelType,
          tracking_number: trackNo,
          courier_service: assignedCourier,
          dispatch_date: new Date().toISOString().split('T')[0],
          status: 'DISPATCHED',
          destination_city: item.devotee.city || 'Durgapur',
          dispatched_by: currentUser.spiritual_name || currentUser.full_name,
          notes: `${bulkNotes} • Birthday celebration dispatch`
        });
        count++;
      }
    } else {
      const selected = parsedAnniversaryCouples.filter((c) => selectedDevoteeIds.includes(c.id));
      for (const item of selected) {
        const trackNo = `DEL-ISK-${Math.floor(100000 + Math.random() * 900000)}`;
        const assignedCourier = deliveryModeMap[item.id] || bulkCourier;

        await addParcelDispatch({
          devotee_id: item.primaryDevotee.id,
          devotee_name: `${item.husbandName} & ${item.wifeName}`,
          parcel_type: bulkParcelType,
          tracking_number: trackNo,
          courier_service: assignedCourier,
          dispatch_date: new Date().toISOString().split('T')[0],
          status: 'DISPATCHED',
          destination_city: item.husbandCity || item.singleCity || 'Durgapur',
          dispatched_by: currentUser.spiritual_name || currentUser.full_name,
          notes: `${bulkNotes} • Vivaha Anniversary celebration dispatch`
        });
        count++;
      }
    }

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#047857', '#10b981', '#34d399', '#f59e0b']
    });

    setIsBulkModalOpen(false);
    alert(`🎉 Successfully created ${count} parcel dispatches in ISKCON Parcel Department!`);
  };

  // Export Selected to PDF / Print Sheet
  const handleExportToPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up was blocked. Please allow pop-ups to print/export PDF.');
      return;
    }

    const isBirthdayMode = dashboardMode === 'birthday';
    const titleText = isBirthdayMode 
      ? 'DEVOTEE BIRTHDAY PARCEL DISPATCH SHEET' 
      : 'DEVOTEE ANNIVERSARY VIVAHA HARMONY DISPATCH SHEET';

    const rowsHtml = isBirthdayMode
      ? parsedBirthdayList
          .filter((item) => selectedDevoteeIds.includes(item.id))
          .map(
            (item, idx) => `
            <tr>
              <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
              <td><strong>${item.devotee.spiritual_name || item.devotee.legal_name}</strong></td>
              <td>${item.devotee.legal_name || '—'}</td>
              <td>${item.formattedDate} (${item.turningYears ? `Turning ${item.turningYears} Yrs` : ''})</td>
              <td>${item.devotee.phone || '—'}</td>
              <td>${item.devotee.city || '—'}</td>
              <td>${item.devotee.address || '—'}</td>
              <td>${item.assignedMode}</td>
            </tr>
          `
          )
          .join('')
      : parsedAnniversaryCouples
          .filter((item) => selectedDevoteeIds.includes(item.id))
          .map(
            (item, idx) => `
            <tr>
              <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
              <td><strong>${item.husbandName} & ${item.wifeName}</strong></td>
              <td>${item.dateStr} (${item.yearsCount} Years Harmony)</td>
              <td>${item.husbandPhone || item.singlePhone || '—'} / ${item.wifePhone || '—'}</td>
              <td>${item.husbandCity || item.singleCity || '—'}</td>
              <td>${deliveryModeMap[item.id] || item.defaultMode}</td>
            </tr>
          `
          )
          .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ISKCON ${titleText}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; color: #047857; margin: 0; }
            .sub { font-size: 13px; color: #64748b; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
            th { background: #ecfdf5; color: #065f46; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px 6px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 8px 6px; vertical-align: top; }
            @media print { button { display: none; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">ISKCON DURGAPUR • ${titleText}</h1>
            <div class="sub">Generated on ${new Date().toLocaleDateString()} • Total Selected: ${selectedDevoteeIds.length}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">S.NO</th>
                <th>${isBirthdayMode ? 'DEVOTEE NAME' : 'COUPLE NAMES'}</th>
                <th>${isBirthdayMode ? 'LEGAL NAME' : 'ANNIVERSARY DATE'}</th>
                <th>${isBirthdayMode ? 'BIRTHDAY' : 'CONTACT PHONE(S)'}</th>
                <th>${isBirthdayMode ? 'PHONE' : 'CITY / REGION'}</th>
                <th>${isBirthdayMode ? 'CITY' : 'DELIVERY MODE'}</th>
                ${isBirthdayMode ? '<th>FULL ADDRESS</th><th>DELIVERY MODE</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // AI Message templates generator
  const getAiMessage = () => {
    if (!aiSelectedDevotee) return '';
    const { name, occasion } = aiSelectedDevotee;

    if (aiMessageTab === 'formal') {
      return `Hare Krishna ${name}! 🙏🌺
On this auspicious occasion of your ${occasion}, we pray to Sri Sri Radha Madhava, Sri Sri Gauranga, and Srila Prabhupada to bless you with unwavering devotion, transcendental knowledge, good health, and an abundance of spiritual joy.
"om ajnana-timirandhasya jnananjana-salakaya..."
May your loving seva to Sri Krishna continue to illuminate your life and inspire the entire congregation.
Warm Vaishnava Blessings from ISKCON Durgapur Devotee Care Department. Haribol! ✨`;
    }

    if (aiMessageTab === 'sweet') {
      return `Hare Krishna beloved ${name}! 🌸
Wishing you a very sweet and joyful Krishna conscious ${occasion}! May Lord Sri Krishna always protect you and engage your lotus hands and heart in His divine loving devotional service. 
May your day be filled with Mahaprasadam, Harinama kirtana, and ecstatic Vaishnava association! 💐
Hare Krishna Hare Krishna Krishna Krishna Hare Hare, Hare Rama Hare Rama Rama Rama Hare Hare!`;
    }

    return `হরে কৃষ্ণ ${name}! 🙏🌺
আপনার শুভ ${occasion} উপলক্ষে শ্রী শ্রী রাধা মাধব ও শ্রীল প্রভুপাদের শ্রীচরণে আপনার পারমার্থিক অগ্রগতি, সুস্বাস্থ্য ও অবিচল কৃষ্ণপ্রেম কামনায় সশ্রদ্ধ প্রার্থনা জানাই।
ভগবানের নিত্য সেবায় আপনার জীবন সদাসর্বদা আনন্দময় হোক।
শুভ কামনা! হরে কৃষ্ণ! 🎉`;
  };

  return (
    <div className="space-y-5 pb-16 font-sans">
      
      {/* 1. Header: Mode Toggle Tabs & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
        <div className="flex items-center space-x-2.5">
          <span className="text-2xl">{dashboardMode === 'birthday' ? '🎂' : '💍'}</span>
          <h1 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
            {dashboardMode === 'birthday'
              ? 'DEVOTEE BIRTHDAY WISH DASHBOARD'
              : 'DEVOTEE ANNIVERSARY WISH DASHBOARD'}
          </h1>
        </div>

        {/* Dashboard Switcher Pill */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold shadow-2xs">
          <button
            onClick={() => handleSwitchMode('birthday')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              dashboardMode === 'birthday'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>🎂</span>
            <span>Birthday Dashboard</span>
          </button>
          <button
            onClick={() => handleSwitchMode('anniversary')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              dashboardMode === 'anniversary'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>💍</span>
            <span>Anniversary Dashboard</span>
          </button>
        </div>
      </div>

      {/* 2. Green Banner: Bulk Create Parcel */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-emerald-950">
              Bulk Create Parcel
            </h2>
            <p className="text-xs text-emerald-800/90 mt-0.5">
              Select devotees on the Birthday / Anniversary list with the ☑️ checkbox, then create prasadam parcels for all of them in one click.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (selectedDevoteeIds.length === 0) {
              const allIds = dashboardMode === 'birthday' 
                ? filteredBirthdays.map((c) => c.id) 
                : filteredAnniversaryCouples.map((c) => c.id);
              setSelectedDevoteeIds(allIds);
            }
            setIsBulkModalOpen(true);
          }}
          className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 shrink-0"
        >
          <span className="text-sm leading-none">+</span>
          <span>Bulk Create Parcel</span>
        </button>
      </div>

      {/* 3. Stat KPI Cards (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: IN VIEW */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              dashboardMode === 'birthday' ? 'bg-pink-50 text-pink-500' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {dashboardMode === 'birthday' ? <Cake className="w-4 h-4" /> : <Heart className="w-4 h-4 fill-emerald-600" />}
            </div>
            <span>{dashboardMode === 'birthday' ? 'BIRTHDAYS IN VIEW' : 'COUPLES IN VIEW'}</span>
          </div>
          <div className={`mt-2.5 text-2xl font-black pl-0.5 ${
            dashboardMode === 'birthday' ? 'text-pink-600' : 'text-emerald-600'
          }`}>
            {dashboardMode === 'birthday' ? birthdaysInView : couplesInView}
          </div>
        </div>

        {/* Card 2: TODAY & TOMORROW */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <span>TODAY & TOMORROW</span>
          </div>
          <div className="mt-2.5 text-2xl font-black text-red-500 pl-0.5">
            {dashboardMode === 'birthday' ? todayTomorrowBirthdays : 0}
          </div>
        </div>

        {/* Card 3: GIFTS PACKED */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <span>GIFTS PACKED</span>
          </div>
          <div className="mt-2.5 text-2xl font-black text-amber-500 pl-0.5">
            {giftsPackedCount}
          </div>
        </div>

        {/* Card 4: IN TRANSIT */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <span>IN TRANSIT</span>
          </div>
          <div className="mt-2.5 text-2xl font-black text-blue-600 pl-0.5">
            {inTransitCount}
          </div>
        </div>

        {/* Card 5: DELIVERED */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>DELIVERED</span>
          </div>
          <div className="mt-2.5 text-2xl font-black text-emerald-600 pl-0.5">
            {deliveredCount}
          </div>
        </div>

      </div>

      {/* 4. Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Month View */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              🗓️ Month View:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {MONTH_NAMES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Date View (Exact Date) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              🗓️ Date View (Exact Date):
            </label>
            <DatePickerWithOptions
              value={exactDate}
              onChange={(newVal) => setExactDate(newVal)}
              currentMonthName={selectedMonth}
              onMonthSelect={(mName) => setSelectedMonth(mName)}
              eventDates={availableCelebrationDates}
              placeholder={dashboardMode === 'birthday' ? 'Pick a date...' : 'Pick anniversary date...'}
            />
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              📍 City Filter:
            </label>
            <div className="relative">
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Search city..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Search Celebration Devotees */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Search Celebration Devotees:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, initiate..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Mode of Delivery */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              🚚 Mode of Delivery:
            </label>
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Modes</option>
              <option value="Delhivery Courier">Delhivery Courier</option>
              <option value="Self Mode">Self Mode</option>
              <option value="Speed Post">Speed Post</option>
              <option value="DTDC Courier">DTDC Courier</option>
              <option value="By Hand / Temple Delivery">By Hand / Temple Delivery</option>
            </select>
          </div>

          {/* Marital Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              💍 Marital Status:
            </label>
            <select
              value={maritalFilter}
              onChange={(e) => setMaritalFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Married">Married</option>
              <option value="Unmarried">Unmarried</option>
            </select>
          </div>

        </div>

        {/* Quick Date Options Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center space-x-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Date Options:</span>
            </span>
            <button
              type="button"
              onClick={() => setExactDate('')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                !exactDate
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Dates ({selectedMonth})
            </button>
            <button
              type="button"
              onClick={() => setExactDate('10-10-2026')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                exactDate === '10-10-2026'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span>🌟</span>
              <span>Today (10 Oct)</span>
            </button>
            <button
              type="button"
              onClick={() => setExactDate('11-10-2026')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                exactDate === '11-10-2026'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <span>🌅</span>
              <span>Tomorrow (11 Oct)</span>
            </button>
            <button
              type="button"
              onClick={() => setExactDate('12-10-2026')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                exactDate === '12-10-2026'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              12 Oct
            </button>

            {/* Month's Celebration Dates as Quick Options */}
            {availableCelebrationDates
              .filter((e) => selectedMonth === 'All Months' || e.month === (MONTH_NAMES.indexOf(selectedMonth) > 0 ? MONTH_NAMES.indexOf(selectedMonth) : 10))
              .sort((a, b) => a.day - b.day)
              .slice(0, 6)
              .map((ev) => (
                <button
                  key={ev.formattedDate}
                  type="button"
                  onClick={() => setExactDate(ev.formattedDate)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                    exactDate === ev.formattedDate
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-slate-50 hover:bg-amber-50 border border-slate-200/80 text-slate-700 hover:text-amber-900'
                  }`}
                >
                  <span>{ev.type === 'anniversary' ? '💍' : '🎂'}</span>
                  <span>{ev.day} {MONTH_NAMES[ev.month].slice(0, 3)}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-200/70 text-amber-950 font-extrabold ml-0.5">
                    {ev.count}
                  </span>
                </button>
              ))}
          </div>

          {/* Clear Filters Link */}
          <div>
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center space-x-1 hover:underline cursor-pointer"
            >
              <span>🧹</span>
              <span>Clear All Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Selection Bar & PDF Export */}
      <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-600 font-medium">Selected:</span>
          <span className="px-2.5 py-0.5 rounded-full font-bold bg-pink-100 text-pink-700">
            {selectedDevoteeIds.length}
          </span>
          <button
            onClick={() => setSelectedDevoteeIds([])}
            className="text-slate-400 hover:text-slate-700 underline text-xs ml-1"
          >
            Clear
          </button>
        </div>

        <button
          onClick={handleExportToPdf}
          className="bg-rose-700 hover:bg-rose-800 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Export Selected to PDF</span>
        </button>
      </div>

      {/* 6. TABLE VIEW */}
      {dashboardMode === 'birthday' ? (
        /* ========================================================
           BIRTHDAY TABLE VIEW (Matches Image 1 from first prompt)
           ======================================================== */
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
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 w-12 text-center">S.NO.</th>
                  <th className="py-3 px-4 min-w-[240px]">NAME</th>
                  <th className="py-3 px-4 min-w-[160px]">🗓️ DATE</th>
                  <th className="py-3 px-4 min-w-[120px]">PHONE</th>
                  <th className="py-3 px-4 min-w-[110px]">CITY</th>
                  <th className="py-3 px-4 text-center min-w-[110px]">MARITAL STATUS</th>
                  <th className="py-3 px-4 text-center min-w-[120px]">ADDRESS VERIFIED</th>
                  <th className="py-3 px-4 min-w-[170px]">MODE OF DELIVERY</th>
                  <th className="py-3 px-4 text-right min-w-[180px]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBirthdays.length > 0 ? (
                  filteredBirthdays.map((item, index) => {
                    const dev = item.devotee;
                    const isChecked = selectedDevoteeIds.includes(item.id);
                    const isWished = wishedMap[dev.spiritual_name || dev.legal_name];
                    const currentMode = item.assignedMode;

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
                            className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* S.NO. */}
                        <td className="py-3.5 px-3 text-center font-bold text-slate-500">
                          {index + 1}
                        </td>

                        {/* NAME */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <DevoteeAvatar
                              photoUrl={dev.photo_url}
                              name={dev.spiritual_name || dev.legal_name}
                              id={dev.id}
                              size="md"
                            />

                            <div>
                              <div 
                                onClick={() => onSelectDevotee && onSelectDevotee(dev.id)}
                                className="font-black text-xs text-slate-900 hover:text-amber-700 cursor-pointer tracking-tight"
                              >
                                {(dev.spiritual_name || dev.legal_name).toUpperCase()}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Legal Name: {dev.legal_name || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* DATE */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-800">
                            <span>🎂</span>
                            <span>{item.formattedDate}</span>
                          </div>
                          {item.turningYears > 0 && (
                            <div className="text-[11px] font-semibold text-rose-500 mt-0.5">
                              Turning {item.turningYears} Years
                            </div>
                          )}
                        </td>

                        {/* PHONE */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1 text-slate-700 font-medium">
                            <span>📞</span>
                            <span>{dev.phone || 'N/A'}</span>
                          </div>
                        </td>

                        {/* CITY */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1 text-slate-700 font-medium">
                            <span>📍</span>
                            <span>{dev.city || 'Durgapur'}</span>
                          </div>
                        </td>

                        {/* MARITAL STATUS */}
                        <td className="py-3.5 px-4 text-center">
                          {item.isMarried ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-100 text-pink-700">
                              <span>💕</span>
                              <span>Married</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                              Unmarried
                            </span>
                          )}
                        </td>

                        {/* ADDRESS VERIFIED */}
                        <td className="py-3.5 px-4 text-center">
                          {item.hasAddress ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <span>🟢</span>
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* MODE OF DELIVERY */}
                        <td className="py-3.5 px-4">
                          <select
                            value={currentMode}
                            onChange={(e) => handleSetRowDeliveryMode(item.id, e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            {DELIVERY_MODES.map((mode) => (
                              <option key={mode} value={mode}>
                                {mode}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleSendWish(dev.spiritual_name || dev.legal_name, item.turningYears, dev.phone, false)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shadow-2xs ${
                                isWished
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'
                              }`}
                            >
                              <Heart className="w-3 h-3 fill-current" />
                              <span>{isWished ? 'Wished' : 'Wish'}</span>
                            </button>

                            <button
                              onClick={() => handleRemoveRow(item.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white transition-all flex items-center space-x-1 shadow-2xs"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>

                            <button
                              onClick={() => handleOpenAiModal(dev.spiritual_name || dev.legal_name, 'Birthday', dev.phone)}
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 border border-purple-200 hover:border-purple-300 transition-colors"
                              title="Generate AI Krishna Conscious Blessing"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Cake className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600 text-sm">No birthday celebrations match current filters.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try clicking "Clear Filters" or selecting another month.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================
           ANNIVERSARY TABLE VIEW (Matches Image 2 exactly!)
           ======================================================== */
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
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 w-12 text-center">S.NO.</th>
                  <th className="py-3 px-4 min-w-[220px]">NAME</th>
                  <th className="py-3 px-4 min-w-[170px]">💍 ANNIVERSARY</th>
                  <th className="py-3 px-4 min-w-[140px]">PHONE</th>
                  <th className="py-3 px-4 min-w-[140px]">CITY</th>
                  <th className="py-3 px-4 text-center min-w-[110px]">MARITAL STATUS</th>
                  <th className="py-3 px-4 text-center min-w-[120px]">ADDRESS VERIFIED</th>
                  <th className="py-3 px-4 min-w-[170px]">MODE OF DELIVERY</th>
                  <th className="py-3 px-4 text-right min-w-[180px]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAnniversaryCouples.length > 0 ? (
                  filteredAnniversaryCouples.map((c, index) => {
                    const isChecked = selectedDevoteeIds.includes(c.id);
                    const isWished = wishedMap[c.husbandName];
                    const currentMode = deliveryModeMap[c.id] || c.defaultMode;

                    return (
                      <tr 
                        key={c.id} 
                        className={`hover:bg-amber-50/30 transition-colors ${
                          isChecked ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRowSelect(c.id)}
                            className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* S.NO. */}
                        <td className="py-3.5 px-3 text-center font-bold text-slate-500">
                          {index + 1}
                        </td>

                        {/* NAME (Couple with Dual Avatar or Single Heart Avatar) */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            {/* Dual or Single Avatars */}
                            {c.wifePhoto ? (
                              <div className="flex -space-x-2 shrink-0">
                                <DevoteeAvatar
                                  photoUrl={c.husbandPhoto}
                                  name={c.husbandName}
                                  id={c.id}
                                  size="sm"
                                  className="ring-2 ring-white"
                                />
                                <DevoteeAvatar
                                  photoUrl={c.wifePhoto}
                                  name={c.wifeName}
                                  id={`${c.id}-w`}
                                  size="sm"
                                  className="ring-2 ring-white"
                                />
                              </div>
                            ) : (
                              <DevoteeAvatar
                                photoUrl={c.husbandPhoto}
                                name={c.husbandName}
                                id={c.id}
                                size="md"
                              />
                            )}

                            <div>
                              <div className="font-bold text-xs text-slate-900 flex items-center space-x-1">
                                <span>{c.husbandName}</span>
                                {c.hasHeartIcon && <span className="text-red-500 text-xs">❤️</span>}
                              </div>
                              <div className="text-[11px] text-slate-600 uppercase font-semibold">
                                {c.wifeName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ANNIVERSARY DATE */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-800">
                            <span>💍</span>
                            <span>{c.dateStr}</span>
                          </div>
                          <div className="text-[11px] font-semibold text-pink-600 mt-0.5">
                            {c.yearsCount} Years of Vivaha Harmony
                          </div>
                        </td>

                        {/* PHONE */}
                        <td className="py-3.5 px-4 text-xs">
                          {c.husbandPhone && c.wifePhone ? (
                            <div className="space-y-1 font-mono">
                              <div className="flex items-center space-x-1.5">
                                <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] flex items-center justify-center shrink-0">H</span>
                                <span className="text-slate-800">{c.husbandPhone}</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <span className="w-4 h-4 rounded bg-purple-100 text-purple-800 font-bold text-[9px] flex items-center justify-center shrink-0">W</span>
                                <span className="text-slate-800">{c.wifePhone}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-slate-700 font-medium">
                              <span>📞</span>
                              <span>{c.singlePhone || 'N/A'}</span>
                            </div>
                          )}
                        </td>

                        {/* CITY */}
                        <td className="py-3.5 px-4 text-xs">
                          {c.husbandCity && c.wifeCity ? (
                            <div className="space-y-1 font-medium">
                              <div className="flex items-center space-x-1.5">
                                <span className="w-4 h-4 rounded bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center shrink-0">H</span>
                                <span className="text-slate-700">{c.husbandCity}</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <span className="w-4 h-4 rounded bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center shrink-0">W</span>
                                <span className="text-slate-700">{c.wifeCity}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-slate-700 font-medium">
                              <span>📍</span>
                              <span>{c.singleCity || 'Durgapur Region'}</span>
                            </div>
                          )}
                        </td>

                        {/* MARITAL STATUS */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-100 text-pink-700">
                            <span>💕</span>
                            <span>Married</span>
                          </span>
                        </td>

                        {/* ADDRESS VERIFIED */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <span>🟢</span>
                            <span>Verified</span>
                          </span>
                        </td>

                        {/* MODE OF DELIVERY */}
                        <td className="py-3.5 px-4">
                          <select
                            value={currentMode}
                            onChange={(e) => handleSetRowDeliveryMode(c.id, e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            {DELIVERY_MODES.map((mode) => (
                              <option key={mode} value={mode}>
                                {mode}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleSendWish(`${c.husbandName} & ${c.wifeName}`, c.yearsCount, c.husbandPhone || c.singlePhone, true)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shadow-2xs ${
                                isWished
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'
                              }`}
                            >
                              <Heart className="w-3 h-3 fill-current" />
                              <span>{isWished ? 'Wished' : 'Wish'}</span>
                            </button>

                            <button
                              onClick={() => handleRemoveRow(c.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white transition-all flex items-center space-x-1 shadow-2xs"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>

                            <button
                              onClick={() => handleOpenAiModal(`${c.husbandName} & ${c.wifeName}`, 'Marriage Anniversary', c.husbandPhone || c.singlePhone)}
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 border border-purple-200 hover:border-purple-300 transition-colors"
                              title="Generate AI Krishna Conscious Blessing"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Heart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600 text-sm">No marriage anniversaries match current filters.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try clicking "Clear Filters" or selecting another month.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Bulk Create Parcel Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Bulk Create Prasadam Parcels</h3>
                  <p className="text-xs text-slate-500">
                    Creating dispatches for {selectedDevoteeIds.length} selected {dashboardMode === 'birthday' ? 'devotees' : 'couples'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Parcel Contents / Type
                </label>
                <select
                  value={bulkParcelType}
                  onChange={(e) => setBulkParcelType(e.target.value as ParcelDispatch['parcel_type'])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="PRASADAM">Maha Prasadam & Sweets Box</option>
                  <option value="DEVOTIONAL_BOOKS">Srila Prabhupada Books Set</option>
                  <option value="FESTIVAL_GIFTS">Festival Gift Hamper</option>
                  <option value="DEITY_PARAPHERNALIA">Deity Puja & Champa Oil Box</option>
                  <option value="DHOTI_KURTA_SAREE">Devotional Attire (Dhoti / Saree)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Courier Service
                </label>
                <select
                  value={bulkCourier}
                  onChange={(e) => setBulkCourier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Delhivery Courier">Delhivery Courier (Surface / Air)</option>
                  <option value="Speed Post">India Speed Post</option>
                  <option value="Self Mode">Self Mode (Handover at Temple)</option>
                  <option value="DTDC Courier">DTDC Express</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Package Notes & Blessing Card
                </label>
                <input
                  type="text"
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="e.g. Maha Prasadam & Birthday Blessings Box"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 text-[11px] leading-relaxed">
                ✅ Once created, each parcel will receive a tracking number and immediately populate the <strong>Parcel Department</strong> roster and live admin dashboard!
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkCreateParcel}
                className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Create {selectedDevoteeIds.length} Dispatches</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: AI Vaishnava Blessing Generator */}
      {isAiModalOpen && aiSelectedDevotee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Personalized Vaishnava Greeting
                  </h3>
                  <p className="text-xs text-slate-500">
                    For {aiSelectedDevotee.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language tabs */}
            <div className="flex space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => { setAiMessageTab('formal'); setCopiedAiMessage(false); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  aiMessageTab === 'formal' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Vedic Blessing
              </button>
              <button
                onClick={() => { setAiMessageTab('sweet'); setCopiedAiMessage(false); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  aiMessageTab === 'sweet' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Sweet Devotional
              </button>
              <button
                onClick={() => { setAiMessageTab('bengali'); setCopiedAiMessage(false); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  aiMessageTab === 'bengali' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                বাংলা (Bengali)
              </button>
            </div>

            {/* Message Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line select-text">
              {getAiMessage()}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getAiMessage());
                  setCopiedAiMessage(true);
                  setTimeout(() => setCopiedAiMessage(false), 2500);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex items-center space-x-1.5"
              >
                {copiedAiMessage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (aiSelectedDevotee.phone) {
                    const cleanPhone = aiSelectedDevotee.phone.replace(/[^0-9]/g, '');
                    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(getAiMessage())}`;
                    window.open(url, '_blank');
                  } else {
                    alert('No phone number on record for this devotee.');
                  }
                }}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send via WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
