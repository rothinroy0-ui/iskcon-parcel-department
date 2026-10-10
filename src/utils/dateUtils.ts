import { Devotee } from '../types';

const MONTHS: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

export const parseRawDate = (str?: string | null): string => {
  if (!str || typeof str !== 'string' || str.trim() === '' || str.includes('null')) return '';
  const trimmed = str.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // e.g. "22-Feb-1985" or "22-Feb-85"
  const dashMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]+)-(\d{2,4})$/);
  if (dashMatch) {
    const day = dashMatch[1].padStart(2, '0');
    const m = MONTHS[dashMatch[2].toLowerCase()] || '01';
    let yr = dashMatch[3];
    if (yr.length === 2) yr = (Number(yr) > 30 ? '19' : '20') + yr;
    return `${yr}-${m}-${day}`;
  }

  // e.g. "24 July, 1969" or "24 July 1969"
  const spaceMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/);
  if (spaceMatch) {
    const day = spaceMatch[1].padStart(2, '0');
    const m = MONTHS[spaceMatch[2].toLowerCase()] || '01';
    const yr = spaceMatch[3];
    return `${yr}-${m}-${day}`;
  }

  // Fallback to JS Date
  const parsed = new Date(trimmed.replace(',', ''));
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
};

export interface CelebrationItem {
  devotee: Devotee;
  type: 'BIRTHDAY' | 'MARRIAGE_ANNIVERSARY' | 'INITIATION_ANNIVERSARY';
  dateStr: string; // MM-DD
  fullDate: string; // YYYY-MM-DD
  daysUntil: number;
  yearsCount?: number;
  isToday: boolean;
}

export const getCelebrations = (devotees: Devotee[], referenceDate = new Date()) => {
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  const items: CelebrationItem[] = [];

  devotees.forEach((dev) => {
    // 1. Birthday
    const dob = dev.date_of_birth ? parseRawDate(dev.date_of_birth) : '';
    if (dob) {
      const [year, month, day] = dob.split('-').map(Number);
      if (month && day) {
        const isToday = month === refMonth + 1 && day === refDay;
        const celebrationThisYear = new Date(referenceDate.getFullYear(), month - 1, day);
        let diffMs = celebrationThisYear.getTime() - referenceDate.getTime();
        let daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (daysUntil < 0) {
          const celebrationNextYear = new Date(referenceDate.getFullYear() + 1, month - 1, day);
          daysUntil = Math.round((celebrationNextYear.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        const yearsCount = referenceDate.getFullYear() - year;

        items.push({
          devotee: dev,
          type: 'BIRTHDAY',
          dateStr: `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          fullDate: dob,
          daysUntil: isToday ? 0 : daysUntil,
          yearsCount: yearsCount > 0 ? yearsCount : undefined,
          isToday,
        });
      }
    }

    // 2. Marriage Anniversary
    const anniv = dev.marriage_anniversary ? parseRawDate(dev.marriage_anniversary) : '';
    if (anniv) {
      const [year, month, day] = anniv.split('-').map(Number);
      if (month && day) {
        const isToday = month === refMonth + 1 && day === refDay;
        const celebrationThisYear = new Date(referenceDate.getFullYear(), month - 1, day);
        let diffMs = celebrationThisYear.getTime() - referenceDate.getTime();
        let daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (daysUntil < 0) {
          const celebrationNextYear = new Date(referenceDate.getFullYear() + 1, month - 1, day);
          daysUntil = Math.round((celebrationNextYear.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        const yearsCount = referenceDate.getFullYear() - year;

        items.push({
          devotee: dev,
          type: 'MARRIAGE_ANNIVERSARY',
          dateStr: `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          fullDate: anniv,
          daysUntil: isToday ? 0 : daysUntil,
          yearsCount: yearsCount > 0 ? yearsCount : undefined,
          isToday,
        });
      }
    }

    // 3. Initiation Anniversary
    const initDate = dev.initiation_date ? parseRawDate(dev.initiation_date) : '';
    if (initDate) {
      const [year, month, day] = initDate.split('-').map(Number);
      if (month && day) {
        const isToday = month === refMonth + 1 && day === refDay;
        const celebrationThisYear = new Date(referenceDate.getFullYear(), month - 1, day);
        let diffMs = celebrationThisYear.getTime() - referenceDate.getTime();
        let daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (daysUntil < 0) {
          const celebrationNextYear = new Date(referenceDate.getFullYear() + 1, month - 1, day);
          daysUntil = Math.round((celebrationNextYear.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        const yearsCount = referenceDate.getFullYear() - year;

        items.push({
          devotee: dev,
          type: 'INITIATION_ANNIVERSARY',
          dateStr: `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          fullDate: initDate,
          daysUntil: isToday ? 0 : daysUntil,
          yearsCount: yearsCount > 0 ? yearsCount : undefined,
          isToday,
        });
      }
    }
  });

  return items.sort((a, b) => a.daysUntil - b.daysUntil);
};
