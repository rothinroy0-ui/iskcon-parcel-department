import { createClient } from '@supabase/supabase-js';

const url = 'https://nghiqkgdrqxupxxrrlwb.supabase.co';
const key = 'sb_publishable_0l8tLvM3KaaXwpdfre-n2g_3uYUpNhy';

const client = createClient(url, key);

async function inspect() {
  const { data, count, error } = await client.from('devotees').select('*');
  console.log('Total returned:', data?.length);
  if (data && data.length > 0) {
    console.log('FIRST ROW:', data[0]['SL NO'], data[0]['DEVOTEE ID'], data[0].NAME);
    console.log('ROW 200:', data[199]?.['SL NO'], data[199]?.['DEVOTEE ID'], data[199]?.NAME);
    console.log('LAST ROW (418):', data[data.length - 1]['SL NO'], data[data.length - 1]['DEVOTEE ID'], data[data.length - 1].NAME);

    // Let's check the highest SL NO present in the array
    const maxSl = Math.max(...data.map(d => Number(d['SL NO']) || 0));
    console.log('HIGHEST SL NO IN TABLE =', maxSl);

    // Let's check highest DEVOTEE ID number
    const ids = data.map(d => d['DEVOTEE ID']).filter(Boolean);
    console.log('LAST DEVOTEE IDs:', ids.slice(-5));
  }
}

inspect();
