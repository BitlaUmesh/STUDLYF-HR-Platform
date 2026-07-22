import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { authApi } from '../api/auth';
import { getErrorMessage } from '../api/client';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send reset email. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left Branded Panel ── */}
      <div className="auth-brand-panel hidden lg:flex lg:w-[45%] flex-col justify-center items-center p-12 relative">
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl">
              <span className="font-display text-2xl font-bold text-white">S</span>
            </div>
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-3">StudLyf HR</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Don't worry, it happens to everyone. We'll send a secure reset link to your inbox.
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex flex-1 items-center justify-center bg-[var(--color-canvas)] px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          <Link
            to="/login"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <ArrowLeft size={15} />
            Back to login
          </Link>

          {!sent ? (
            <>
              <div className="mb-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-tint)]">
                  <Mail size={22} className="text-[var(--color-primary-vivid)]" />
                </div>
                <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Forgot password?</h1>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  Enter the email address associated with your account and we'll send you a secure link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[var(--color-text)]">Work email</label>
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
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                    <p className="text-xs font-semibold text-red-600">{error}</p>
                  </div>
                )}

                <Button type="submit" loading={loading} size="xl" className="w-full">
                  {!loading && <><Send size={15} /> Send reset link</>}
                </Button>
              </form>
            </>
          ) : (
            /* ── Success State ── */
            <div className="animate-fade-in-up text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-[var(--color-ink)] mb-2">Check your inbox!</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-1">
                We sent a password reset link to
              </p>
              <p className="text-sm font-semibold text-[var(--color-ink)] mb-6">{email}</p>
              <p className="text-xs text-[var(--color-text-muted)] mb-6">
                Didn't receive it? Check your spam folder, or{' '}
                <button
                  onClick={() => setSent(false)}
                  className="font-semibold text-[var(--color-primary-vivid)] hover:underline"
                >
                  try again
                </button>
                .
              </p>
              <Link to="/login">
                <Button variant="secondary" size="xl" className="w-full">
                  <ArrowLeft size={15} /> Back to login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
