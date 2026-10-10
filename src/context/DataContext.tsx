import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Devotee, 
  Department, 
  AuditLog, 
  CareInteraction, 
  ParcelDispatch, 
  PortalSettings,
  AuditAction 
} from '../types';
import { 
  INITIAL_DEVOTEES, 
  INITIAL_DEPARTMENTS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_CARE_INTERACTIONS, 
  INITIAL_PARCEL_DISPATCHES, 
  INITIAL_SETTINGS 
} from '../lib/mockData';
import { useAuth } from './AuthContext';
import { getSupabaseClient, getSupabaseConfig, seedSupabaseDatabase } from '../lib/supabase';
import { parseRawDate } from '../utils/dateUtils';
import { getDirectPhotoUrl } from '../utils/avatarUtils';
import masterDevotees from '../data/allDevotees.json';

// Helper to normalize Supabase row (supporting both custom columns and standard schema)
export const normalizeDevoteeRow = (row: any): Devotee => {
  const spiritual = (row['INITIATED NAME'] || row.spiritual_name || '').trim();
  const legal = (row['NAME'] || row.legal_name || 'Devotee').trim();
  const phone = (row['CONTACT NO'] || row.phone || '').trim();
  const dob = parseRawDate(row.BIRTHDAY || row.date_of_birth);
  const anniv = parseRawDate(row.ANNIVERSARY || row.marriage_anniversary);
  const address = (row.ADDRESS || row.address || '').trim();
  const city = (row.CITY || row.city || '').trim();
  const state = (row.STATE || row.state || '').trim();
  const pincode = String(row['PIN CODE'] || row.pincode || '').trim();
  const spouse = (row['SPOUSE NAME'] || row.spouse_name || '').trim();
  const id = String(row['DEVOTEE ID'] || row.id || `dev-${row['SL NO'] || Date.now()}`);
  const rawPhoto = row.PHOTO || row.photo_url || '';
  const photo = getDirectPhotoUrl(rawPhoto, spiritual || legal, id);

  return {
    id,
    spiritual_name: spiritual,
    legal_name: legal,
    initiation_status: spiritual ? 'FIRST_DIKSHA' : (row.initiation_status || 'UNINITIATED'),
    diksha_guru: row.diksha_guru || '',
    gender: (row.gender as any) || (spiritual.toLowerCase().includes('debi dasi') || spiritual.toLowerCase().includes('devi dasi') ? 'FEMALE' : 'MALE'),
    date_of_birth: dob || '1990-01-01',
    initiation_date: row.initiation_date || '',
    marriage_anniversary: anniv || '',
    phone,
    email: row.email || '',
    address,
    city: city || 'Durgapur',
    state: state || 'West Bengal',
    pincode,
    photo_url: photo,
    spouse_name: spouse,
    counselor_name: row.counselor_name || '',
    department_id: row.department_id || '',
    department_name: row.department_name || '',
    primary_seva: row.primary_seva || 'Congregation',
    skills: row.skills || [],
    notes: row.notes || '',
    status: row.status || 'ACTIVE',
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    created_by: row.created_by || '',
    updated_by: row.updated_by || '',
  };
};

// Purge any legacy demo mock records from localStorage immediately
const purgeLegacyDemoRecords = () => {
  try {
    const cachedDevotees = localStorage.getItem('iskcon_devotees');
    if (cachedDevotees && cachedDevotees.includes('dev-001')) {
      localStorage.removeItem('iskcon_devotees');
      localStorage.removeItem('iskcon_audit_logs');
      localStorage.removeItem('iskcon_care_interactions');
      localStorage.removeItem('iskcon_parcel_dispatches');
    }
  } catch (e) {
    // ignore
  }
};
purgeLegacyDemoRecords();

interface DataContextType {
  devotees: Devotee[];
  departments: Department[];
  auditLogs: AuditLog[];
  careInteractions: CareInteraction[];
  parcelDispatches: ParcelDispatch[];
  settings: PortalSettings;
  isLiveSupabase: boolean;
  isLoadingLive: boolean;
  addDevotee: (devoteeData: Omit<Devotee, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; message: string }>;
  updateDevotee: (id: string, updates: Partial<Devotee>) => Promise<{ success: boolean; message: string }>;
  deleteDevotee: (id: string) => Promise<{ success: boolean; message: string }>;
  logCareInteraction: (interaction: Omit<CareInteraction, 'id' | 'created_at'>) => Promise<{ success: boolean; message: string }>;
  addParcelDispatch: (dispatch: Omit<ParcelDispatch, 'id'>) => Promise<{ success: boolean; message: string }>;
  updateParcelStatus: (id: string, newStatus: ParcelDispatch['status']) => Promise<{ success: boolean; message: string }>;
  deleteParcelDispatch: (id: string) => Promise<{ success: boolean; message: string }>;
  deleteMultipleParcelDispatches: (ids: string[]) => Promise<{ success: boolean; message: string }>;
  updateParcelDispatch: (id: string, updates: Partial<ParcelDispatch>) => Promise<{ success: boolean; message: string }>;
  birthdayRemovals: string[];
  anniversaryRemovals: string[];
  removeBirthdayRecord: (id: string) => void;
  restoreBirthdayRecord: (id: string) => void;
  restoreAllBirthdayRecords: () => void;
  removeAnniversaryRecord: (id: string) => void;
  restoreAnniversaryRecord: (id: string) => void;
  restoreAllAnniversaryRecords: () => void;
  updateSettings: (newSettings: Partial<PortalSettings>) => Promise<{ success: boolean; message: string }>;
  exportDevoteesCSV: () => void;
  exportAuditLogsCSV: () => void;
  resetToSampleData: () => void;
  refreshData: () => Promise<void>;
  seedLiveDatabase: () => Promise<{ success: boolean; message: string }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, canEditDevotees, canDeleteDevotees, canManageSettings, isViewer } = useAuth();
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(() => getSupabaseConfig().isConfigured);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);

  // Core state collections (initialized with all 824 devotees)
  const [devotees, setDevotees] = useState<Devotee[]>(() => {
    return masterDevotees as Devotee[];
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('iskcon_departments');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('iskcon_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [careInteractions, setCareInteractions] = useState<CareInteraction[]>(() => {
    const saved = localStorage.getItem('iskcon_care_interactions');
    return saved ? JSON.parse(saved) : INITIAL_CARE_INTERACTIONS;
  });

  const [parcelDispatches, setParcelDispatches] = useState<ParcelDispatch[]>(() => {
    const saved = localStorage.getItem('iskcon_parcel_dispatches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_PARCEL_DISPATCHES;
  });

  const [settings, setSettings] = useState<PortalSettings>(() => {
    const saved = localStorage.getItem('iskcon_portal_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Soft-removed records for Birthday and Anniversary lists
  const [birthdayRemovals, setBirthdayRemovals] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('iskcon_birthday_removals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [anniversaryRemovals, setAnniversaryRemovals] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('iskcon_anniversary_removals');
      return saved ? JSON.parse(saved) : ['ISKCON_DGP_436'];
    } catch {
      return ['ISKCON_DGP_436'];
    }
  });

  const removeBirthdayRecord = (id: string) => {
    setBirthdayRemovals((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('iskcon_birthday_removals', JSON.stringify(updated));
      return updated;
    });
  };

  const restoreBirthdayRecord = (id: string) => {
    setBirthdayRemovals((prev) => {
      const updated = prev.filter((item) => item !== id);
      localStorage.setItem('iskcon_birthday_removals', JSON.stringify(updated));
      return updated;
    });
  };

  const restoreAllBirthdayRecords = () => {
    setBirthdayRemovals([]);
    localStorage.setItem('iskcon_birthday_removals', JSON.stringify([]));
  };

  const removeAnniversaryRecord = (id: string) => {
    setAnniversaryRemovals((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('iskcon_anniversary_removals', JSON.stringify(updated));
      return updated;
    });
  };

  const restoreAnniversaryRecord = (id: string) => {
    setAnniversaryRemovals((prev) => {
      const updated = prev.filter((item) => item !== id);
      localStorage.setItem('iskcon_anniversary_removals', JSON.stringify(updated));
      return updated;
    });
  };

  const restoreAllAnniversaryRecords = () => {
    setAnniversaryRemovals([]);
    localStorage.setItem('iskcon_anniversary_removals', JSON.stringify([]));
  };

  // Fetch live data from Supabase
  const fetchLiveSupabaseData = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setIsLiveSupabase(false);
      return;
    }

    setIsLoadingLive(true);
    try {
      // 1. Devotees: Fetch live rows and merge with master 824 records
      const { data: dbDevotees, error: devErr } = await client.from('devotees').select('*');
      if (!devErr && dbDevotees && dbDevotees.length > 0) {
        const dbNormalized = dbDevotees.map(normalizeDevoteeRow);
        const dbMap = new Map<string, Devotee>();
        dbNormalized.forEach((d) => dbMap.set(d.id, d));

        const fullRoster = (masterDevotees as Devotee[]).map((m) => {
          return dbMap.get(m.id) || m;
        });

        setDevotees(fullRoster);
        localStorage.setItem('iskcon_devotees', JSON.stringify(fullRoster));
      } else {
        setDevotees(masterDevotees as Devotee[]);
      }

      // 2. Departments
      const { data: dbDepts, error: deptErr } = await client.from('departments').select('*');
      if (!deptErr && dbDepts && dbDepts.length > 0) {
        setDepartments(dbDepts as Department[]);
      }

      // 3. Audit Logs
      const { data: dbLogs, error: logErr } = await client.from('audit_logs').select('*').order('timestamp', { ascending: false });
      if (!logErr && dbLogs) {
        setAuditLogs(dbLogs as AuditLog[]);
      }

      // 4. Care Interactions
      const { data: dbCare, error: careErr } = await client.from('care_interactions').select('*').order('created_at', { ascending: false });
      if (!careErr && dbCare) {
        setCareInteractions(dbCare as CareInteraction[]);
      }

      // 5. Parcels
      const { data: dbParcels, error: parErr } = await client.from('parcel_dispatches').select('*').order('created_at', { ascending: false });
      if (!parErr && dbParcels) {
        setParcelDispatches(dbParcels as ParcelDispatch[]);
      }

      setIsLiveSupabase(true);
    } catch (e) {
      console.warn('Error fetching live Supabase data:', e);
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  // Initial load & realtime subscriptions
  useEffect(() => {
    const config = getSupabaseConfig();
    if (config.isConfigured) {
      fetchLiveSupabaseData();

      // Realtime subscription
      const client = getSupabaseClient();
      if (client) {
        const channel = client
          .channel('iskcon_portal_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'devotees' }, () => {
            client.from('devotees').select('*').then(({ data }) => {
              if (data) {
                const normalized = data.map(normalizeDevoteeRow);
                setDevotees(normalized);
              }
            });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
            client.from('audit_logs').select('*').order('timestamp', { ascending: false }).then(({ data }) => {
              if (data) setAuditLogs(data as AuditLog[]);
            });
          })
          .subscribe();

        return () => {
          client.removeChannel(channel);
        };
      }
    } else {
      setIsLiveSupabase(false);
    }
  }, [fetchLiveSupabaseData]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('iskcon_devotees', JSON.stringify(devotees));
    localStorage.setItem('iskcon_departments', JSON.stringify(departments));
    localStorage.setItem('iskcon_audit_logs', JSON.stringify(auditLogs));
    localStorage.setItem('iskcon_care_interactions', JSON.stringify(careInteractions));
    localStorage.setItem('iskcon_parcel_dispatches', JSON.stringify(parcelDispatches));
    localStorage.setItem('iskcon_portal_settings', JSON.stringify(settings));
    localStorage.setItem('iskcon_birthday_removals', JSON.stringify(birthdayRemovals));
    localStorage.setItem('iskcon_anniversary_removals', JSON.stringify(anniversaryRemovals));
  }, [devotees, departments, auditLogs, careInteractions, parcelDispatches, settings, birthdayRemovals, anniversaryRemovals]);

  // Helper: Record audit log
  const recordAudit = async (
    action: AuditAction,
    entity_type: AuditLog['entity_type'],
    record_id: string | undefined,
    record_title: string,
    details: string,
    changes?: AuditLog['changes']
  ) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: currentUser.id,
      user_name: currentUser.spiritual_name || currentUser.full_name,
      user_role: currentUser.role,
      action,
      entity_type,
      record_id,
      record_title,
      details,
      changes,
      timestamp: new Date().toISOString(),
      ip_address: '192.168.1.' + Math.floor(Math.random() * 50 + 10),
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    const client = getSupabaseClient();
    if (client && isLiveSupabase) {
      try {
        await client.from('audit_logs').insert([{
          user_name: newLog.user_name,
          user_role: newLog.user_role,
          action: newLog.action,
          entity_type: newLog.entity_type,
          record_title: newLog.record_title,
          details: newLog.details,
          changes: newLog.changes,
        }]);
      } catch (err) {
        console.warn('Supabase audit insert error:', err);
      }
    }
  };

  // Add Devotee
  const addDevotee = async (devoteeData: Omit<Devotee, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string }> => {
    if (!canEditDevotees) {
      return { success: false, message: 'RLS Permission Denied: Your role does not have permission to register devotees.' };
    }

    const client = getSupabaseClient();
    if (client && isLiveSupabase) {
      try {
        const payload: Record<string, any> = {
          'SL NO': devotees.length + 1,
          'DEVOTEE ID': `ISKCON_DGP_${Date.now().toString().slice(-4)}`,
          NAME: devoteeData.legal_name,
          'INITIATED NAME': devoteeData.spiritual_name || null,
          'SPOUSE NAME': devoteeData.spouse_name || null,
          'CONTACT NO': devoteeData.phone || '',
          ADDRESS: devoteeData.address || '',
          CITY: devoteeData.city || '',
          STATE: devoteeData.state || '',
          'PIN CODE': devoteeData.pincode || '',
          BIRTHDAY: devoteeData.date_of_birth || '',
          ANNIVERSARY: devoteeData.marriage_anniversary || null,
          PHOTO: devoteeData.photo_url || null,
        };

        const { data, error } = await client.from('devotees').insert([payload]).select().single();
        if (error) {
          return { success: false, message: `Supabase Error: ${error.message}` };
        }

        if (data) {
          const norm = normalizeDevoteeRow(data);
          setDevotees((prev) => [norm, ...prev]);
        }
        return { success: true, message: `Successfully registered devotee in Supabase!` };
      } catch (err: any) {
        return { success: false, message: err.message || 'Supabase insert failed' };
      }
    }

    // Offline mode
    const now = new Date().toISOString();
    const newId = `dev-${Date.now()}`;
    const newDevotee: Devotee = {
      ...devoteeData,
      id: newId,
      created_at: now,
      updated_at: now,
      created_by: currentUser.spiritual_name || currentUser.full_name,
      updated_by: currentUser.spiritual_name || currentUser.full_name,
    };

    setDevotees((prev) => [newDevotee, ...prev]);

    const title = newDevotee.spiritual_name || newDevotee.legal_name;
    recordAudit('CREATE', 'devotee', newId, title, `Registered new devotee: ${title}`, [
      { field: 'name', old_value: null, new_value: title },
      { field: 'status', old_value: null, new_value: newDevotee.initiation_status },
      { field: 'phone', old_value: null, new_value: newDevotee.phone },
    ]);

    return { success: true, message: `Successfully registered devotee ${title}` };
  };

  // Update Devotee
  const updateDevotee = async (id: string, updates: Partial<Devotee>): Promise<{ success: boolean; message: string }> => {
    if (!canEditDevotees) {
      return { success: false, message: 'RLS Permission Denied: Role VIEWER cannot modify devotee records.' };
    }

    const target = devotees.find((d) => d.id === id);
    if (!target) {
      return { success: false, message: 'Devotee record not found.' };
    }

    const diffs: NonNullable<AuditLog['changes']> = [];
    (Object.keys(updates) as (keyof Devotee)[]).forEach((key) => {
      if (key !== 'updated_at' && key !== 'updated_by' && target[key] !== updates[key]) {
        diffs.push({
          field: String(key),
          old_value: target[key] ?? null,
          new_value: updates[key] ?? null,
        });
      }
    });

    const client = getSupabaseClient();
    if (client && isLiveSupabase) {
      try {
        const payload: Record<string, any> = {};

        if (updates.legal_name !== undefined) payload['NAME'] = updates.legal_name;
        if (updates.spiritual_name !== undefined) payload['INITIATED NAME'] = updates.spiritual_name;
        if (updates.spouse_name !== undefined) payload['SPOUSE NAME'] = updates.spouse_name;
        if (updates.phone !== undefined) payload['CONTACT NO'] = updates.phone;
        if (updates.address !== undefined) payload['ADDRESS'] = updates.address;
        if (updates.city !== undefined) payload['CITY'] = updates.city;
        if (updates.state !== undefined) payload['STATE'] = updates.state;
        if (updates.pincode !== undefined) payload['PIN CODE'] = updates.pincode;
        if (updates.date_of_birth !== undefined) payload['BIRTHDAY'] = updates.date_of_birth;
        if (updates.marriage_anniversary !== undefined) payload['ANNIVERSARY'] = updates.marriage_anniversary;
        if (updates.photo_url !== undefined) payload['PHOTO'] = updates.photo_url;

        let query = client.from('devotees').update(payload);
        let error = null;

        if (id.includes('ISKCON_')) {
          const res = await query.eq('DEVOTEE ID', id);
          error = res.error;
        } else if (target.spiritual_name) {
          const res = await query.eq('INITIATED NAME', target.spiritual_name);
          error = res.error;
        } else {
          const res = await query.eq('NAME', target.legal_name);
          error = res.error;
        }

        if (error) {
          return { success: false, message: `Supabase Update Error: ${error.message}` };
        }

        setDevotees((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d))
        );

        const title = updates.spiritual_name || updates.legal_name || target.spiritual_name || target.legal_name;
        recordAudit('UPDATE', 'devotee', id, title, `Updated devotee profile for ${title}`, diffs);

        return { success: true, message: `Successfully updated record in Supabase!` };
      } catch (err: any) {
        return { success: false, message: err.message || 'Supabase update failed' };
      }
    }

    // Offline mode
    const now = new Date().toISOString();
    const updatedRecord: Devotee = {
      ...target,
      ...updates,
      updated_at: now,
      updated_by: currentUser.spiritual_name || currentUser.full_name,
    };

    setDevotees((prev) => prev.map((d) => (d.id === id ? updatedRecord : d)));
    const title = updatedRecord.spiritual_name || updatedRecord.legal_name;
    const changedFields = diffs.map((d) => d.field).join(', ');

    recordAudit(
      'UPDATE',
      'devotee',
      id,
      title,
      `Updated ${title}'s record: changed [${changedFields || 'details'}]`,
      diffs
    );

    return { success: true, message: `Successfully updated ${title}` };
  };

  // Delete Devotee
  const deleteDevotee = async (id: string): Promise<{ success: boolean; message: string }> => {
    if (!canDeleteDevotees) {
      return { 
        success: false, 
        message: 'RLS Security Violation: Only ADMIN and SUPER_ADMIN roles can delete devotee records.' 
      };
    }

    const target = devotees.find((d) => d.id === id);
    if (!target) {
      return { success: false, message: 'Devotee record not found.' };
    }

    const client = getSupabaseClient();
    if (client && isLiveSupabase) {
      try {
        const { error } = id.includes('ISKCON_') 
          ? await client.from('devotees').delete().eq('DEVOTEE ID', id)
          : await client.from('devotees').delete().eq('id', id);

        if (error) {
          return { success: false, message: `Supabase Delete Error: ${error.message}` };
        }
        setDevotees((prev) => prev.filter((d) => d.id !== id));
        recordAudit('DELETE', 'devotee', id, target.spiritual_name || target.legal_name, `Deleted devotee record: ${target.spiritual_name || target.legal_name}`);
        return { success: true, message: `Deleted devotee from Supabase.` };
      } catch (err: any) {
        return { success: false, message: err.message || 'Supabase delete failed' };
      }
    }

    // Offline mode
    const title = target.spiritual_name || target.legal_name;
    setDevotees((prev) => prev.filter((d) => d.id !== id));
    recordAudit('DELETE', 'devotee', id, title, `Deleted devotee record: ${title}`);

    return { success: true, message: `Record for ${title} was removed.` };
  };

  // Log Care Interaction
  const logCareInteraction = async (interactionData: Omit<CareInteraction, 'id' | 'created_at'>): Promise<{ success: boolean; message: string }> => {
    if (isViewer) {
      return { success: false, message: 'RLS Permission Denied: Viewers cannot log care interactions.' };
    }

    const client = getSupabaseClient();
    if (client && isLiveSupabase) {
      try {
        await client.from('care_interactions').insert([interactionData]);
      } catch (err) {
        console.warn('Supabase care interaction insert:', err);
      }
    }

    const newInteraction: CareInteraction = {
      ...interactionData,
      id: `care-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setCareInteractions((prev) => [newInteraction, ...prev]);

    recordAudit(
      'CARE_LOGGED',
      'care_interaction',
      interactionData.devotee_id,
      interactionData.devotee_name,
      `Logged ${interactionData.interaction_type.replace('_', ' ')} for ${interactionData.devotee_name} via ${interactionData.wished_via || 'Direct'}`,
      [
        { field: 'interaction_type', old_value: null, new_value: interactionData.interaction_type },
        { field: 'notes', old_value: null, new_value: interactionData.notes },
      ]
    );

    return { success: true, message: `Interaction logged for ${interactionData.devotee_name}` };
  };

  // Add Parcel Dispatch
  const addParcelDispatch = async (dispatchData: Omit<ParcelDispatch, 'id'>): Promise<{ success: boolean; message: string }> => {
    if (isViewer) {
      return { success: false, message: 'RLS Permission Denied: Viewers cannot create parcel dispatches.' };
    }

    const client = getSupabaseClient();
    if (client && isLiveSupabase) {
      try {
        await client.from('parcel_dispatches').insert([dispatchData]);
      } catch (err) {
        console.warn('Supabase parcel insert:', err);
      }
    }

    const newParcel: ParcelDispatch = {
      ...dispatchData,
      id: `par-${Date.now()}`,
    };

    setParcelDispatches((prev) => [newParcel, ...prev]);

    recordAudit(
      'CREATE',
      'department',
      newParcel.id,
      `${newParcel.parcel_type} #${newParcel.tracking_number}`,
      `Dispatched parcel to ${newParcel.destination_city} for ${newParcel.devotee_name}`
    );

    return { success: true, message: `Parcel dispatch #${newParcel.tracking_number} recorded!` };
  };

  // Update Parcel Status
  const updateParcelStatus = async (id: string, newStatus: ParcelDispatch['status']): Promise<{ success: boolean; message: string }> => {
    const target = parcelDispatches.find((p) => p.id === id);
    if (!target) return { success: false, message: 'Parcel not found' };

    const client = getSupabaseClient();
    if (client && isLiveSupabase) {
      try {
        await client.from('parcel_dispatches').update({ status: newStatus }).eq('id', id);
      } catch (err) {
        console.warn('Supabase parcel status update:', err);
      }
    }

    setParcelDispatches((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );

    recordAudit(
      'UPDATE',
      'department',
      id,
      `Parcel #${target.tracking_number}`,
      `Updated parcel delivery status to ${newStatus}`,
      [{ field: 'status', old_value: target.status, new_value: newStatus }]
    );

    return { success: true, message: `Parcel status updated to ${newStatus}` };
  };

  // Delete Single Parcel Dispatch
  const deleteParcelDispatch = async (id: string): Promise<{ success: boolean; message: string }> => {
    const target = parcelDispatches.find((p) => p.id === id);
    if (!target) return { success: false, message: 'Consignment not found' };

    setParcelDispatches((prev) => prev.filter((p) => p.id !== id));
    recordAudit(
      'DELETE',
      'department',
      id,
      `Consignment #${target.tracking_number}`,
      `Deleted consignment for ${target.devotee_name}`
    );
    return { success: true, message: 'Consignment deleted successfully' };
  };

  // Delete Multiple Selected Consignments
  const deleteMultipleParcelDispatches = async (ids: string[]): Promise<{ success: boolean; message: string }> => {
    setParcelDispatches((prev) => prev.filter((p) => !ids.includes(p.id)));
    recordAudit(
      'DELETE',
      'department',
      `bulk-${Date.now()}`,
      `Deleted ${ids.length} Consignments`,
      `Removed ${ids.length} selected parcel consignments from tracking`
    );
    return { success: true, message: `Deleted ${ids.length} consignments` };
  };

  // Update Consignment fields (Pre-calling, Post-calling, etc.)
  const updateParcelDispatch = async (id: string, updates: Partial<ParcelDispatch>): Promise<{ success: boolean; message: string }> => {
    setParcelDispatches((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    return { success: true, message: 'Consignment updated successfully' };
  };

  // Update Portal Settings
  const updateSettings = async (newSettings: Partial<PortalSettings>): Promise<{ success: boolean; message: string }> => {
    if (!canManageSettings) {
      return { success: false, message: 'RLS Violation: Only SUPER_ADMIN can modify portal settings.' };
    }

    setSettings((prev) => ({ ...prev, ...newSettings }));

    recordAudit(
      'UPDATE',
      'settings',
      'settings-1',
      'Portal Global Settings',
      'Super Admin updated system configuration parameters'
    );

    return { success: true, message: 'Portal settings updated successfully.' };
  };

  // Export Devotees CSV
  const exportDevoteesCSV = () => {
    const headers = [
      'Devotee ID',
      'Spiritual Name',
      'Legal Name',
      'Spouse Name',
      'Initiation Status',
      'Phone',
      'City',
      'State',
      'Pincode',
      'Address',
      'Date of Birth',
      'Marriage Anniversary',
    ];

    const rows = devotees.map((d) => [
      `"${d.id}"`,
      `"${d.spiritual_name || ''}"`,
      `"${d.legal_name}"`,
      `"${d.spouse_name || ''}"`,
      d.initiation_status,
      `"${d.phone}"`,
      `"${d.city}"`,
      `"${d.state}"`,
      `"${d.pincode}"`,
      `"${d.address.replace(/"/g, '""')}"`,
      d.date_of_birth,
      d.marriage_anniversary || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ISKCON_Devotees_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    recordAudit('EXPORT', 'devotee', undefined, 'Devotee Roster Export', 'Exported devotee database to CSV file');
  };

  // Export Audit Logs CSV
  const exportAuditLogsCSV = () => {
    const headers = ['ID', 'Timestamp', 'User', 'Role', 'Action', 'Entity', 'Title', 'Details', 'IP Address'];
    const rows = auditLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.user_name}"`,
      l.user_role,
      l.action,
      l.entity_type,
      `"${l.record_title.replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ip_address || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ISKCON_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    recordAudit('EXPORT', 'user', undefined, 'Audit Trail Export', 'Exported compliance audit trail log to CSV');
  };

  const resetToSampleData = () => {
    localStorage.removeItem('iskcon_devotees');
    localStorage.removeItem('iskcon_departments');
    localStorage.removeItem('iskcon_audit_logs');
    localStorage.removeItem('iskcon_care_interactions');
    localStorage.removeItem('iskcon_parcel_dispatches');
    localStorage.removeItem('iskcon_portal_settings');
    setDevotees([]);
    setDepartments(INITIAL_DEPARTMENTS);
    setAuditLogs([]);
    setCareInteractions([]);
    setParcelDispatches([]);
    setSettings(INITIAL_SETTINGS);
    fetchLiveSupabaseData();
  };

  const refreshData = async () => {
    setIsLiveSupabase(getSupabaseConfig().isConfigured);
    await fetchLiveSupabaseData();
  };

  const seedLiveDatabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Please connect to Supabase first before seeding data.' };
    }
    const res = await seedSupabaseDatabase(client);
    if (res.success) {
      await fetchLiveSupabaseData();
    }
    return res;
  };

  return (
    <DataContext.Provider
      value={{
        devotees,
        departments,
        auditLogs,
        careInteractions,
        parcelDispatches,
        settings,
        isLiveSupabase,
        isLoadingLive,
        addDevotee,
        updateDevotee,
        deleteDevotee,
        logCareInteraction,
        addParcelDispatch,
        updateParcelStatus,
        deleteParcelDispatch,
        deleteMultipleParcelDispatches,
        updateParcelDispatch,
        birthdayRemovals,
        anniversaryRemovals,
        removeBirthdayRecord,
        restoreBirthdayRecord,
        restoreAllBirthdayRecords,
        removeAnniversaryRecord,
        restoreAnniversaryRecord,
        restoreAllAnniversaryRecords,
        updateSettings,
        exportDevoteesCSV,
        exportAuditLogsCSV,
        resetToSampleData,
        refreshData,
        seedLiveDatabase,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
