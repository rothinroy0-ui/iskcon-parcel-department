import fs from 'fs';

const filePath = 'C:\\Users\\HARE KRISHNA\\Downloads\\DEVOTEE CARE PORTAL - MASTER SHEET (4).csv';
const content = fs.readFileSync(filePath, 'utf8');

function parseCSV(text) {
  const lines = [];
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
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') lines.push(row);
  return lines;
}

const MONTHS = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

function parseRawDate(str) {
  if (!str || typeof str !== 'string' || str.trim() === '' || str.includes('null')) return '';
  const trimmed = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const d1 = trimmed.match(/^(\d{1,2})-([A-Za-z]+)-(\d{2,4})$/);
  if (d1) {
    const day = d1[1].padStart(2, '0');
    const m = MONTHS[d1[2].toLowerCase()] || '01';
    let yr = d1[3];
    if (yr.length === 2) yr = (Number(yr) > 30 ? '19' : '20') + yr;
    return `${yr}-${m}-${day}`;
  }

  const d2 = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/);
  if (d2) {
    const day = d2[1].padStart(2, '0');
    const m = MONTHS[d2[2].toLowerCase()] || '01';
    return `${d2[3]}-${m}-${day}`;
  }

  const p = new Date(trimmed.replace(',', ''));
  if (!isNaN(p.getTime())) {
    const y = p.getFullYear();
    const m = String(p.getMonth() + 1).padStart(2, '0');
    const d = String(p.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

const rows = parseCSV(content);
const header = rows[0].map(h => h.trim());

const allDevotees = [];

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const obj = {};
  header.forEach((h, idx) => {
    obj[h] = (r[idx] || '').trim();
  });

  const legal = obj['NAME'] || '';
  const spiritual = obj['INITIATED NAME'] || '';
  const devoteeId = obj['DEVOTEE ID'] || `ISKCON_DGP_${String(i).padStart(3, '0')}`;
  const phone = obj['CONTACT NO'] || '';
  const address = obj['ADDRESS'] || '';
  const city = obj['CITY'] || 'Durgapur';
  const state = obj['STATE'] || 'West Bengal';
  const pincode = obj['PIN CODE'] || '';
  const photo = obj['PHOTO'] || '';
  const spouse = obj['SPOUSE NAME'] || '';
  const dob = parseRawDate(obj['BIRTHDAY']);
  const anniv = parseRawDate(obj['ANNIVERSARY']);

  if (legal || spiritual) {
    allDevotees.push({
      id: devoteeId,
      spiritual_name: spiritual,
      legal_name: legal || spiritual,
      initiation_status: spiritual ? 'FIRST_DIKSHA' : 'UNINITIATED',
      gender: (spiritual.toLowerCase().includes('debi dasi') || spiritual.toLowerCase().includes('devi dasi')) ? 'FEMALE' : 'MALE',
      date_of_birth: dob || '1990-01-01',
      marriage_anniversary: anniv || '',
      phone,
      address,
      city,
      state,
      pincode,
      photo_url: photo,
      spouse_name: spouse,
      primary_seva: 'Congregation',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

console.log('Processed all devotees:', allDevotees.length);
if (!fs.existsSync('./src/data')) {
  fs.mkdirSync('./src/data', { recursive: true });
}
fs.writeFileSync('./src/data/allDevotees.json', JSON.stringify(allDevotees, null, 2));
console.log('Saved to ./src/data/allDevotees.json successfully!');
