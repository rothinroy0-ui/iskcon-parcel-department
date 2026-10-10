import fs from 'fs';

const inputPath = 'C:\\Users\\HARE KRISHNA\\Downloads\\DEVOTEE CARE PORTAL - MASTER SHEET (4).csv';
const outputPathAll = 'C:\\Users\\HARE KRISHNA\\Downloads\\DEVOTEES_ALL_824_CLEAN.csv';
const outputPathMissing = 'C:\\Users\\HARE KRISHNA\\Downloads\\DEVOTEES_REMAINING_419_TO_824.csv';
const outputJson = './src/data/allDevotees.json';

const content = fs.readFileSync(inputPath, 'utf8');

// Robust CSV parser handling multiline quotes
function parseCSV(text) {
  const rows = [];
  let row = [''];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      rows.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows;
}

const rawRows = parseCSV(content);
const rawHeader = rawRows[0].map(h => h.trim());

// Clean every cell by stripping internal newlines
function sanitizeCell(val) {
  if (!val) return '';
  return val.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const allCleanRows = [];
const missingRows = [];
const allDevoteesJson = [];

allCleanRows.push(rawHeader);
missingRows.push(rawHeader);

let devoteeCount = 0;

for (let i = 1; i < rawRows.length; i++) {
  const r = rawRows[i];
  const obj = {};
  rawHeader.forEach((h, idx) => {
    obj[h] = sanitizeCell(r[idx]);
  });

  if (obj['NAME'] || obj['INITIATED NAME'] || obj['DEVOTEE ID']) {
    devoteeCount++;
    const cleanRowArray = rawHeader.map(h => obj[h]);
    allCleanRows.push(cleanRowArray);

    if (devoteeCount >= 419) {
      missingRows.push(cleanRowArray);
    }

    allDevoteesJson.push({
      id: obj['DEVOTEE ID'] || `ISKCON_DGP_${String(devoteeCount).padStart(3, '0')}`,
      spiritual_name: obj['INITIATED NAME'] || '',
      legal_name: obj['NAME'] || obj['INITIATED NAME'],
      initiation_status: obj['INITIATED NAME'] ? 'FIRST_DIKSHA' : 'UNINITIATED',
      gender: (obj['INITIATED NAME'] || '').toLowerCase().includes('dasi') ? 'FEMALE' : 'MALE',
      date_of_birth: obj['BIRTHDAY'] || '',
      marriage_anniversary: obj['ANNIVERSARY'] || '',
      phone: obj['CONTACT NO'] || '',
      address: obj['ADDRESS'] || '',
      city: obj['CITY'] || 'Durgapur',
      state: obj['STATE'] || 'West Bengal',
      pincode: obj['PIN CODE'] || '',
      photo_url: obj['PHOTO'] || '',
      spouse_name: obj['SPOUSE NAME'] || '',
      primary_seva: 'Congregation',
      status: 'ACTIVE',
    });
  }
}

// Convert rows back to CSV with proper quote escaping
function toCSV(rows) {
  return rows.map(r => r.map(val => {
    const s = String(val || '');
    if (s.includes(',') || s.includes('"')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }).join(',')).join('\r\n');
}

// 1. Write DEVOTEES_ALL_824_CLEAN.csv
fs.writeFileSync(outputPathAll, toCSV(allCleanRows), 'utf8');
console.log(`Saved ${allCleanRows.length - 1} records to ${outputPathAll}`);

// 2. Write DEVOTEES_REMAINING_419_TO_824.csv
fs.writeFileSync(outputPathMissing, toCSV(missingRows), 'utf8');
console.log(`Saved ${missingRows.length - 1} missing records to ${outputPathMissing}`);

// 3. Save JSON in app data
if (!fs.existsSync('./src/data')) {
  fs.mkdirSync('./src/data', { recursive: true });
}
fs.writeFileSync(outputJson, JSON.stringify(allDevoteesJson, null, 2), 'utf8');
console.log(`Saved ${allDevoteesJson.length} devotees to ${outputJson}`);
