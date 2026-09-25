import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const { login, register, forgotPassword, resetPassword, error, setError } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('requester');
  const [departments, setDepartments] = useState(['ENG']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  const handleDeptToggle = (deptCode) => {
    if (departments.includes(deptCode)) {
      if (departments.length > 1) {
        setDepartments(departments.filter((d) => d !== deptCode));
      }
    } else {
      setDepartments([...departments, deptCode]);
    }
  };

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId.trim() || !password) return;
    setSubmitting(true);
    await login(employeeId.trim(), password);
    setSubmitting(false);
  };

  const onRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId.trim() || !name.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    await register({ employeeId: employeeId.trim(), name: name.trim(), password, role, departments });
    setSubmitting(false);
  };

  const onForgotSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('Please enter your Employee ID.');
      return;
    }
    setSubmitting(true);
    const res = await forgotPassword(employeeId.trim());
    setSubmitting(false);
    if (res) {
      setSuccessMsg(res.message);
      setMode('reset');
    }
  };

  const onResetSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId.trim() || !resetToken.trim() || !newPassword) {
      setError('Please fill in Employee ID, Reset Authorization Token, and New Password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSubmitting(true);
    const ok = await resetPassword(employeeId.trim(), newPassword, resetToken.trim());
    setSubmitting(false);
    if (ok) {
      setSuccessMsg('Password reset successful! You can now sign in with your new password.');
      setMode('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden select-none bg-[#050B16]"
      style={{
        backgroundImage: 'url(/images/ir_login_bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 3. LOGIN PAGE RAILWAY BACKGROUND OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050B16]/88 via-[#0B1424]/78 to-[#050B16]/92 backdrop-blur-[1.5px]" />

      {/* Track geometry pattern overlay */}
      <div className="absolute inset-0 rail-grid-bg opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Brand & System Status Indicators Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#0B1424]/90 border-2 border-[#06B6D4]/60 shadow-[0_0_25px_rgba(6,182,212,0.3)] mb-3">
            <img src="/images/ir_emblem.svg" alt="Indian Railways Emblem" className="w-10 h-10 object-contain" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <h1 className="text-[26px] font-bold text-white tracking-wide font-display">SANCHALAN</h1>
            <span className="text-[13px] font-bold text-[#06B6D4] bg-[#06B6D4]/15 px-2.5 py-0.5 rounded border border-[#06B6D4]/40 font-mono">
              संचालन
            </span>
          </div>
          <div className="text-[11px] text-cyan-300 font-mono font-bold uppercase tracking-widest">
            Automatic Block Planning · Central Railway Region
          </div>
          <div className="text-[10px] text-amber-400 mt-1 font-mono font-bold tracking-wider">
            INDIAN RAILWAYS · OPERATIONS · ENGINEERING · CONTROL SYSTEM
          </div>

          {/* Operational status pills */}
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded bg-[#0B1424]/90 border border-[#26364D] text-emerald-400 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10B981]" />
              COA SYNCED
            </div>
            <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded bg-[#0B1424]/90 border border-[#26364D] text-cyan-300 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
              CONTROL SYSTEM ONLINE
            </div>
            <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded bg-[#0B1424]/90 border border-[#26364D] text-amber-300 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              SECURE OPERATIONAL GATEWAY
            </div>
          </div>
        </div>

        {/* Console Panel Card */}
        <div className="bg-[#0B1424]/90 backdrop-blur-md border border-[#26364D] rounded-md shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Auth Mode Tabs */}
          <div className="flex border-b border-[#26364D] bg-[#050B16]/90 text-[12px] font-mono">
            {[
              { id: 'login', label: 'Sign In' },
              { id: 'register', label: 'Register' },
              { id: 'forgot', label: 'Reset Password' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchMode(tab.id === 'forgot' ? 'forgot' : tab.id)}
                className={`flex-1 py-3 px-2 font-bold transition-all border-b-2 uppercase tracking-wider ${
                  (tab.id === 'forgot' ? mode === 'forgot' || mode === 'reset' : mode === tab.id)
                    ? 'border-[#06B6D4] text-[#06B6D4] bg-[#101B2D]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#101B2D]/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Notifications */}
            {error && (
              <div className="text-[12px] mb-4 px-3 py-2.5 rounded font-mono font-medium bg-red-950/60 border border-red-700/60 text-red-300 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="text-[12px] mb-4 px-3 py-2.5 rounded font-mono font-medium bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                {successMsg}
              </div>
            )}

            {/* Mode 1: Sign In */}
            {mode === 'login' && (
              <form onSubmit={onLoginSubmit} className="space-y-4">
                <p className="text-[11.5px] text-slate-300 mb-2 font-sans">
                  Sign in with your Railway Employee ID and Division to access the central control room console.
                </p>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono" htmlFor="loginEmpId">
                    Employee ID
                  </label>
                  <input
                    id="loginEmpId"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. SR-DEN-01 or CTRL-NDLS-04"
                    autoFocus
                    autoComplete="username"
                    className="w-full bg-[#101B2D] border border-[#26364D] rounded px-3 py-2.5 text-[13px] text-white placeholder-slate-500 outline-none focus:border-[#06B6D4] transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono" htmlFor="loginPassword">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="loginPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      className="w-full bg-[#101B2D] border border-[#26364D] rounded pl-3 pr-10 py-2.5 text-[13px] text-white placeholder-slate-500 outline-none focus:border-[#06B6D4] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 select-none"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Region / Division
                  </label>
                  <select
                    defaultValue="CR-BPL"
                    className="w-full bg-[#101B2D] border border-[#26364D] rounded px-3 py-2.5 text-[12.5px] text-white outline-none focus:border-[#06B6D4] font-mono"
                  >
                    <option value="CR-BPL">Central Railway · Bhopal Division (BPL)</option>
                    <option value="CR-JHS">Central Railway · Jhansi Division (JHS)</option>
                    <option value="NR-NDLS">Northern Railway · Delhi Division (NDLS)</option>
                    <option value="WCR-ET">West Central Railway · Itarsi Division (ET)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full text-[13px] font-bold font-mono uppercase tracking-wider text-slate-950 py-3 rounded disabled:opacity-50 transition-all bg-[#06B6D4] hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] mt-2"
                >
                  {submitting ? 'Authenticating Console…' : 'SIGN IN TO SANCHALAN CONSOLE'}
                </button>
              </form>
            )}

            {/* Mode 2: Register */}
            {mode === 'register' && (
              <form onSubmit={onRegisterSubmit} className="space-y-3">
                <p className="text-[11.5px] text-slate-300 mb-1">Create a new railway controller or department user account.</p>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono" htmlFor="regEmpId">Employee ID *</label>
                  <input
                    id="regEmpId" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. ENG-105" autoFocus
                    className="w-full bg-[#101B2D] border border-[#26364D] rounded px-3 py-2 text-[12.5px] text-white placeholder-slate-500 outline-none focus:border-[#06B6D4] transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono" htmlFor="regName">Full Name *</label>
                  <input
                    id="regName" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-[#101B2D] border border-[#26364D] rounded px-3 py-2 text-[12.5px] text-white placeholder-slate-500 outline-none focus:border-[#06B6D4] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono" htmlFor="regPassword">Password *</label>
                  <div className="relative">
                    <input
                      id="regPassword" type={showPassword ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#101B2D] border border-[#26364D] rounded pl-3 pr-10 py-2 text-[12.5px] text-white placeholder-slate-500 outline-none focus:border-[#06B6D4] transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono" htmlFor="regRole">Role</label>
                  <select
                    id="regRole" value={role} onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#101B2D] border border-[#26364D] rounded px-3 py-2 text-[12.5px] text-white outline-none focus:border-[#06B6D4] transition-all font-mono"
                  >
                    <option value="requester">Requester (P.Way / TRAC / S&T Field Engineer)</option>
                    <option value="controller">Controller (Section / Power Controller)</option>
                    <option value="approver">Approver (Sr. DEN / Sr. DOM / Sr. DSTE)</option>
                    <option value="viewer">Viewer (Operations Executive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Departments</label>
                  <div className="flex gap-2">
                    {['ENG', 'TRAC', 'SNT'].map((d) => (
                      <button
                        key={d} type="button" onClick={() => handleDeptToggle(d)}
                        className={`flex-1 text-[11px] px-2 py-1.5 rounded border font-mono font-bold transition-all ${
                          departments.includes(d)
                            ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4]'
                            : 'bg-[#101B2D] border-[#26364D] text-slate-400 hover:border-slate-500 hover:text-slate-200'
                        }`}
                      >
                        {d === 'ENG' ? 'P.Way' : d === 'TRAC' ? 'OHE' : 'S&T'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit" disabled={submitting}
                  className="w-full text-[12.5px] font-bold font-mono uppercase text-slate-950 py-2.5 rounded disabled:opacity-50 transition-all bg-[#06B6D4] hover:bg-cyan-400 mt-2"
                >
                  {submitting ? 'Registering...' : 'REGISTER CONSOLE ACCOUNT'}
                </button>
              </form>
            )}

            {/* Mode 3 & 4: Reset Password */}
            {(mode === 'forgot' || mode === 'reset') && (
              <form onSubmit={mode === 'forgot' ? onForgotSubmit : onResetSubmit} className="space-y-3">
                <p className="text-[11.5px] text-slate-300 mb-1">Request or submit authorization token to reset credentials.</p>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono" htmlFor="forgotEmpId">Employee ID</label>
                  <input
                    id="forgotEmpId" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. SR-DEN-01" autoFocus
                    className="w-full bg-[#101B2D] border border-[#26364D] rounded px-3 py-2 text-[12.5px] text-white placeholder-slate-500 outline-none focus:border-[#06B6D4] transition-all font-mono"
                  />
                </div>

                {mode === 'reset' && (
                  <>
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Reset Token *</label>
                      <input
                        value={resetToken} onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Paste authorization token"
                        className="w-full bg-[#101B2D] border border-[#26364D] rounded px-3 py-2 text-[12px] text-white placeholder-slate-500 outline-none focus:border-[#06B6D4] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">New Password *</label>
                      <input
                        type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full bg-[#101B2D] border border-[#26364D] rounded px-3 py-2 text-[12.5px] text-white focus:border-[#06B6D4]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Confirm New Password *</label>
                      <input
                        type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full bg-[#101B2D] border border-[#26364D] rounded px-3 py-2 text-[12.5px] text-white focus:border-[#06B6D4]"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit" disabled={submitting}
                  className="w-full text-[12.5px] font-bold font-mono uppercase text-slate-950 py-2.5 rounded disabled:opacity-50 transition-all bg-[#06B6D4] hover:bg-cyan-400"
                >
                  {submitting ? 'Processing...' : mode === 'forgot' ? 'REQUEST RESET TOKEN' : 'RESET PASSWORD'}
                </button>

                <div className="text-center text-[11px] text-slate-400 font-mono">
                  {mode === 'forgot' ? (
                    <button type="button" onClick={() => switchMode('reset')} className="text-[#06B6D4] hover:underline">
                      Have a token? Enter Token →
                    </button>
                  ) : (
                    <button type="button" onClick={() => switchMode('forgot')} className="text-[#06B6D4] hover:underline">
                      Need a token? Apply Here →
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Console Footer */}
          <div className="px-6 py-3 bg-[#050B16] border-t border-[#26364D] text-center font-mono">
            <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider font-semibold">
              SECURE ACCESS CONTROL · INDIAN RAILWAYS CENTRAL REGION
            </p>
          </div>
        </div>

        {/* Bottom System Identity */}
        <div className="text-center mt-4 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
          Ministry of Railways · Govt. of India · Build v2.0 KAVACH COMPLIANT
        </div>
      </div>
    </div>
  );

}
