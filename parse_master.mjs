import fs from 'fs';

const filePath = 'C:\\Users\\HARE KRISHNA\\Downloads\\DEVOTEE CARE PORTAL - MASTER SHEET (4).csv';
const content = fs.readFileSync(filePath, 'utf8');

// Basic CSV parse handling quotes
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

const rows = parseCSV(content);
const header = rows[0].map(h => h.trim());
console.log('HEADER COLUMNS:', header);
console.log('TOTAL ROWS:', rows.length);

const devotees = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const obj = {};
  header.forEach((h, idx) => {
    obj[h] = (r[idx] || '').trim();
  });
  if (obj['NAME'] || obj['INITIATED NAME'] || obj['DEVOTEE ID']) {
    devotees.push(obj);
  }
}

console.log('TOTAL VALID DEVOTEES IN CSV:', devotees.length);
console.log('ROW 1:', devotees[0]);
console.log('ROW 418:', devotees[417]);
console.log('ROW 419:', devotees[418]);
console.log('LAST ROW (e.g. around 824):', devotees[devotees.length - 1]);
