import fs from 'fs';

const files = [
  'C:\\Users\\HARE KRISHNA\\Downloads\\DEVOTEE CARE PORTAL - MASTER SHEET.csv',
  'C:\\Users\\HARE KRISHNA\\Downloads\\DEVOTEE CARE PORTAL - MASTER SHEET (1).csv',
  'C:\\Users\\HARE KRISHNA\\Downloads\\DEVOTEE CARE PORTAL - MASTER SHEET (2).csv',
  'C:\\Users\\HARE KRISHNA\\Downloads\\DEVOTEE CARE PORTAL - MASTER SHEET (3).csv',
  'C:\\Users\\HARE KRISHNA\\Downloads\\DEVOTEE CARE PORTAL - MASTER SHEET (4).csv',
];

for (const f of files) {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const header = lines[0];
    
    // Count rows with a devotee name
    let validCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length > 2 && (parts[1]?.trim() || parts[2]?.trim() || parts[3]?.trim())) {
        validCount++;
      }
    }
    console.log(`File: ${f}`);
    console.log(`  Total lines: ${lines.length}, Header: ${header.slice(0, 80)}...`);
    console.log(`  Valid records count: ${validCount}`);
  }
}
