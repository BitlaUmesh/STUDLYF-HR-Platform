import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Building2, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { Button, Input } from '../components/ui';
import { getErrorMessage } from '../api/client';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500' };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-emerald-500' };
  return { score, label: 'Very Strong', color: 'bg-emerald-600' };
}

const STEP_LABELS = ['Your Details', 'Your Company', 'Verify Email'];

export function SignupPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 6-Digit OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resending, setResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const passwordStrength = getPasswordStrength(form.password);
  const passwordsMatch = form.password === form.confirmPassword;
  const confirmError =
    form.confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : '';

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setStep(1);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyName.trim()) {
      setError('Please enter your company name.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.sendSignupOtp(form.email);
      setSuccessMessage(`A 6-digit code has been sent to ${form.email}`);
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send verification code'));
    } finally {
      setLoading(false);
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      setError('Please enter all 6 digits of the OTP code.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await authApi.verifySignupOtp({
        email: form.email,
        otp,
        fullName: form.fullName,
        password: form.password,
        companyName: form.companyName,
      });

      // Log in session
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid or expired 6-digit verification code.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setResending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await authApi.sendSignupOtp(form.email);
      setSuccessMessage('A fresh 6-digit verification code has been sent!');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resend verification code.'));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left Branded Panel ── */}
      <div className="auth-brand-panel hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative">
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1.5 shadow-2xl shrink-0">
              <img src="/logo-s.png" alt="S Logo" className="h-full w-full object-contain filter drop-shadow-lg" />
            </div>
            <div className="flex flex-col">
              <img src="/studlyf-logo-white.png" alt="STUDLYF" className="h-6 object-contain" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">HR Platform</span>
            </div>
          </div>
          <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Start hiring the<br />
            <span className="gradient-text">next generation</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-xs">
            Set up your workspace in under 2 minutes and start discovering exceptional student talent today.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            'Free to get started — no credit card required',
            '6-Digit Email OTP verification for max security',
            'Full GitHub stats, hackathon scores, and skills data',
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <p className="text-sm text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex flex-1 items-center justify-center bg-[var(--color-canvas)] px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 p-1 shadow-sm shrink-0">
              <img src="/logo-s.png" alt="S Logo" className="h-full w-full object-contain" />
            </div>
            <img src="/studlyf-logo.png" alt="STUDLYF" className="h-6 object-contain" />
          </div>

          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      i < step
                        ? 'bg-emerald-500 text-white'
                        : i === step
                        ? 'bg-[var(--color-primary-vivid)] text-white'
                        : 'bg-[var(--color-line)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {i < step ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      i === step ? 'text-[var(--color-ink)]' : 'text-[var(--color-text-muted)]'
                    }`}
                  >
                    {label}
                  </span>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`h-px flex-1 transition-all ${i < step ? 'bg-emerald-400' : 'bg-[var(--color-line)]'}`} />
                  )}
                </div>
              ))}
            </div>
            <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">
              {step === 0 ? 'Create your account' : step === 1 ? 'Your company' : 'Verify Email OTP'}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {step === 0 ? 'Your personal details to get started.' : step === 1 ? 'Almost done — just your company info.' : `Enter the 6-digit code sent to ${form.email}`}
            </p>
          </div>

          {/* ── Step 0: Personal Details ── */}
          {step === 0 && (
            <form onSubmit={handleNext} className="space-y-4 animate-fade-in">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--color-text)]">Full name</label>
                <Input
                  required
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="Jane Doe"
                  leftIcon={<User size={16} />}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--color-text)]">Work email</label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@company.com"
                  leftIcon={<Mail size={16} />}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--color-text)]">Password</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="At least 8 characters"
                  leftIcon={<Lock size={16} />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer hover:text-[var(--color-text)] transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                {form.password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= passwordStrength.score ? passwordStrength.color : 'bg-[var(--color-line)]'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${
                      passwordStrength.score <= 2 ? 'text-red-500' :
                      passwordStrength.score <= 3 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--color-text)]">Confirm password</label>
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  placeholder="Re-enter your password"
                  leftIcon={<Lock size={16} />}
                  error={confirmError}
                  rightIcon={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="cursor-pointer hover:text-[var(--color-text)] transition-colors">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                  <p className="text-xs font-semibold text-red-600">{error}</p>
                </div>
              )}

              <Button type="submit" size="xl" className="w-full font-bold rounded-xl shadow-md">
                Next <ArrowRight size={16} />
              </Button>
            </form>
          )}

          {/* ── Step 1: Company Info ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4 animate-slide-in-right">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--color-text)]">Company name</label>
                <Input
                  required
                  value={form.companyName}
                  onChange={(e) => update('companyName', e.target.value)}
                  placeholder="Acme Inc."
                  leftIcon={<Building2 size={16} />}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                  <p className="text-xs font-semibold text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="xl"
                  className="flex-1 rounded-xl"
                  onClick={() => setStep(0)}
                >
                  Back
                </Button>
                <Button type="submit" loading={loading} size="xl" className="flex-1 font-bold rounded-xl shadow-md">
                  {!loading && <>Send OTP <ArrowRight size={16} /></>}
                </Button>
              </div>
            </form>
          )}

          {/* ── Step 2: 6-Digit Email OTP Verification ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-slide-in-right">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                  <ShieldCheck size={24} />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Enter 6-Digit Code
                </p>

                {/* 6 Digit Input Boxes */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="h-12 w-11 rounded-xl border-2 border-slate-200 text-center text-lg font-black text-slate-900 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all bg-white shadow-2xs"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              {successMessage && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-xs font-bold text-emerald-700 text-center">{successMessage}</p>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3">
                  <p className="text-xs font-bold text-rose-600 text-center">{error}</p>
                </div>
              )}

              <Button type="submit" loading={loading} size="xl" className="w-full font-bold rounded-xl shadow-md">
                {!loading && <>Verify & Create Account <CheckCircle2 size={16} /></>}
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                  {resending ? 'Resending...' : 'Resend OTP Code'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            Already have a workspace?{' '}
            <Link to="/login" className="font-semibold text-[var(--color-primary-vivid)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
