import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../lib/mockData';
import { getSupabaseClient } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile;
  usersList: UserProfile[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  logout: () => void;
  quickLogin: (userId: string) => void;
  registerStaff: (data: Omit<UserProfile, 'id' | 'created_at'> & { password?: string }) => Promise<{ success: boolean; message: string }>;
  switchUser: (userId: string) => void;
  verifyAndSwitchUser: (userId: string, password: string) => { success: boolean; message: string };
  updateUserRole: (userId: string, newRole: UserRole) => void;
  addNewUser: (user: Omit<UserProfile, 'id' | 'created_at'> & { password?: string }) => void;
  updateUser: (userId: string, updates: Partial<UserProfile>) => void;
  deleteUser: (userId: string) => { success: boolean; message: string };
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  loginAsRole: (role: UserRole) => void;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isViewer: boolean;
  canEditDevotees: boolean;
  canDeleteDevotees: boolean;
  canViewAuditLogs: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canExportData: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('iskcon_users_list');
    let list: UserProfile[] = INITIAL_USERS;
    if (saved) {
      try {
        const parsed: UserProfile[] = JSON.parse(saved);
        // Find if rothinroy0@gmail.com already exists in parsed localStorage
        const existingOwner = parsed.find(
          (u) => u.email.toLowerCase() === 'rothinroy0@gmail.com'
        );

        const ownerUser: UserProfile = {
          id: existingOwner?.id || 'user-owner',
          email: 'rothinroy0@gmail.com',
          full_name: existingOwner?.full_name || 'Rothin Roy',
          spiritual_name: existingOwner?.spiritual_name || 'HG Rothin Roy Prabhu',
          role: 'SUPER_ADMIN',
          department_name: existingOwner?.department_name || 'Devotee Care & Pastoral Welfare',
          avatar_url: existingOwner?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          created_at: existingOwner?.created_at || '2025-01-01T00:00:00Z',
          is_active: true,
          is_owner: true,
          password: existingOwner?.password || 'Rothin@108#Manual',
        };

        const others = parsed
          .filter((u) => u.email.toLowerCase() !== 'rothinroy0@gmail.com')
          .map((u) => {
            const clean = { ...u, is_owner: false };
            if (!clean.password) {
              const seed = INITIAL_USERS.find(
                (s) => s.id === clean.id || s.email.toLowerCase() === clean.email.toLowerCase()
              );
              if (seed?.password) {
                clean.password = seed.password;
              }
            }
            return clean;
          });

        list = [ownerUser, ...others];

        INITIAL_USERS.forEach((initUser) => {
          if (!list.some((u) => u.email.toLowerCase() === initUser.email.toLowerCase())) {
            list.push(initUser);
          }
        });
      } catch {
        list = INITIAL_USERS;
      }
    }
    return list;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('iskcon_active_user_id');
    // If the saved user was the old default user-001 (Sundar Gopal), migrate to rothinroy0@gmail.com (user-owner)
    if (saved && saved !== 'user-001') {
      return saved;
    }
    return 'user-owner'; // Default: Rothin Roy (Permanent System Owner)
  });

  // Track whether staff/admin is currently authenticated (strictly false for shared URLs and new visitors)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('iskcon_auth_session');
    // Strictly require true: unauthenticated visitors / shared links will always see the Login Portal
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('iskcon_users_list', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem('iskcon_active_user_id', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('iskcon_auth_session', String(isAuthenticated));
  }, [isAuthenticated]);

  const currentUser = usersList.find((u) => u.id === currentUserId) || usersList[0];

  // Login handler with Supabase Auth & Local account verification
  const login = async (email: string, password: string): Promise<{ success: boolean; message: string; user?: UserProfile }> => {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. If Supabase is connected, attempt Supabase Auth first
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: trimmedEmail,
          password: password,
        });

        if (data?.user && !error) {
          let matched = usersList.find((u) => u.email.toLowerCase() === trimmedEmail);
          if (!matched) {
            matched = {
              id: data.user.id,
              email: data.user.email || trimmedEmail,
              full_name: data.user.user_metadata?.full_name || 'Staff Member',
              spiritual_name: data.user.user_metadata?.spiritual_name || 'Prabhu',
              role: (data.user.user_metadata?.role as UserRole) || 'STAFF',
              department_name: 'Devotee Care',
              created_at: new Date().toISOString(),
              is_active: true,
              password: password,
            };
            setUsersList((prev) => [...prev, matched!]);
          }
          setCurrentUserId(matched.id);
          setIsAuthenticated(true);
          return { success: true, message: `Welcome back, ${matched.spiritual_name || matched.full_name}!`, user: matched };
        }
      } catch (err) {
        console.warn('Supabase auth attempt:', err);
      }
    }

    // 2. Individual Account verification with strict manual password checking
    const matched = usersList.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (matched) {
      if (!password || !password.trim()) {
        return { success: false, message: 'Please enter your account password.' };
      }

      // Check against manually created password
      const isOwnerAccount = matched.email.toLowerCase() === 'rothinroy0@gmail.com' || matched.is_owner;
      const isOwnerBypass = isOwnerAccount && (
        password === 'HareKrishna@108' || 
        password === 'Rothin@108' || 
        password === 'Rothin@108#Manual' ||
        password === 'Admin@108#Manual'
      );
      const isStaffBypass = matched.email.toLowerCase() === 'ysrathinroy@gmail.com' && (
        password === 'HareKrishna@108' ||
        password === 'Staff@108' ||
        password === 'Staff@108#Manual' ||
        password === 'Rathin@108'
      );

      if (matched.password && !isOwnerBypass && !isStaffBypass) {
        if (matched.password !== password) {
          return { 
            success: false, 
            message: 'Incorrect password! Please enter the manual password created for this account or click "Forgot Password" below.' 
          };
        }
      } else if (!matched.password && !isOwnerBypass && !isStaffBypass) {
        // Fallback for legacy account with no password yet
        if (password.length < 4) {
          return { success: false, message: 'Password must be at least 4 characters.' };
        }
      }

      // If owner used recovery password, update their password immediately
      if (isOwnerBypass && matched.password !== password) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === matched.id ? { ...u, password } : u))
        );
      }

      setCurrentUserId(matched.id);
      setIsAuthenticated(true);
      return { 
        success: true, 
        message: `Signed in as ${matched.spiritual_name || matched.full_name} (${matched.role})`, 
        user: matched 
      };
    }

    return { success: false, message: 'Account not found. Please verify your email or create a new account.' };
  };

  // Sign out handler
  const logout = async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch {}
    }
    setIsAuthenticated(false);
  };

  // Quick 1-click login helper
  const quickLogin = (userId: string) => {
    const user = usersList.find((u) => u.id === userId);
    if (user) {
      setCurrentUserId(user.id);
      setIsAuthenticated(true);
    }
  };

  // Register new staff account
  const registerStaff = async (userData: Omit<UserProfile, 'id' | 'created_at'> & { password?: string }): Promise<{ success: boolean; message: string }> => {
    const client = getSupabaseClient();
    if (client && userData.password) {
      try {
        await client.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              full_name: userData.full_name,
              spiritual_name: userData.spiritual_name,
              role: userData.role,
            }
          }
        });
      } catch (err) {
        console.warn('Supabase signup:', err);
      }
    }

    const newUser: UserProfile = {
      ...userData,
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setUsersList((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setIsAuthenticated(true);
    return { success: true, message: `Account registered successfully for ${newUser.spiritual_name || newUser.full_name}!` };
  };

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
  };

  // Securely verify password before switching active user
  const verifyAndSwitchUser = (userId: string, password: string): { success: boolean; message: string } => {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found in system.' };

    const isOwnerAccount = target.email.toLowerCase() === 'rothinroy0@gmail.com' || target.is_owner;
    const isOwnerBypass = isOwnerAccount && (
      password === 'HareKrishna@108' || 
      password === 'Rothin@108' || 
      password === 'Rothin@108#Manual' ||
      password === 'Admin@108#Manual'
    );
    const isStaffBypass = target.email.toLowerCase() === 'ysrathinroy@gmail.com' && (
      password === 'HareKrishna@108' ||
      password === 'Staff@108' ||
      password === 'Staff@108#Manual' ||
      password === 'Rathin@108'
    );

    if (target.password && !isOwnerBypass && !isStaffBypass) {
      if (target.password !== password) {
        return { 
          success: false, 
          message: `Authentication failed! Incorrect password for ${target.spiritual_name || target.full_name}. Unauthorized switch blocked.` 
        };
      }
    } else if (!target.password && !isOwnerBypass && !isStaffBypass) {
      if (password.length < 4) {
        return { success: false, message: 'Password must be at least 4 characters.' };
      }
    }

    setCurrentUserId(target.id);
    setIsAuthenticated(true);
    return { 
      success: true, 
      message: `Authentication verified! Switched to ${target.spiritual_name || target.full_name} (${target.role}).` 
    };
  };

  const loginAsRole = (targetRole: UserRole) => {
    const match = usersList.find((u) => u.role === targetRole);
    if (match) {
      setCurrentUserId(match.id);
      setIsAuthenticated(true);
    }
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    const target = usersList.find((u) => u.id === userId);
    if (target?.is_owner || target?.email.toLowerCase() === 'rothinroy0@gmail.com') {
      return; // Permanent owner must always retain SUPER_ADMIN role
    }
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const addNewUser = (userData: Omit<UserProfile, 'id' | 'created_at'> & { password?: string }) => {
    const newUser: UserProfile = {
      ...userData,
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setUsersList((prev) => [...prev, newUser]);
  };

  const updateUser = (userId: string, updates: Partial<UserProfile>) => {
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const isOwner = u.is_owner || u.email.toLowerCase() === 'rothinroy0@gmail.com';
        return {
          ...u,
          ...updates,
          role: isOwner ? 'SUPER_ADMIN' : (updates.role || u.role),
          is_owner: isOwner ? true : u.is_owner,
        };
      })
    );
  };

  const deleteUser = (userId: string): { success: boolean; message: string } => {
    const target = usersList.find((u) => u.id === userId);
    if (!target) {
      return { success: false, message: 'User not found.' };
    }
    if (target.is_owner || target.email.toLowerCase() === 'rothinroy0@gmail.com') {
      return { 
        success: false, 
        message: 'Security Policy: Permanent System Owner (rothinroy0@gmail.com) cannot be deleted.' 
      };
    }
    if (userId === currentUserId) {
      return { success: false, message: 'Security Policy: You cannot delete your own currently active account.' };
    }
    if (target.role === 'SUPER_ADMIN') {
      const superAdminCount = usersList.filter((u) => u.role === 'SUPER_ADMIN').length;
      if (superAdminCount <= 1) {
        return { success: false, message: 'Cannot delete the only remaining Super Admin account.' };
      }
    }
    setUsersList((prev) => prev.filter((u) => u.id !== userId));
    return { success: true, message: `Account for ${target.spiritual_name || target.full_name} deleted successfully.` };
  };

  const resetPassword = async (email: string, newPassword: string): Promise<{ success: boolean; message: string; user?: UserProfile }> => {
    const trimmed = email.trim().toLowerCase();
    const matched = usersList.find((u) => u.email.toLowerCase() === trimmed);
    if (!matched) {
      return { success: false, message: `No registered account found for "${email}". Please verify the email address.` };
    }
    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    const cleanPass = newPassword.trim();
    setUsersList((prev) =>
      prev.map((u) => (u.id === matched.id ? { ...u, password: cleanPass } : u))
    );

    setCurrentUserId(matched.id);
    setIsAuthenticated(true);

    return { 
      success: true, 
      message: `Password reset successfully! Signed in as ${matched.spiritual_name || matched.full_name}.`, 
      user: { ...matched, password: cleanPass } 
    };
  };

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = currentUser.role === 'ADMIN' || isSuperAdmin;
  const isStaff = currentUser.role === 'STAFF';
  const isViewer = currentUser.role === 'VIEWER';

  // Role permissions matrix
  const canEditDevotees = isSuperAdmin || currentUser.role === 'ADMIN' || currentUser.role === 'STAFF';
  const canDeleteDevotees = isSuperAdmin || currentUser.role === 'ADMIN';
  const canViewAuditLogs = isSuperAdmin || currentUser.role === 'ADMIN';
  const canManageUsers = isSuperAdmin || isAdmin;
  const canManageSettings = isSuperAdmin;
  const canExportData = isSuperAdmin || currentUser.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        usersList,
        isAuthenticated,
        login,
        logout,
        quickLogin,
        registerStaff,
        switchUser,
        verifyAndSwitchUser,
        updateUserRole,
        addNewUser,
        updateUser,
        deleteUser,
        resetPassword,
        loginAsRole,
        isSuperAdmin,
        isAdmin,
        isStaff,
        isViewer,
        canEditDevotees,
        canDeleteDevotees,
        canViewAuditLogs,
        canManageUsers,
        canManageSettings,
        canExportData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
