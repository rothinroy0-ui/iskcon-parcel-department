import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserProfile, UserRole } from '../../types';
import { RoleBadge } from '../common/RoleBadge';
import { 
  UserCog, 
  ShieldCheck, 
  UserPlus, 
  Mail, 
  Lock, 
  Check, 
  Sparkles,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DevoteeAvatar } from '../common/DevoteeAvatar';

export const UserManager: React.FC = () => {
  const { 
    usersList, 
    currentUser, 
    updateUserRole, 
    addNewUser, 
    updateUser, 
    deleteUser, 
    isSuperAdmin 
  } = useAuth();
  const { departments } = useData();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit user password state
  const [editPassword, setEditPassword] = useState('');
  const [confirmEditPassword, setConfirmEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // New user form state with manual password
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    spiritual_name: '',
    role: 'STAFF' as UserRole,
    department_name: 'Devotee Care & Pastoral Welfare',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    is_active: true,
    password: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!isSuperAdmin) {
      alert('Security Policy: Only SUPER_ADMIN can modify user permissions and roles.');
      return;
    }
    updateUserRole(userId, newRole);
    showToast(`Role updated to ${newRole} for user.`);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.full_name) {
      alert('Please fill email and full name.');
      return;
    }

    if (!newUser.password || newUser.password.length < 6) {
      alert('Please enter a secure manual password of at least 6 characters.');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      alert('Passwords do not match. Please verify the password fields.');
      return;
    }

    addNewUser({
      email: newUser.email.trim(),
      full_name: newUser.full_name.trim(),
      spiritual_name: newUser.spiritual_name.trim() || undefined,
      role: newUser.role,
      department_name: newUser.department_name,
      avatar_url: newUser.avatar_url,
      is_active: true,
      password: newUser.password.trim(),
    });
    
    setShowAddModal(false);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
    showToast(`Staff account created for ${newUser.spiritual_name || newUser.full_name} with manual password!`);

    setNewUser({
      email: '',
      full_name: '',
      spiritual_name: '',
      role: 'STAFF',
      department_name: 'Devotee Care & Pastoral Welfare',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      is_active: true,
      password: '',
      confirmPassword: '',
    });
    setShowNewPassword(false);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser({ ...user });
    setEditPassword('');
    setConfirmEditPassword('');
    setShowEditPassword(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editingUser.email.trim() || !editingUser.full_name.trim()) {
      alert('Email and legal name cannot be blank.');
      return;
    }

    const updates: Partial<UserProfile> = {
      full_name: editingUser.full_name.trim(),
      spiritual_name: editingUser.spiritual_name?.trim() || '',
      email: editingUser.email.trim(),
      department_name: editingUser.department_name,
      role: editingUser.role,
      avatar_url: editingUser.avatar_url,
      is_active: editingUser.is_active,
    };

    // If manual password change was requested
    if (editPassword.trim()) {
      if (editPassword.trim().length < 6) {
        alert('New password must be at least 6 characters.');
        return;
      }
      if (editPassword.trim() !== confirmEditPassword.trim()) {
        alert('New password and confirm password do not match.');
        return;
      }
      updates.password = editPassword.trim();
    }

    updateUser(editingUser.id, updates);

    setEditingUser(null);
    showToast(`User ${editingUser.spiritual_name || editingUser.full_name} updated successfully!`);
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    const res = deleteUser(deletingUser.id);
    if (!res.success) {
      alert(res.message);
      return;
    }
    setDeletingUser(null);
    showToast(res.message);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs sm:text-sm font-semibold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
              Individual Account Security
            </span>
          </div>
          <h2 className="text-2xl font-black font-serif tracking-tight mt-1">
            Staff & Role-Based Access Control (RBAC)
          </h2>
          <p className="text-blue-100 text-xs mt-1 max-w-xl">
            In accordance with security best practices, each devotee staff member operates with an individual account. Shared credentials are strictly avoided to preserve audit integrity.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-white text-blue-950 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 shrink-0 active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-blue-800" />
            <span>Create Staff Account</span>
          </button>
        )}
      </div>

      {/* Role Matrix Explainer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200">
          <RoleBadge role="SUPER_ADMIN" />
          <p className="text-[11px] text-purple-900 mt-2 font-medium">
            Full root privileges. Can manage users, alter portal settings, view complete audit history, delete records.
          </p>
        </div>

        <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
          <RoleBadge role="ADMIN" />
          <p className="text-[11px] text-amber-900 mt-2 font-medium">
            Temple / Department Heads. Can add, edit, and delete devotees, inspect audit logs, and trigger exports.
          </p>
        </div>

        <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200">
          <RoleBadge role="STAFF" />
          <p className="text-[11px] text-blue-900 mt-2 font-medium">
            Devotee Care & Parcel workers. Can register devotees, update addresses & phones, log care calls. Cannot delete records.
          </p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <RoleBadge role="VIEWER" />
          <p className="text-[11px] text-slate-700 mt-2 font-medium">
            Read-only auditor. Can search and view directories and rosters. Write and update operations blocked by RLS.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCog className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Registered Portal Users ({usersList.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Current User: <strong className="text-slate-800">{currentUser.spiritual_name || currentUser.full_name}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">Email Account</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4 text-center">Role Governance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map((user) => {
                const isCurrentUser = user.id === currentUser.id;
                const isOwner = Boolean(user.is_owner || user.email.toLowerCase() === 'rothinroy0@gmail.com');
                const displayName = user.spiritual_name || user.full_name;

                return (
                  <tr key={user.id} className={`hover:bg-slate-50/80 transition-colors ${isOwner ? 'bg-amber-50/30' : ''}`}>
                    {/* Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <DevoteeAvatar
                          photoUrl={user.avatar_url}
                          name={displayName}
                          id={user.id}
                          size="sm"
                        />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span>{displayName}</span>
                            {isOwner && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-2xs flex items-center space-x-1">
                                <span>👑 Permanent Owner</span>
                              </span>
                            )}
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-100 text-blue-700">
                                You
                              </span>
                            )}
                          </div>
                          {user.spiritual_name && (
                            <div className="text-[11px] text-slate-400">Legal: {user.full_name}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email & Password Status */}
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <div className="font-semibold text-slate-800">{user.email}</div>
                      <div className="flex items-center space-x-1 text-[10px] text-emerald-700 font-sans mt-0.5 font-medium">
                        <KeyRound className="w-3 h-3 text-emerald-600" />
                        <span>Manual Password Protected</span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {user.department_name || 'All Departments'}
                    </td>

                    {/* Assigned Role */}
                    <td className="py-3 px-4">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Role Governance */}
                    <td className="py-3 px-4 text-center">
                      {isOwner ? (
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-bold inline-flex items-center space-x-1 shadow-2xs">
                          <span>👑 Super Admin (Permanent)</span>
                        </span>
                      ) : isSuperAdmin ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden hover:bg-slate-200/70 transition-colors cursor-pointer"
                        >
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="STAFF">STAFF</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Super Admin only</span>
                      )}
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          title="Edit user profile details and change manual password"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 active:scale-95 transition-all flex items-center space-x-1 shadow-2xs"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit / Password</span>
                        </button>

                        {isOwner ? (
                          <span
                            title="Permanent System Owner cannot be deleted"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed flex items-center space-x-1 shadow-2xs opacity-90"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Permanent</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeletingUser(user)}
                            disabled={isCurrentUser}
                            title={isCurrentUser ? 'You cannot delete your own currently active account' : 'Delete user account'}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 shadow-2xs ${
                              isCurrentUser
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-60'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-900 active:scale-95'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit User Account</h3>
                  <p className="text-xs text-slate-500">Update account credentials and role assignments</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Spiritual Name (Initiated)</label>
                <input
                  type="text"
                  value={editingUser.spiritual_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, spiritual_name: e.target.value })}
                  placeholder="e.g. HG Sundar Gopal Das"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legal Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  placeholder="e.g. Sundar Gopal Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Account (Login ID) *</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="e.g. sundar.gopal@iskcon.org"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Permission</label>
                  {editingUser.is_owner || editingUser.email.toLowerCase() === 'rothinroy0@gmail.com' ? (
                    <div className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl font-bold text-amber-900 text-xs flex items-center space-x-1.5 shadow-2xs">
                      <span>👑 Super Admin (Permanent Owner)</span>
                    </div>
                  ) : (
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="STAFF">STAFF</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={editingUser.department_name}
                    onChange={(e) => setEditingUser({ ...editingUser, department_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Avatar / Photo URL</label>
                <input
                  type="text"
                  value={editingUser.avatar_url || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, avatar_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Manual Password Update Section */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Manual Password Configuration</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Leave blank to retain current password. To create or change password manually, enter it below (min 6 chars).
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">New Manual Password</label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl pr-8 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Confirm Password</label>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={confirmEditPassword}
                      onChange={(e) => setConfirmEditPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs active:scale-95 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete User Account</h3>
                <p className="text-xs text-slate-500">This action will remove portal access.</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-xs text-rose-900 leading-relaxed">
              Are you sure you want to permanently delete account for{' '}
              <strong className="font-bold text-rose-950">
                {deletingUser.spiritual_name || deletingUser.full_name}
              </strong>{' '}
              (<span className="font-mono text-[11px]">{deletingUser.email}</span>)?
            </div>

            <div className="pt-2 flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl font-bold shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Staff User Account</h3>
                <p className="text-xs text-slate-500">
                  Add individual credentials for a temple devotee staff member.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address (Login) *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. gopika.dasi@iskcon.org"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legal Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="e.g. Geeta R. Nair"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Spiritual Name (Optional)</label>
                <input
                  type="text"
                  value={newUser.spiritual_name}
                  onChange={(e) => setNewUser({ ...newUser, spiritual_name: e.target.value })}
                  placeholder="e.g. Gopika Devi Dasi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Permission</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="VIEWER">VIEWER</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newUser.department_name}
                    onChange={(e) => setNewUser({ ...newUser, department_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Manual Password Setup Section */}
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200/80 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                  <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                  <span>Manual Password Setup *</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-tight">
                  Manually create a password for this staff member (min 6 characters). No default password will be assigned.
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Enter Password *</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl pr-8 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Confirm Password *</label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs active:scale-95 transition-all"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
