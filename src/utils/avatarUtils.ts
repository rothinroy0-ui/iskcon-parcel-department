/**
 * Avatar & Photo normalization utilities for ISKCON Devotee Directory
 */

const DEVOTEE_PALETTE_HEX = [
  'ea580c', // Saffron / Orange
  '059669', // Vrindavan Emerald
  '0284c7', // Sri Krishna Peacock Blue
  'e11d48', // Radha Rani Rose
  '7c3aed', // Royal Vaishnava Purple
  'd97706', // Mandir Amber
  '0d9488', // Tulasi Teal
  '4f46e5', // Deep Indigo
];

const DEVOTEE_GRADIENTS = [
  { gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  { gradient: 'from-sky-500 to-blue-600', bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300' },
  { gradient: 'from-rose-500 to-pink-600', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  { gradient: 'from-purple-500 to-indigo-600', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  { gradient: 'from-orange-500 to-amber-600', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
];

/**
 * Hash string deterministically to an integer index
 */
export const hashString = (str: string = ''): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
};

/**
 * Extract 2-letter uppercase initials from devotee name
 */
export const getDevoteeInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'DK';
  const clean = name.replace(/^(HG|HH|His Grace|His Holiness|Bhakta|Bhakti)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/**
 * Get deterministic gradient styling for devotee
 */
export const getDevoteeColorStyle = (nameOrId?: string) => {
  const hash = hashString(nameOrId || 'devotee');
  return DEVOTEE_GRADIENTS[hash % DEVOTEE_GRADIENTS.length];
};

/**
 * Generate fallback SVG or UI-Avatars URL
 */
export const generateDevoteeAvatarUrl = (name?: string, id?: string): string => {
  const hash = hashString(id || name || 'ISKCON');
  const hex = DEVOTEE_PALETTE_HEX[hash % DEVOTEE_PALETTE_HEX.length];
  const cleanName = encodeURIComponent((name || 'Devotee').trim().slice(0, 25));
  return `https://ui-avatars.com/api/?name=${cleanName}&background=${hex}&color=fff&size=256&bold=true`;
};

/**
 * Convert any Google Drive view/open link to a direct, browser-renderable image thumbnail
 */
export const getDirectPhotoUrl = (url?: string, name?: string, id?: string): string => {
  if (!url || !url.trim()) {
    return generateDevoteeAvatarUrl(name, id);
  }

  const trimmed = url.trim();

  // If already a direct lh3 googleusercontent link or ui-avatars/unsplash
  if (trimmed.includes('googleusercontent.com') || trimmed.includes('ui-avatars.com') || trimmed.includes('unsplash.com')) {
    return trimmed;
  }

  // Extract Google Drive File ID
  const driveMatch = 
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/file\/d\/([a-zA-Z0-9_-]+)/);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}=w300`;
  }

  return trimmed;
};
