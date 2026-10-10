export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'VIEWER';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  spiritual_name?: string;
  role: UserRole;
  department_id?: string;
  department_name?: string;
  avatar_url?: string;
  created_at: string;
  is_active: boolean;
  password?: string;
  is_owner?: boolean;
}

export type InitiationStatus = 
  | 'UNINITIATED' 
  | 'ASPIRANT' 
  | 'FIRST_DIKSHA' 
  | 'SECOND_DIKSHA' 
  | 'SANNYASA';

export interface Devotee {
  id: string;
  spiritual_name: string;
  legal_name: string;
  initiation_status: InitiationStatus;
  diksha_guru?: string;
  siksa_guru?: string;
  gender: 'MALE' | 'FEMALE';
  date_of_birth: string; // YYYY-MM-DD
  initiation_date?: string; // YYYY-MM-DD
  marriage_anniversary?: string; // YYYY-MM-DD
  phone: string;
  whatsapp_number?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  counselor_name?: string;
  department_id?: string;
  department_name?: string;
  primary_seva?: string;
  skills?: string[];
  blood_group?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
  photo_url?: string;
  spouse_name?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'RELOCATED';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  head_devotee: string;
  head_phone: string;
  active_devotees_count: number;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'CARE_LOGGED';

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: AuditAction;
  entity_type: 'devotee' | 'department' | 'user' | 'settings' | 'care_interaction' | 'auth';
  record_id?: string;
  record_title: string;
  details: string;
  changes?: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  timestamp: string;
  ip_address?: string;
}

export type CareInteractionType = 
  | 'BIRTHDAY_WISH' 
  | 'ANNIVERSARY_WISH' 
  | 'PARCEL_DELIVERY' 
  | 'HEALTH_CHECK' 
  | 'COUNSELING_SESSION' 
  | 'PRASADAM_OFFERING';

export interface CareInteraction {
  id: string;
  devotee_id: string;
  devotee_name: string;
  interaction_type: CareInteractionType;
  conducted_by_name: string;
  conducted_by_id: string;
  date: string;
  notes: string;
  wished_via?: 'WHATSAPP' | 'PHONE_CALL' | 'IN_PERSON' | 'EMAIL';
  created_at: string;
}

export interface ParcelDispatch {
  id: string;
  devotee_id: string;
  devotee_name: string;
  legal_name?: string;
  phone?: string;
  purpose?: 'ANNIVERSARY' | 'BIRTHDAY' | 'FESTIVAL_PRASAD' | 'GENERAL';
  parcel_type: 'PRASADAM' | 'DEVOTIONAL_BOOKS' | 'DEITY_PARAPHERNALIA' | 'FESTIVAL_GIFTS' | 'DHOTI_KURTA_SAREE';
  tracking_number: string;
  courier_service: string;
  dispatch_date: string;
  status: 'PREPARING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  destination_city: string;
  dispatched_by: string;
  pre_calling?: string;
  post_calling?: string;
  notes?: string;
}

export interface PortalSettings {
  temple_name: string;
  center_code: string;
  city: string;
  lead_days_notification: number;
  allow_guest_view: boolean;
  enable_audit_strict_mode: boolean;
  default_whatsapp_wish_template: string;
}
