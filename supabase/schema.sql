-- ==============================================================================
-- ISKCON DEVOTEE CARE & PARCEL PORTAL — PRODUCTION SUPABASE SQL MIGRATION
-- Project: https://nghiqkgdrqxupxxrrlwb.supabase.co
-- Architecture: User -> Auth & RLS -> PostgreSQL DB -> Audit Trigger -> Dashboard
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STAFF', 'VIEWER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE initiation_status_enum AS ENUM ('UNINITIATED', 'ASPIRANT', 'FIRST_DIKSHA', 'SECOND_DIKSHA', 'SANNYASA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_action_enum AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'CARE_LOGGED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  full_name TEXT NOT NULL DEFAULT 'Devotee Staff',
  spiritual_name TEXT,
  role TEXT NOT NULL DEFAULT 'STAFF',
  department_id UUID,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  head_devotee TEXT NOT NULL,
  head_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. DEVOTEES TABLE (Create or alter existing safely)
CREATE TABLE IF NOT EXISTS public.devotees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spiritual_name TEXT,
  legal_name TEXT NOT NULL DEFAULT 'Devotee',
  initiation_status TEXT NOT NULL DEFAULT 'UNINITIATED',
  diksha_guru TEXT,
  siksa_guru TEXT,
  gender TEXT NOT NULL DEFAULT 'MALE',
  date_of_birth DATE NOT NULL DEFAULT CURRENT_DATE,
  initiation_date DATE,
  marriage_anniversary DATE,
  phone TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT,
  email TEXT,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'Mumbai',
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode TEXT NOT NULL DEFAULT '400001',
  counselor_name TEXT,
  department_id UUID,
  primary_seva TEXT,
  skills TEXT[],
  blood_group TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Safely ensure columns exist even if devotees table was pre-existing
DO $$ BEGIN
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS spiritual_name TEXT;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS legal_name TEXT NOT NULL DEFAULT 'Devotee';
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS initiation_status TEXT NOT NULL DEFAULT 'UNINITIATED';
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS diksha_guru TEXT;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS siksa_guru TEXT;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'MALE';
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS date_of_birth DATE NOT NULL DEFAULT CURRENT_DATE;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS initiation_date DATE;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS marriage_anniversary DATE;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS email TEXT;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Mumbai';
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'Maharashtra';
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS pincode TEXT NOT NULL DEFAULT '400001';
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS counselor_name TEXT;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS department_id UUID;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS primary_seva TEXT;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS skills TEXT[];
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS blood_group TEXT;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS created_by TEXT;
  ALTER TABLE public.devotees ADD COLUMN IF NOT EXISTS updated_by TEXT;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- 6. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_name TEXT NOT NULL DEFAULT 'Staff Member',
  user_role TEXT NOT NULL DEFAULT 'STAFF',
  action TEXT NOT NULL DEFAULT 'UPDATE',
  entity_type TEXT NOT NULL DEFAULT 'devotee',
  record_id UUID,
  record_title TEXT NOT NULL DEFAULT 'Record',
  details TEXT NOT NULL DEFAULT '',
  changes JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CARE INTERACTIONS TABLE (Pastoral Care, Birthday & Anniversary Wishes)
CREATE TABLE IF NOT EXISTS public.care_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devotee_id UUID,
  devotee_name TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  conducted_by_id TEXT,
  conducted_by_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  wished_via TEXT,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PARCEL DISPATCHES TABLE (ISKCON Parcel Department)
CREATE TABLE IF NOT EXISTS public.parcel_dispatches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devotee_id UUID,
  devotee_name TEXT NOT NULL,
  parcel_type TEXT NOT NULL,
  tracking_number TEXT NOT NULL,
  courier_service TEXT NOT NULL,
  dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'DISPATCHED',
  destination_city TEXT NOT NULL,
  dispatched_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PORTAL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.portal_settings (
  id INT PRIMARY KEY DEFAULT 1,
  temple_name TEXT NOT NULL DEFAULT 'ISKCON Devotee Care & Parcel Center',
  center_code TEXT NOT NULL DEFAULT 'ISKCON-DC-01',
  city TEXT NOT NULL DEFAULT 'Mumbai',
  lead_days_notification INT NOT NULL DEFAULT 7,
  default_whatsapp_wish_template TEXT NOT NULL DEFAULT 'Hare Krishna {NAME}! 🙏\nPlease accept our humble obeisances. All glories to Srila Prabhupada!\n\nOn behalf of ISKCON Devotee Care Department, wishing you a very blissful, Krishna conscious {OCCASION}! 🎉\n\nMay Sri Sri Radha Gopinath shower Their transcendental mercy upon you!'
);

INSERT INTO public.portal_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- AUTOMATIC AUDIT LOG TRIGGER
-- Captures INSERT, UPDATE, DELETE with JSON diffs!
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_audit_devotees_trigger()
RETURNS TRIGGER AS $$
DECLARE
  current_user_name TEXT := 'Staff Member';
  current_user_role TEXT := 'STAFF';
  old_data JSONB;
  new_data JSONB;
  diff_data JSONB := '[]'::JSONB;
  key TEXT;
  rec_title TEXT;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    rec_title := COALESCE(NEW.spiritual_name, NEW.legal_name, 'New Devotee');
    INSERT INTO public.audit_logs (user_name, user_role, action, entity_type, record_id, record_title, details, changes)
    VALUES (
      COALESCE(NEW.created_by, current_user_name),
      current_user_role,
      'CREATE',
      'devotee',
      NEW.id,
      rec_title,
      'Registered new devotee: ' || rec_title,
      '[]'::JSONB
    );
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    rec_title := COALESCE(NEW.spiritual_name, NEW.legal_name, 'Devotee');
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);

    FOR key IN SELECT jsonb_object_keys(new_data) LOOP
      IF old_data->key IS DISTINCT FROM new_data->key AND key NOT IN ('updated_at', 'updated_by') THEN
        diff_data := diff_data || jsonb_build_array(
          jsonb_build_object(
            'field', key,
            'old_value', old_data->key,
            'new_value', new_data->key
          )
        );
      END IF;
    END LOOP;

    INSERT INTO public.audit_logs (user_name, user_role, action, entity_type, record_id, record_title, details, changes)
    VALUES (
      COALESCE(NEW.updated_by, current_user_name),
      current_user_role,
      'UPDATE',
      'devotee',
      NEW.id,
      rec_title,
      'Updated devotee profile for ' || rec_title,
      diff_data
    );
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    rec_title := COALESCE(OLD.spiritual_name, OLD.legal_name, 'Devotee');
    INSERT INTO public.audit_logs (user_name, user_role, action, entity_type, record_id, record_title, details)
    VALUES (
      current_user_name,
      'ADMIN',
      'DELETE',
      'devotee',
      OLD.id,
      rec_title,
      'Removed devotee record: ' || rec_title
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_devotees ON public.devotees;
CREATE TRIGGER trg_audit_devotees
AFTER INSERT OR UPDATE OR DELETE ON public.devotees
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_devotees_trigger();

-- ==============================================================================
-- PERMISSIONS & ROW LEVEL SECURITY
-- ==============================================================================
-- Grant access to anon & authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE public.devotees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Clean existing policies safely
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read devotees" ON public.devotees;
  DROP POLICY IF EXISTS "Public insert devotees" ON public.devotees;
  DROP POLICY IF EXISTS "Public update devotees" ON public.devotees;
  DROP POLICY IF EXISTS "Public delete devotees" ON public.devotees;
  
  DROP POLICY IF EXISTS "Public read departments" ON public.departments;
  DROP POLICY IF EXISTS "Public manage departments" ON public.departments;
  
  DROP POLICY IF EXISTS "Public read audit_logs" ON public.audit_logs;
  DROP POLICY IF EXISTS "Public insert audit_logs" ON public.audit_logs;
  
  DROP POLICY IF EXISTS "Public read care" ON public.care_interactions;
  DROP POLICY IF EXISTS "Public manage care" ON public.care_interactions;
  
  DROP POLICY IF EXISTS "Public read parcels" ON public.parcel_dispatches;
  DROP POLICY IF EXISTS "Public manage parcels" ON public.parcel_dispatches;
  
  DROP POLICY IF EXISTS "Public read settings" ON public.portal_settings;
  DROP POLICY IF EXISTS "Public manage settings" ON public.portal_settings;
  
  DROP POLICY IF EXISTS "Public read profiles" ON public.user_profiles;
  DROP POLICY IF EXISTS "Public manage profiles" ON public.user_profiles;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- Devotees policies
CREATE POLICY "Public read devotees" ON public.devotees FOR SELECT USING (true);
CREATE POLICY "Public insert devotees" ON public.devotees FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update devotees" ON public.devotees FOR UPDATE USING (true);
CREATE POLICY "Public delete devotees" ON public.devotees FOR DELETE USING (true);

-- Departments policies
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Public manage departments" ON public.departments FOR ALL USING (true);

-- Audit logs policies
CREATE POLICY "Public read audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Public insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Care interactions policies
CREATE POLICY "Public read care" ON public.care_interactions FOR SELECT USING (true);
CREATE POLICY "Public manage care" ON public.care_interactions FOR ALL USING (true);

-- Parcel dispatches policies
CREATE POLICY "Public read parcels" ON public.parcel_dispatches FOR SELECT USING (true);
CREATE POLICY "Public manage parcels" ON public.parcel_dispatches FOR ALL USING (true);

-- Portal settings policies
CREATE POLICY "Public read settings" ON public.portal_settings FOR SELECT USING (true);
CREATE POLICY "Public manage settings" ON public.portal_settings FOR ALL USING (true);

-- User profiles policies
CREATE POLICY "Public read profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Public manage profiles" ON public.user_profiles FOR ALL USING (true);

-- Enable Realtime replication on tables
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.devotees;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.care_interactions;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.parcel_dispatches;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN OTHERS THEN null;
END $$;

-- 10. INITIAL SEED DEPARTMENTS
INSERT INTO public.departments (name, code, description, head_devotee, head_phone)
VALUES 
  ('Devotee Care & Pastoral Welfare', 'DCPW', 'Devotee health, spiritual mentoring, counseling, birthday & anniversary wishes.', 'HG Radhika Devi Dasi', '+91 98201 12345'),
  ('Parcel & Logistics Department', 'PLD', 'Dispatch of Maha-Prasadam, Srila Prabhupada literature, devotional clothes, and deity outfits.', 'HG Madhava Gauranga Das', '+91 98202 23456'),
  ('Deity Worship & Pujari Seva', 'DWPS', 'Altar service, dressing of Sri Sri Radha Gopinath, flower garland making.', 'HG Jananivasa Kripa Das', '+91 98203 34567'),
  ('Kitchen & Prasadam Seva', 'KPS', 'Bhog offering preparation, Sunday Feast cooking, and Annadanam food relief.', 'HG Govinda Charan Das', '+91 98204 45678'),
  ('Sankirtan & Book Distribution', 'SBD', 'Street Harinam, Gita Marathon distribution, and transcendental literature outreach.', 'HG Vraja Kishor Das', '+91 98205 56789'),
  ('ISKCON Youth Forum (IYF)', 'IYF', 'College student outreach, youth seminars, spiritual retreats, and career guidance.', 'HG Chaitanya Charan Das', '+91 98206 67890')
ON CONFLICT (code) DO NOTHING;
