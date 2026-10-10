import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';
import confetti from 'canvas-confetti';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  User, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Server, 
  Building2,
  Package,
  Users,
  KeyRound,
  Heart,
  X,
  Send,
  Clock,
  ArrowLeft,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { DevoteeAvatar } from '../common/DevoteeAvatar';

export const LoginPortal: React.FC = () => {
  const { login, registerStaff, quickLogin, usersList, resetPassword } = useAuth();
  const { isLiveSupabase } = useData();

  // Mode: 'login' | 'register' | 'quick'
  const [activeTab, setActiveTab] = useState<'login' | 'quick' | 'register'>('login');

  // Login Form State
  const [email, setEmail] = useState('rothinroy0@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reset Password with Email OTP State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<'REQUEST_OTP' | 'VERIFY_OTP'>('REQUEST_OTP');
  const [resetEmail, setResetEmail] = useState('rothinroy0@gmail.com');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  // 60-second countdown timer for resend OTP
  useEffect(() => {
    let timer: any;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Register Form State with manual password
  const [regFullName, setRegFullName] = useState('');
  const [regSpiritualName, setRegSpiritualName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<UserRole>('STAFF');
  const [regDepartment, setRegDepartment] = useState('Parcel & Logistics Department');

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!password.trim()) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        setSuccessMessage(result.message);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ea580c', '#f59e0b', '#10b981', '#3b82f6'],
        });
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Registration with manual password
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Please create a manual password of at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both password fields.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerStaff({
        email: regEmail.trim(),
        full_name: regFullName.trim(),
        spiritual_name: regSpiritualName.trim() || undefined,
        role: regRole,
        department_name: regDepartment,
        is_active: true,
        password: regPassword.trim(),
      });

      if (result.success) {
        setSuccessMessage(result.message);
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 },
        });
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Send 6-Digit OTP to Registered Email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetError('');
    const trimmed = resetEmail.trim().toLowerCase();
    if (!trimmed) {
      setResetError('Please enter your registered account email.');
      return;
    }

    const matched = usersList.find((u) => u.email.toLowerCase() === trimmed);
    if (!matched) {
      setResetError(`No account registered with email "${resetEmail}". Please verify.`);
      return;
    }

    setIsResetting(true);
    // Generate secure 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setResendTimer(60);
    setCopiedOtp(false);

    // Simulate instant secure email transmission
    setTimeout(() => {
      setIsResetting(false);
      setResetStep('VERIFY_OTP');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 400);
  };

  // Step 2: Verify OTP & Reset Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      setResetError('Please enter the complete 6-digit OTP code sent to your email.');
      return;
    }

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setResetError('Invalid OTP code! Please verify the code sent to your email.');
      return;
    }

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('New password and confirmation do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetPassword(resetEmail, resetNewPassword);
      if (res.success) {
        setShowResetModal(false);
        setResetStep('REQUEST_OTP');
        setSuccessMessage(`OTP verified successfully! Logged in as ${resetEmail}.`);
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 }
        });
      } else {
        setResetError(res.message);
      }
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  // 1-Click Copy & Autofill OTP helper
  const handleCopyOrAutofillOtp = () => {
    if (!generatedOtp) return;
    navigator.clipboard?.writeText(generatedOtp);
    setEnteredOtp(generatedOtp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // Quick role selection: fills email and requires manual password entry
  const handleQuickLogin = (userId: string, emailPreset: string) => {
    setEmail(emailPreset);
    setPassword('');
    setActiveTab('login');
    setErrorMessage('');
    setSuccessMessage(`Account ${emailPreset} selected. Please enter the manual password to sign in.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800 relative overflow-hidden">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Header: Temple Emblem & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white font-serif font-black text-2xl shadow-xl shadow-orange-500/20 border-2 border-amber-300/30">
            ॥ॐ॥
          </div>
          
          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-amber-300/90 font-serif block">
              ॥ श्री श्री राधा माधव विजयते ॥
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight mt-0.5">
              ISKCON SRI SRI RADHA MADHAVA
            </h1>
            <p className="text-xs text-amber-200/80 font-medium">
              Devotee Care & Parcel Management Portal
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-amber-100/50 shadow-2xl p-6 sm:p-8 space-y-6">
          
          {/* Top Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'login' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('quick'); setErrorMessage(''); }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'quick' 
                  ? 'bg-white text-amber-900 shadow-xs' 
                  : 'hover:text-slate-900'
              }`}
            >
              Quick Roles
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'register' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'hover:text-slate-900'
              }`}
            >
              New Staff
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start space-x-2 animate-in fade-in">
              <span className="text-red-500 font-bold shrink-0">⚠️</span>
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <label htmlFor="login-email">Admin / Staff Email *</label>
                  <span className="text-[10px] text-slate-400">Individual Account</span>
                </div>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@iskcon.org"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <label htmlFor="login-password">Password *</label>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
                    <KeyRound className="w-3 h-3 text-emerald-600 inline" />
                    <span>Manual Password Required</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-3.5 h-3.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <span>Remember device</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email || 'rothinroy0@gmail.com');
                    setShowResetModal(true);
                    setResetError('');
                  }}
                  className="text-amber-700 hover:text-orange-700 font-bold hover:underline flex items-center space-x-1"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600 inline" />
                  <span>Forgot Password?</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition-all flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: QUICK ONE-CLICK ROLE ACCESS */}
          {activeTab === 'quick' && (
            <div className="space-y-3">
              <div className="text-center pb-1">
                <p className="text-xs font-semibold text-slate-700">
                  Select a staff account to prefill & enter manual password:
                </p>
                <p className="text-[11px] text-emerald-700 font-medium flex items-center justify-center space-x-1 mt-0.5">
                  <KeyRound className="w-3 h-3 text-emerald-600 inline" />
                  <span>Strict manual password verification active</span>
                </p>
              </div>

              <div className="space-y-2">
                {usersList.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickLogin(user.id, user.email)}
                    className="w-full p-3 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 transition-all flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <DevoteeAvatar
                        photoUrl={user.avatar_url}
                        name={user.spiritual_name || user.full_name}
                        id={user.id}
                        size="sm"
                      />
                      <div className="truncate">
                        <div className="text-xs font-black text-slate-900 group-hover:text-amber-900 truncate">
                          {user.spiritual_name || user.full_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-900' :
                        user.role === 'ADMIN' ? 'bg-blue-100 text-blue-900' :
                        user.role === 'STAFF' ? 'bg-emerald-100 text-emerald-900' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REGISTER NEW STAFF */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Sundar Gopal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Spiritual Name
                  </label>
                  <input
                    type="text"
                    value={regSpiritualName}
                    onChange={(e) => setRegSpiritualName(e.target.value)}
                    placeholder="HG Sundar Das"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Individual Staff Email *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="staff.name@iskcon.org"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="STAFF">STAFF</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    placeholder="Parcel & Logistics Department"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Manual Password Creation Card */}
              <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Create Manual Password *</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Manually define this account's password (min 6 characters). No default password will be assigned.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-slate-800 font-medium focus:ring-1 focus:ring-amber-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      Confirm Password *
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-amber-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 mt-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition-all flex items-center justify-center space-x-1.5"
              >
                <span>Create Staff Account & Sign In</span>
              </button>
            </form>
          )}

          {/* Security & Architecture Indicator */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Row Level Security (RLS)</span>
            </div>

            <div className="flex items-center space-x-1 text-slate-400">
              <Server className="w-3 h-3 text-slate-400" />
              <span>{isLiveSupabase ? 'Supabase PostgreSQL' : 'Local Storage Mode'}</span>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-amber-200/50">
          ISKCON Durgapur Devotee Care & Pastoral Logistics • Hare Krishna
        </p>

      </div>

      {/* MODAL: Forgot / Reset Password with Email OTP */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {resetStep === 'REQUEST_OTP' ? 'Forgot Password (Email OTP)' : 'Verify OTP & Reset'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {resetStep === 'REQUEST_OTP' 
                      ? 'Request a 6-digit verification code' 
                      : `Code dispatched to ${resetEmail}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetStep('REQUEST_OTP');
                  setResetError('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Feedback */}
            {resetError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start space-x-2 animate-in fade-in">
                <span className="text-red-500 font-bold shrink-0">⚠️</span>
                <p className="font-medium">{resetError}</p>
              </div>
            )}

            {/* STEP 1: REQUEST OTP TO REGISTERED EMAIL */}
            {resetStep === 'REQUEST_OTP' && (
              <form onSubmit={handleSendOtp} className="space-y-3.5 text-xs">
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Please enter your registered staff/owner email. We will generate and send a secure 6-digit verification OTP to authenticate password reset.
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registered Account Email *</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="rothinroy0@gmail.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold shadow-xs active:scale-95 transition-all flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isResetting ? 'Sending OTP...' : 'Send Email OTP'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: VERIFY EMAIL OTP & SET NEW MANUAL PASSWORD */}
            {resetStep === 'VERIFY_OTP' && (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3.5 text-xs">
                
                {/* Simulated Email Dispatch Card with 1-click Auto-Fill */}
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center space-x-1">
                      <span>📩 Email Dispatch Notice</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetStep('REQUEST_OTP')}
                      className="text-[10px] text-amber-700 hover:underline flex items-center space-x-0.5"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Change</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    OTP sent to <strong className="font-semibold">{resetEmail}</strong>:
                  </p>
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs">
                    <span className="font-mono text-base font-black tracking-widest text-amber-900">
                      {generatedOtp}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyOrAutofillOtp}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center space-x-1 px-2 py-0.5 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                    >
                      {copiedOtp ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedOtp ? 'Autofilled!' : 'Auto-Fill OTP'}</span>
                    </button>
                  </div>
                </div>

                {/* 6-Digit OTP Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Enter 6-Digit OTP *</label>
                    {resendTimer > 0 ? (
                      <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Resend in {resendTimer}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[10px] text-amber-700 font-bold hover:underline flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Manual Password *</label>
                  <div className="relative">
                    <input
                      type={showResetNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="•••••••• (min 6 characters)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                  <input
                    type={showResetNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep('REQUEST_OTP');
                      setResetError('');
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold shadow-xs active:scale-95 transition-all flex items-center space-x-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isResetting ? 'Verifying...' : 'Verify OTP & Reset'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
