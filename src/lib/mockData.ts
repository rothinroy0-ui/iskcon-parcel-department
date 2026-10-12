import { Devotee, Department, AuditLog, CareInteraction, ParcelDispatch, UserProfile, PortalSettings } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-owner',
    email: 'rothinroy0@gmail.com',
    full_name: 'Rathin Roy',
    spiritual_name: 'HG Rothin Roy Prabhu',
    role: 'SUPER_ADMIN',
    department_name: 'Devotee Care & Pastoral Welfare',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    created_at: '2025-01-01T00:00:00Z',
    is_active: true,
    is_owner: true,
    password: 'Rothin@108#Manual',
  },
  {
    id: 'user-staff',
    email: 'staff@iskcon.org',
    full_name: 'Bhakta Amit',
    spiritual_name: 'Bhakta Amit Kumar',
    role: 'STAFF',
    department_name: 'Parcel & Logistics Department',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: '2025-01-01T00:00:00Z',
    is_active: true,
    is_owner: false,
    password: 'Staff@108#Manual',
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-01',
    name: 'Devotee Care & Pastoral Welfare',
    code: 'DCPW',
    description: 'Devotee health, spiritual mentoring, counseling, birthday & anniversary wishes.',
    head_devotee: 'HG Radhika Devi Dasi',
    head_phone: '+91 98201 12345',
    active_devotees_count: 0,
  },
  {
    id: 'dept-02',
    name: 'Parcel & Logistics Department',
    code: 'PLD',
    description: 'Dispatch of Maha-Prasadam, Srila Prabhupada literature, devotional clothes, and deity outfits.',
    head_devotee: 'HG Madhava Gauranga Das',
    head_phone: '+91 98202 23456',
    active_devotees_count: 0,
  },
  {
    id: 'dept-03',
    name: 'Deity Worship & Pujari Seva',
    code: 'DWPS',
    description: 'Altar service, dressing of Sri Sri Radha Gopinath, flower garland making.',
    head_devotee: 'HG Jananivasa Kripa Das',
    head_phone: '+91 98203 34567',
    active_devotees_count: 0,
  },
  {
    id: 'dept-04',
    name: 'Kitchen & Prasadam Seva',
    code: 'KPS',
    description: 'Bhog offering preparation, Sunday Feast cooking, and Annadanam food relief.',
    head_devotee: 'HG Govinda Charan Das',
    head_phone: '+91 98204 45678',
    active_devotees_count: 0,
  },
  {
    id: 'dept-05',
    name: 'Sankirtan & Book Distribution',
    code: 'SBD',
    description: 'Street Harinam, Gita Marathon distribution, and transcendental literature outreach.',
    head_devotee: 'HG Vraja Kishor Das',
    head_phone: '+91 98205 56789',
    active_devotees_count: 0,
  },
  {
    id: 'dept-06',
    name: 'ISKCON Youth Forum (IYF)',
    code: 'IYF',
    description: 'College student outreach, youth seminars, spiritual retreats, and career guidance.',
    head_devotee: 'HG Chaitanya Charan Das',
    head_phone: '+91 98206 67890',
    active_devotees_count: 0,
  },
];

// All demo mock records permanently cleared!
export const INITIAL_DEVOTEES: Devotee[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_PARCEL_DISPATCHES: ParcelDispatch[] = [
  {
    id: 'disp-01',
    devotee_id: 'ISKCON_DGP_PRASENJIT',
    devotee_name: 'PRAMOPRIYO GOURANGA DAS.',
    legal_name: 'PRASENJIT DAS',
    phone: '8972882201',
    purpose: 'ANNIVERSARY',
    parcel_type: 'PRASADAM',
    tracking_number: 'SELF_MODE',
    courier_service: 'Self Mode',
    dispatch_date: '2026-10-10',
    status: 'IN_TRANSIT',
    destination_city: 'Durgapur Region',
    dispatched_by: 'Logistics Desk',
    pre_calling: '🏠 Self Mode — editable now',
    post_calling: '🔒',
    notes: 'Temple pickup — tracking locked'
  }
];

export const INITIAL_CARE_INTERACTIONS: CareInteraction[] = [];

export const INITIAL_SETTINGS: PortalSettings = {
  temple_name: 'ISKCON Devotee Care & Parcel Center',
  center_code: 'ISKCON-DGP',
  city: 'Durgapur',
  lead_days_notification: 7,
  allow_guest_view: false,
  enable_audit_strict_mode: true,
  default_whatsapp_wish_template:
    'Hare Krishna {NAME}! 🙏\nPlease accept our humble obeisances. All glories to Srila Prabhupada!\n\nOn behalf of ISKCON Devotee Care Department, wishing you a very blissful, Krishna conscious {OCCASION}! 🎉\n\nMay Sri Sri Radha Gopinath shower Their transcendental mercy upon you and inspire you with deep love for the Holy Names.\n\nYour humble servants,\nISKCON Devotee Care Team',
};
