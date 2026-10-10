# ISKCON Devotee Care & Parcel Portal

A secure, multi-user devotional database portal designed according to the **User → Auth → RLS → Database → Audit Log → Dashboard** architecture flow.

---

## 🏛️ Architecture Flow

```
Step 1 — Admin & Staff (Individual Accounts & Roles)
  • SUPER_ADMIN: Full system control, role assignment, portal settings
  • ADMIN: Manage devotees, view audit logs, department management, exports
  • STAFF: Devotee registration, contact updates, parcel logistics, pastoral care
  • VIEWER: Read-only access to rosters (mutations blocked)
       │
       ▼
Step 2 — Supabase Authentication & Row Level Security (RLS)
  • JWT verification for every request
  • RLS policies prevent unauthorized database mutations
       │
       ▼
Step 3 — Supabase PostgreSQL Database & Automated Audit Trigger
  • Devotees, Birthdays, Anniversaries, Departments, Parcels
  • Trigger: fn_audit_devotees_trigger() automatically logs all INSERT / UPDATE / DELETE
  • Immutable audit trail with field-level diffs (Old Value ➔ New Value)
       │
       ▼
Step 4 — Live Admin Dashboard
  • Real-time counters & devotee metrics
  • Birthday & Anniversary alerts with 1-click WhatsApp blessings
  • Parcel department dispatch tracking
  • Live audit trail stream with diff inspector
```

---

## 🚀 Getting Started

The dev server is running at:
**[http://localhost:5173/](http://localhost:5173/)**

To run manually:
```bash
npm run dev
```

To build for production:
```bash
npm run build
```

---

## ⚡ Role-Based Quick Switcher (In-App)

Use the account dropdown in the top navigation bar to test how permissions and Row Level Security differ across roles:
1. **HG Sundar Gopal Das** (`SUPER_ADMIN`): Full access to manage users, settings, audit trail, delete devotees.
2. **HG Radhika Devi Dasi** (`ADMIN`): Devotee care lead; can add/edit/delete devotees, send wishes, inspect audit diffs.
3. **Bhakta Amit** (`STAFF`): Parcel coordinator; can edit contacts and phone numbers (which triggers audit logs), but cannot delete records or edit system settings.
4. **Govinda Priya Devi Dasi** (`VIEWER`): Read-only view; edit/delete actions are restricted.

---

## 🗄️ Supabase PostgreSQL Setup (Live Mode)

1. Open your [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor** ➔ **New Query**.
3. Copy the script from `supabase/schema.sql` (or click "Copy SQL Schema" in the portal's **Architecture & Supabase** tab) and click **Run**.
4. In the portal, navigate to the **Architecture & Supabase** tab, paste your **Project URL** and **Anon Public Key**, and click **Test & Connect Supabase**.

---

## 📦 Key Features

- **Devotee Congregation Directory**: Advanced search, initiation status filters (1st Diksha, 2nd Diksha, Aspirant), counselor assignment, and CSV export.
- **Birthday & Anniversary Care**: Today's celebrations, upcoming 7-day alert, 1-click Krishna Conscious WhatsApp greeting generator with confetti celebration, and pastoral care history logger.
- **Parcel & Logistics Department**: Tracking numbers, courier services (BlueDart, DTDC, Speed Post), Maha-Prasadam boxes, and deity outfits dispatches.
- **Live Audit Trail**: Searchable immutable change logs showing timestamp, actor, action, and interactive before/after JSON diffs.
- **Staff & Access Control**: Multi-user account management and role governance.
