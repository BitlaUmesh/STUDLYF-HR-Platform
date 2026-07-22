import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Building2, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
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

const STEP_LABELS = ['Your Details', 'Your Company'];

export function SignupPage() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyName.trim()) {
      setError('Please enter your company name.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signup({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        companyName: form.companyName,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create your account'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left Branded Panel ── */}
      <div className="auth-brand-panel hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow-lg">
              <span className="font-display text-xl font-bold text-white">S</span>
            </div>
            <span className="font-display text-xl font-bold text-white">StudLyf HR</span>
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
            '25+ pre-seeded student profiles to explore',
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
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-display text-lg font-bold text-white">S</div>
            <span className="font-display text-lg font-bold text-[var(--color-ink)]">StudLyf HR</span>
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
              {step === 0 ? 'Create your account' : 'Your company'}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {step === 0 ? 'Your personal details to get started.' : 'Almost done — just your company info.'}
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

              <Button type="submit" size="xl" className="w-full">
                Next <ArrowRight size={16} />
              </Button>
            </form>
          )}

          {/* ── Step 1: Company Info ── */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-slide-in-right">
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
                  className="flex-1"
                  onClick={() => setStep(0)}
                >
                  Back
                </Button>
                <Button type="submit" loading={loading} size="xl" className="flex-1">
                  {!loading && <>Create account <ArrowRight size={16} /></>}
                </Button>
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
