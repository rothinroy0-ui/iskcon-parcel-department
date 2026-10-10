import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { INITIAL_DEPARTMENTS, INITIAL_DEVOTEES, INITIAL_PARCEL_DISPATCHES, INITIAL_SETTINGS } from './mockData';

// Retrieve credentials from environment or localStorage overrides
export const getSupabaseConfig = () => {
  const customUrl = localStorage.getItem('iskcon_supabase_url');
  const customKey = localStorage.getItem('iskcon_supabase_anon_key');

  const url = customUrl || import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = customKey || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

  return {
    url,
    key,
    isConfigured: Boolean(url && key && url.startsWith('http') && !url.includes('placeholder') && !url.includes('your-project')),
  };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('iskcon_supabase_url', url.trim());
  localStorage.setItem('iskcon_supabase_anon_key', key.trim());
  clientInstance = null; // reset cached client
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('iskcon_supabase_url');
  localStorage.removeItem('iskcon_supabase_anon_key');
  clientInstance = null;
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(config.url, config.key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return clientInstance;
};

export const testSupabaseConnection = async (
  url: string, 
  key: string
): Promise<{ success: boolean; message: string; tablesExist: boolean }> => {
  try {
    const testClient = createClient(url, key);
    
    const isMissingTable = (err: any) => {
      if (!err) return false;
      const msg = (err.message || '').toLowerCase();
      return (
        err.code === 'PGRST205' ||
        msg.includes('relation') ||
        msg.includes('does not exist') ||
        msg.includes('schema cache') ||
        msg.includes('not found')
      );
    };

    // Test tables
    const { error: devError } = await testClient.from('devotees').select('*').limit(1);
    const { error: deptError } = await testClient.from('departments').select('id').limit(1);

    if (isMissingTable(devError) || isMissingTable(deptError)) {
      return {
        success: true,
        tablesExist: false,
        message: 'Connected to Supabase! However, database tables have not been created yet. Run the SQL schema from the Architecture tab or Supabase SQL Editor.',
      };
    }

    if (devError) {
      return { success: false, tablesExist: false, message: `Supabase Error: ${devError.message}` };
    }
    if (deptError) {
      return { success: false, tablesExist: false, message: `Supabase Error: ${deptError.message}` };
    }

    return { 
      success: true, 
      tablesExist: true, 
      message: 'Successfully connected to live Supabase PostgreSQL database!' 
    };
  } catch (err: any) {
    return { success: false, tablesExist: false, message: err.message || 'Connection failed' };
  }
};

// Seed initial data into Supabase if empty
export const seedSupabaseDatabase = async (client: SupabaseClient): Promise<{ success: boolean; count: number; message: string }> => {
  try {
    // 1. Check departments
    const { data: existingDepts } = await client.from('departments').select('id').limit(1);
    if (!existingDepts || existingDepts.length === 0) {
      await client.from('departments').insert(
        INITIAL_DEPARTMENTS.map((d) => ({
          name: d.name,
          code: d.code,
          description: d.description,
          head_devotee: d.head_devotee,
          head_phone: d.head_phone,
        }))
      );
    }

    // 2. Check devotees
    const { data: existingDevotees } = await client.from('devotees').select('*').limit(1);
    let seededDevoteesCount = 0;
    if (!existingDevotees || existingDevotees.length === 0) {
      const { data: depts } = await client.from('departments').select('id, name');
      const deptMap: Record<string, string> = {};
      (depts || []).forEach((d: any) => {
        deptMap[d.name] = d.id;
      });

      const devoteePayload = INITIAL_DEVOTEES.map((d) => ({
        spiritual_name: d.spiritual_name,
        legal_name: d.legal_name,
        initiation_status: d.initiation_status,
        diksha_guru: d.diksha_guru,
        gender: d.gender,
        date_of_birth: d.date_of_birth,
        initiation_date: d.initiation_date || null,
        marriage_anniversary: d.marriage_anniversary || null,
        phone: d.phone,
        email: d.email || null,
        address: d.address,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
        counselor_name: d.counselor_name,
        primary_seva: d.primary_seva,
        notes: d.notes,
        status: d.status,
      }));

      const { data: inserted, error: insertErr } = await client.from('devotees').insert(devoteePayload).select();
      if (insertErr) {
        console.warn('Devotee seed error:', insertErr);
      } else {
        seededDevoteesCount = inserted?.length || 0;
      }
    }

    // 3. Check parcel dispatches
    const { data: existingParcels } = await client.from('parcel_dispatches').select('id').limit(1);
    if (!existingParcels || existingParcels.length === 0) {
      await client.from('parcel_dispatches').insert(
        INITIAL_PARCEL_DISPATCHES.map((p) => ({
          parcel_type: p.parcel_type,
          tracking_number: p.tracking_number,
          courier_service: p.courier_service,
          dispatch_date: p.dispatch_date,
          status: p.status,
          destination_city: p.destination_city,
          dispatched_by: p.dispatched_by,
          notes: p.notes,
        }))
      );
    }

    return { 
      success: true, 
      count: seededDevoteesCount, 
      message: `Database populated with ${seededDevoteesCount || 'sample'} devotee records & departments in Supabase!` 
    };
  } catch (err: any) {
    return { success: false, count: 0, message: err.message || 'Seeding failed' };
  }
};
