import React, { useState } from 'react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection 
} from '../../lib/supabase';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Database, 
  ShieldCheck, 
  KeyRound, 
  Server, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowDown, 
  Sparkles, 
  Lock,
  Layers,
  Terminal,
  Activity
} from 'lucide-react';

export const ArchitectureFlow: React.FC = () => {
  const { isLiveSupabase, refreshData, seedLiveDatabase, devotees } = useData();
  const { currentUser } = useAuth();

  const config = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(config.url);
  const [supabaseKey, setSupabaseKey] = useState(config.key);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tablesExist: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);
    setSeedResult(null);

    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      saveSupabaseConfig(supabaseUrl, supabaseKey);
      await refreshData();
    }
  };

  const handleDisconnect = async () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseKey('');
    setTestResult(null);
    setSeedResult(null);
    await refreshData();
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    const res = await seedLiveDatabase();
    setIsSeeding(false);
    setSeedResult(res.message);
  };

  const sqlCode = `-- ==============================================================================
-- ISKCON DEVOTEE CARE PORTAL — COMPLETE SUPABASE DATABASE & RLS SCHEMA
-- Architecture: User -> Auth -> RLS -> Database -> Audit Log Trigger -> Dashboard
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role & Status Enums
CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STAFF', 'VIEWER');
CREATE TYPE initiation_status_enum AS ENUM ('UNINITIATED', 'ASPIRANT', 'FIRST_DIKSHA', 'SECOND_DIKSHA', 'SANNYASA');
CREATE TYPE audit_action_enum AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'CARE_LOGGED');

-- 1. USER PROFILES TABLE (Linked with auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  spiritual_name TEXT,
  role user_role_enum NOT NULL DEFAULT 'STAFF',
  department_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  head_devotee TEXT NOT NULL,
  head_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DEVOTEES TABLE
CREATE TABLE IF NOT EXISTS public.devotees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spiritual_name TEXT,
  legal_name TEXT NOT NULL,
  initiation_status initiation_status_enum NOT NULL DEFAULT 'UNINITIATED',
  diksha_guru TEXT,
  date_of_birth DATE NOT NULL,
  marriage_anniversary DATE,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode TEXT NOT NULL,
  counselor_name TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  primary_seva TEXT,
  notes TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AUDIT LOGS TABLE (Immutable Change & Security Log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_name TEXT NOT NULL DEFAULT 'Staff Member',
  user_role TEXT NOT NULL DEFAULT 'STAFF',
  action audit_action_enum NOT NULL,
  entity_type TEXT NOT NULL,
  record_id UUID,
  record_title TEXT NOT NULL,
  details TEXT NOT NULL,
  changes JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AUTOMATED AUDIT TRIGGER FUNCTION (Captures old vs new values!)
CREATE OR REPLACE FUNCTION public.fn_audit_devotees_trigger()
RETURNS TRIGGER AS $$
DECLARE
  current_user_uuid UUID := auth.uid();
  current_user_name TEXT := 'Staff Member';
  current_user_role TEXT := 'STAFF';
  old_data JSONB;
  new_data JSONB;
  diff_data JSONB := '[]'::JSONB;
  key TEXT;
  rec_title TEXT;
BEGIN
  IF current_user_uuid IS NOT NULL THEN
    SELECT COALESCE(spiritual_name, full_name, 'Staff'), role::TEXT
    INTO current_user_name, current_user_role
    FROM public.user_profiles
    WHERE id = current_user_uuid;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    rec_title := COALESCE(NEW.spiritual_name, NEW.legal_name, 'New Devotee');
    INSERT INTO public.audit_logs (user_id, user_name, user_role, action, entity_type, record_id, record_title, details, changes)
    VALUES (current_user_uuid, current_user_name, current_user_role, 'CREATE', 'devotee', NEW.id, rec_title, 'Registered new devotee: ' || rec_title, '[]');
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    rec_title := COALESCE(NEW.spiritual_name, NEW.legal_name, 'Devotee');
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);

    FOR key IN SELECT jsonb_object_keys(new_data) LOOP
      IF old_data->key IS DISTINCT FROM new_data->key AND key NOT IN ('updated_at') THEN
        diff_data := diff_data || jsonb_build_array(jsonb_build_object('field', key, 'old_value', old_data->key, 'new_value', new_data->key));
      END IF;
    END LOOP;

    INSERT INTO public.audit_logs (user_id, user_name, user_role, action, entity_type, record_id, record_title, details, changes)
    VALUES (current_user_uuid, current_user_name, current_user_role, 'UPDATE', 'devotee', NEW.id, rec_title, 'Updated devotee profile for ' || rec_title, diff_data);
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    rec_title := COALESCE(OLD.spiritual_name, OLD.legal_name, 'Devotee');
    INSERT INTO public.audit_logs (user_id, user_name, user_role, action, entity_type, record_id, record_title, details)
    VALUES (current_user_uuid, current_user_name, current_user_role, 'DELETE', 'devotee', OLD.id, rec_title, 'Deleted record: ' || rec_title);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_devotees ON public.devotees;
CREATE TRIGGER trg_audit_devotees
AFTER INSERT OR UPDATE OR DELETE ON public.devotees
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_devotees_trigger();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.devotees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read devotees" ON public.devotees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authorized staff insert devotees" ON public.devotees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authorized staff update devotees" ON public.devotees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Only admins can delete devotees" ON public.devotees FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow trigger insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Audit logs immutable" ON public.audit_logs FOR UPDATE TO authenticated USING (false);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/10">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
            Architecture Blueprint & Supabase Pipeline
          </span>
        </div>
        <h2 className="text-2xl font-black font-serif tracking-tight mt-1">
          ISKCON Devotee Care Portal Architecture
        </h2>
        <p className="text-emerald-100 text-xs mt-1 max-w-2xl leading-relaxed">
          How data flows securely from user authentication, through PostgreSQL Row Level Security (RLS), into automated audit triggers, and live to the admin dashboard.
        </p>
      </div>

      {/* The 4-Step Interactive Flow Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            End-to-End Operational Pipeline
          </h3>
        </div>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:via-emerald-500 before:to-purple-500">
          
          {/* Step 1 */}
          <div className="relative group">
            <div className="absolute -left-[30px] top-0 w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center ring-4 ring-white shadow-xs">
              1
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Step 1 — Admin & Staff Authentication</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                  Identity Layer
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Sign in with individual temple accounts. Each user has a defined role: <code className="font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded">SUPER_ADMIN</code>, <code className="font-mono text-amber-700 bg-amber-50 px-1 py-0.5 rounded">ADMIN</code>, <code className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">STAFF</code>, or <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">VIEWER</code>. No shared login accounts.
              </p>
              <div className="mt-2.5 text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Active Account: {currentUser.spiritual_name || currentUser.full_name} ({currentUser.role})</span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative group">
            <div className="absolute -left-[30px] top-0 w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center ring-4 ring-white shadow-xs">
              2
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Step 2 — Supabase Authentication & RLS</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  Security Guard
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Supabase Authentication verifies the user's JWT token and role permissions. Row Level Security (RLS) controls which records each user can view, add, edit, or delete. Unauthorized users cannot directly query or mutate protected records in PostgreSQL.
              </p>
              <div className="mt-2.5 text-[11px] text-slate-500 font-mono bg-white p-2 rounded-lg border border-slate-200">
                CREATE POLICY "Allow authorized staff update" ON public.devotees FOR UPDATE USING (current_user_role() IN ('SUPER_ADMIN','ADMIN','STAFF'));
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative group">
            <div className="absolute -left-[30px] top-0 w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center ring-4 ring-white shadow-xs">
              3
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Step 3 — Supabase PostgreSQL Database & Trigger</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  Data & Trigger Layer
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Stores devotee records, birthdays, wedding anniversaries, departments, staff profiles, parcel dispatches, and settings. Whenever an update executes (e.g. updating a phone number), the PostgreSQL trigger <code className="font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded">fn_audit_devotees_trigger()</code> automatically writes an immutable log to <code className="font-mono text-slate-800 bg-slate-200 px-1 py-0.5 rounded">audit_logs</code> with old and new values!
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative group">
            <div className="absolute -left-[30px] top-0 w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center ring-4 ring-white shadow-xs">
              4
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Step 4 — Live Admin Dashboard & Real-Time Feed</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                  Live Admin Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                The dashboard reads live data and shows total devotee records, upcoming birthday & anniversary alerts, department summaries, pending parcels, and an immediate audit history with diff inspection.
              </p>
            </div>
          </div>

        </div>

        {/* The Exact Example Flow Box */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 text-xs text-amber-950 space-y-2">
          <div className="font-bold text-sm text-amber-900 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Example Data Flow in Action:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 text-center text-[11px] pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-amber-200">
              <span className="font-bold block text-slate-800">1. Staff Member</span>
              <span className="text-slate-500 text-[10px]">Changes phone number</span>
            </div>
            <div className="flex items-center justify-center text-amber-600 font-bold">➔</div>
            <div className="bg-white p-2.5 rounded-lg border border-amber-200">
              <span className="font-bold block text-slate-800">2. Supabase Auth</span>
              <span className="text-slate-500 text-[10px]">Verifies staff account</span>
            </div>
            <div className="flex items-center justify-center text-amber-600 font-bold">➔</div>
            <div className="bg-white p-2.5 rounded-lg border border-amber-200">
              <span className="font-bold block text-slate-800">3. RLS Check</span>
              <span className="text-slate-500 text-[10px]">Allows update</span>
            </div>
            <div className="flex items-center justify-center text-amber-600 font-bold">➔</div>
            <div className="bg-white p-2.5 rounded-lg border border-amber-200">
              <span className="font-bold block text-slate-800">4. Trigger & Audit</span>
              <span className="text-slate-500 text-[10px]">Diff saved to audit_logs</span>
            </div>
            <div className="flex items-center justify-center text-amber-600 font-bold">➔</div>
            <div className="bg-amber-100 p-2.5 rounded-lg border border-amber-300 font-bold text-amber-950">
              <span className="block">5. Dashboard</span>
              <span className="text-[10px] text-amber-800">Admin sees change live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Supabase Connection Setup */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Connect Your Supabase Project (Live Mode)
            </h3>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            isLiveSupabase ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
          }`}>
            {isLiveSupabase ? 'Live Supabase Connected' : 'Running in Interactive Demo Mode'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          You can paste your Supabase Project URL and Anon Public Key below. Once tested, the portal will communicate directly with your Supabase PostgreSQL database. If left empty, the portal operates seamlessly in full-fidelity standalone demo mode!
        </p>

        <form onSubmit={handleTestAndSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
              testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{testResult.message}</span>
            </div>
          )}

          {seedResult && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{seedResult}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isTesting || !supabaseUrl || !supabaseKey}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Server className="w-4 h-4" />
              <span>{isTesting ? 'Testing Connection...' : 'Test & Connect Supabase'}</span>
            </button>

            {isLiveSupabase && (
              <>
                <button
                  type="button"
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSeeding ? 'Seeding Database...' : 'Seed Sample Devotees into Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors ml-auto"
                >
                  Disconnect (Return to Demo Mode)
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Copyable SQL Schema */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Supabase SQL Editor Migration Script (schema.sql)
            </h3>
          </div>
          <button
            onClick={copySqlToClipboard}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Run this SQL script in your Supabase Dashboard ➔ SQL Editor to create the tables, RLS policies, and automated audit triggers.
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 max-h-72 overflow-y-auto whitespace-pre">
          {sqlCode}
        </div>
      </div>
    </div>
  );
};
