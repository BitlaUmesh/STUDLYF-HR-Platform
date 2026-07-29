import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button, Input, PasswordRequirementsInfo, PasswordMetricsList, validatePasswordMetrics } from '../components/ui';
import { authApi } from '../api/auth';
import { getErrorMessage } from '../api/client';

type ForgotStep = 'email' | 'otp' | 'reset';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ForgotStep>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resending, setResending] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;

  // Step 1: Send OTP to email
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPasswordOtp(email);
      setInfoMessage(`A 6-digit verification code has been sent to ${email}`);
      setStep('otp');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send verification code.'));
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP code
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
      setOtpDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      setError('Please enter all 6 digits of the code.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await authApi.verifyResetOtp(email, otp);
      setStep('reset');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid or expired 6-digit verification code.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setResending(true);
    setError(null);
    setInfoMessage(null);
    try {
      await authApi.forgotPasswordOtp(email);
      setInfoMessage('A fresh 6-digit verification code has been sent!');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resend verification code.'));
    } finally {
      setResending(false);
    }
  }

  // Step 3: Overwrite Password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    const validation = validatePasswordMetrics(newPassword);
    if (!validation.valid && validation.errorMsg) {
      setError(validation.errorMsg);
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const otp = otpDigits.join('');
      await authApi.resetPasswordOtp({ email, otp, newPassword });
      setInfoMessage('Your password has been updated! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reset password. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left Branded Panel ── */}
      <div className="auth-brand-panel hidden lg:flex lg:w-[45%] flex-col justify-center items-center p-12 relative">
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 shadow-2xl">
              <img src="/logo-s.png" alt="S Logo" className="h-full w-full object-contain filter drop-shadow-lg" />
            </div>
          </div>
          <img src="/studlyf-logo-white.png" alt="STUDLYF" className="h-7 object-contain mb-3" />
          <p className="text-slate-300 text-sm leading-relaxed max-w-xs font-medium">
            Reset your password securely with a 6-digit email verification code.
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex flex-1 items-center justify-center bg-[var(--color-canvas)] px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          <Link
            to="/login"
            className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to login
          </Link>

          {/* ── Step 1: Request OTP Email ── */}
          {step === 'email' && (
            <>
              <div className="mb-8 space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                  <Mail size={22} />
                </div>
                <h1 className="font-display text-2xl font-bold text-slate-900">Forgot password?</h1>
                <p className="text-xs font-medium text-slate-500">
                  Enter your registered work email. We'll send a 6-digit verification code directly to your Gmail.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">Work Email</label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    leftIcon={<Mail size={16} />}
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5">
                    <p className="text-xs font-bold text-rose-600">{error}</p>
                  </div>
                )}

                <Button type="submit" loading={loading} size="xl" className="w-full font-bold rounded-xl shadow-md">
                  {!loading && <><Send size={15} /> Send Verification Code</>}
                </Button>
              </form>
            </>
          )}

          {/* ── Step 2: Enter 6-Digit OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-slide-in-right">
              <div className="mb-4 space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                  <ShieldCheck size={24} />
                </div>
                <h1 className="font-display text-2xl font-bold text-slate-900">Enter Verification Code</h1>
                <p className="text-xs font-medium text-slate-500">
                  Enter the 6-digit code sent to <span className="font-bold text-slate-800">{email}</span>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
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

              {infoMessage && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-xs font-bold text-emerald-700 text-center">{infoMessage}</p>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3">
                  <p className="text-xs font-bold text-rose-600 text-center">{error}</p>
                </div>
              )}

              <Button type="submit" loading={loading} size="xl" className="w-full font-bold rounded-xl shadow-md">
                {!loading && <>Verify Code <CheckCircle2 size={16} /></>}
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                  {resending ? 'Resending...' : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Set New Password & Overwrite ── */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4 animate-slide-in-right">
              <div className="mb-6 space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs border border-emerald-200">
                  <Lock size={22} />
                </div>
                <h1 className="font-display text-2xl font-bold text-slate-900">Reset Your Password</h1>
                <p className="text-xs font-medium text-slate-500">
                  Code verified! Enter your new password to overwrite your account credentials.
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Password</label>
                  <PasswordRequirementsInfo password={newPassword} />
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  leftIcon={<Lock size={16} />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer hover:text-slate-700 transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                {newPassword.length > 0 && <PasswordMetricsList password={newPassword} />}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">Confirm New Password</label>
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  leftIcon={<Lock size={16} />}
                  error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : ''}
                  rightIcon={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="cursor-pointer hover:text-slate-700 transition-colors">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
              </div>

              {infoMessage && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-xs font-bold text-emerald-700 text-center">{infoMessage}</p>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3">
                  <p className="text-xs font-bold text-rose-600 text-center">{error}</p>
                </div>
              )}

              <Button type="submit" loading={loading} size="xl" className="w-full font-bold rounded-xl shadow-md">
                {!loading && <>Overwrite Password <CheckCircle2 size={16} /></>}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
