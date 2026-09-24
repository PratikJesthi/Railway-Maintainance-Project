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
    await register({
      employeeId: employeeId.trim(),
      name: name.trim(),
      password,
      role,
      departments,
    });
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-cream-50 border border-cream-300 rounded-card shadow-panel p-6">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-2xl leading-none">🚦</span>
          <div>
            <div className="font-display font-semibold text-[16px] text-ink-900 tracking-tight">SANCHALAN</div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-500 font-medium">संचालन · Block Planning Console</div>
          </div>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex border-b border-cream-300 mb-5 text-[12.5px]">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`pb-2 px-3 font-medium transition-colors border-b-2 ${
              mode === 'login' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`pb-2 px-3 font-medium transition-colors border-b-2 ${
              mode === 'register' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => switchMode('forgot')}
            className={`pb-2 px-3 font-medium transition-colors border-b-2 ${
              mode === 'forgot' || mode === 'reset'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            Reset Password
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="text-[11.5px] mb-4 px-3 py-2 rounded-md font-medium" style={{ background: '#FBEEEA', color: '#8F3A28' }}>
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div className="text-[11.5px] mb-4 px-3 py-2 rounded-md font-medium leading-relaxed" style={{ background: '#EAF6EE', color: '#2E6D44' }}>
            ✅ {successMsg}
          </div>
        )}

        {/* Mode 1: Sign In */}
        {mode === 'login' && (
          <form onSubmit={onLoginSubmit}>
            <p className="text-[11.5px] text-ink-500 mb-4">Sign in with your employee ID to access the console.</p>

            <label className="block text-[11px] text-ink-500 mb-1" htmlFor="loginEmpId">Employee ID</label>
            <input
              id="loginEmpId"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. SR-DEN-01"
              autoFocus
              autoComplete="username"
              className="w-full mb-3 bg-cream-100 border border-cream-300 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan-500"
            />

            <label className="block text-[11px] text-ink-500 mb-1" htmlFor="loginPassword">Password</label>
            <div className="relative mb-4">
              <input
                id="loginPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-cream-100 border border-cream-300 rounded-md pl-3 pr-10 py-2 text-[13px] outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-ink-500 hover:text-ink-900 select-none px-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-[12.5px] font-medium text-white py-2.5 rounded-md disabled:opacity-60 transition-opacity"
              style={{ background: '#0F7A73' }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {/* Mode 2: New Registration / Sign Up */}
        {mode === 'register' && (
          <form onSubmit={onRegisterSubmit}>
            <p className="text-[11.5px] text-ink-500 mb-4">Create a new user account for SANCHALAN.</p>

            <label className="block text-[11px] text-ink-500 mb-1" htmlFor="regEmpId">Employee ID *</label>
            <input
              id="regEmpId"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. ENG-105"
              autoFocus
              className="w-full mb-3 bg-cream-100 border border-cream-300 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan-500"
            />

            <label className="block text-[11px] text-ink-500 mb-1" htmlFor="regName">Full Name *</label>
            <input
              id="regName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full mb-3 bg-cream-100 border border-cream-300 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan-500"
            />

            <label className="block text-[11px] text-ink-500 mb-1" htmlFor="regPassword">Password *</label>
            <div className="relative mb-3">
              <input
                id="regPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-cream-100 border border-cream-300 rounded-md pl-3 pr-10 py-2 text-[13px] outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-ink-500 hover:text-ink-900 select-none px-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <label className="block text-[11px] text-ink-500 mb-1" htmlFor="regRole">Role</label>
            <select
              id="regRole"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mb-3 bg-cream-100 border border-cream-300 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan-500"
            >
              <option value="requester">Requester (Department Staff)</option>
              <option value="controller">Controller (Section Controller)</option>
              <option value="approver">Approver (Sr. DEN / Sr. DOM / Sr. DSTE)</option>
              <option value="viewer">Viewer (Read-only / Management)</option>
            </select>

            <label className="block text-[11px] text-ink-500 mb-1">Departments</label>
            <div className="flex gap-2 mb-4">
              {['ENG', 'TRAC', 'SNT'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDeptToggle(d)}
                  className={`text-[11.5px] px-3 py-1.5 rounded-md border font-medium transition-colors ${
                    departments.includes(d)
                      ? 'bg-cyan-100 border-cyan-500 text-cyan-900'
                      : 'bg-cream-100 border-cream-300 text-ink-500 hover:border-cream-400'
                  }`}
                >
                  {d === 'ENG' ? 'Engineering' : d === 'TRAC' ? 'Traction' : 'S&T'}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-[12.5px] font-medium text-white py-2.5 rounded-md disabled:opacity-60 transition-opacity"
              style={{ background: '#0F7A73' }}
            >
              {submitting ? 'Creating Account…' : 'Register Account'}
            </button>
          </form>
        )}

        {/* Mode 3: Request Password Reset Token */}
        {mode === 'forgot' && (
          <form onSubmit={onForgotSubmit}>
            <p className="text-[11.5px] text-ink-500 mb-4">Enter your Employee ID to request password reset authorization.</p>

            <label className="block text-[11px] text-ink-500 mb-1" htmlFor="forgotEmpId">Employee ID</label>
            <input
              id="forgotEmpId"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. SR-DEN-01"
              autoFocus
              className="w-full mb-3 bg-cream-100 border border-cream-300 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-[12.5px] font-medium text-white py-2.5 rounded-md disabled:opacity-60 transition-opacity mb-3"
              style={{ background: '#0F7A73' }}
            >
              {submitting ? 'Submitting Request…' : 'Apply for Reset Token'}
            </button>

            <div className="text-center text-[11px] text-ink-500">
              Already have a token?{' '}
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="text-cyan-700 font-semibold underline hover:text-cyan-900"
              >
                Enter Token &amp; Reset Password →
              </button>
            </div>
          </form>
        )}

        {/* Mode 4: Reset Password with Signed Token */}
        {mode === 'reset' && (
          <form onSubmit={onResetSubmit}>
            <p className="text-[11.5px] text-ink-500 mb-4">Provide your Employee ID, Reset Authorization Token, and new password.</p>

            <label className="block text-[11px] text-ink-500 mb-1" htmlFor="resetEmpId">Employee ID</label>
            <input
              id="resetEmpId"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. SR-DEN-01"
              className="w-full mb-3 bg-cream-100 border border-cream-300 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan-500"
            />

            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] text-ink-500" htmlFor="resetTokenInput">Reset Authorization Token *</label>
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-[10.5px] text-cyan-700 font-semibold underline hover:text-cyan-900"
              >
                Apply for Token →
              </button>
            </div>
            <input
              id="resetTokenInput"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              placeholder="Paste reset authorization token"
              className="w-full mb-3 bg-cream-100 border border-cream-300 rounded-md px-3 py-2 text-[12px] font-mono outline-none focus:border-cyan-500"
            />

            <label className="block text-[11px] text-ink-500 mb-1" htmlFor="resetNewPassword">New Password *</label>
            <div className="relative mb-3">
              <input
                id="resetNewPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-cream-100 border border-cream-300 rounded-md pl-3 pr-10 py-2 text-[13px] outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-ink-500 hover:text-ink-900 select-none px-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <label className="block text-[11px] text-ink-500 mb-1" htmlFor="resetConfirmPassword">Confirm New Password *</label>
            <input
              id="resetConfirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full mb-4 bg-cream-100 border border-cream-300 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-[12.5px] font-medium text-white py-2.5 rounded-md disabled:opacity-60 transition-opacity mb-3"
              style={{ background: '#0F7A73' }}
            >
              {submitting ? 'Verifying & Resetting…' : 'Reset Password'}
            </button>

            <div className="text-center text-[11px] text-ink-500">
              Need to request a token first?{' '}
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-cyan-700 font-semibold underline hover:text-cyan-900"
              >
                Apply for Token →
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <p className="text-[10.5px] text-ink-500 mt-5 text-center leading-relaxed border-t border-cream-200 pt-3">
          Access is department-scoped — Engineering, Traction, and S&amp;T permissions are enforced automatically.
        </p>
      </div>
    </div>
  );
}


