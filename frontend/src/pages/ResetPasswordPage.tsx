import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { authApi } from '../api/auth';
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

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getPasswordStrength(password);
  const passwordsMatch = password === confirm;
  const confirmError = confirm.length > 0 && !passwordsMatch ? 'Passwords do not match' : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }
    if (!token) { setError('Invalid or missing reset token.'); return; }
    setError(null);
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not reset password. The link may have expired.'));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-6">
        <div className="text-center max-w-sm animate-fade-in-up">
          <div className="mb-4 text-5xl">🔗</div>
          <h1 className="font-display text-xl font-bold text-[var(--color-ink)] mb-2">Invalid Reset Link</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link to="/forgot-password">
            <Button size="xl" className="w-full">Request new link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in-up">
        <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          <ArrowLeft size={15} /> Back to login
        </Link>

        {!done ? (
          <>
            <div className="mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-tint)]">
                <Lock size={22} className="text-[var(--color-primary-vivid)]" />
              </div>
              <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Set new password</h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Your new password must be different from your previous password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--color-text)]">New password</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  leftIcon={<Lock size={16} />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer hover:text-[var(--color-text)] transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-[var(--color-line)]'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${strength.score <= 2 ? 'text-red-500' : strength.score <= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--color-text)]">Confirm new password</label>
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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

              <Button type="submit" loading={loading} size="xl" className="w-full" disabled={!passwordsMatch && confirm.length > 0}>
                {!loading && 'Reset password'}
              </Button>
            </form>
          </>
        ) : (
          <div className="animate-fade-in-up text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="font-display text-xl font-bold text-[var(--color-ink)] mb-2">Password reset!</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              Your password has been successfully updated. Redirecting you to login…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
