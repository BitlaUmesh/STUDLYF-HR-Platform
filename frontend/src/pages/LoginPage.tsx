import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button, Input } from '../components/ui';
import { getErrorMessage, API_BASE_URL } from '../api/client';

const FEATURES = [
  { emoji: '🎯', text: 'AI-powered talent matching across 1000+ profiles' },
  { emoji: '🏆', text: 'Real-time GitHub activity & hackathon leaderboards' },
  { emoji: '📋', text: 'One-click offer letter generation with branding' },
  { emoji: '🤝', text: 'Integrated Calendly scheduling for interviews' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);

  // Pre-fill remembered email
  useEffect(() => {
    const saved = localStorage.getItem('studlyf_remembered_email');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  // Rotate feature highlights
  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureIndex((i) => (i + 1) % FEATURES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem('studlyf_remembered_email', email);
      } else {
        localStorage.removeItem('studlyf_remembered_email');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password'));
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = `${API_BASE_URL}/auth/google`;
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
            Discover exceptional<br />
            <span className="gradient-text">student talent</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-xs">
            The modern HR platform built for companies that hire the best student developers, designers, and innovators.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-3">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-500 ${
                i === featureIndex
                  ? 'bg-white/10 backdrop-blur-sm border border-white/15'
                  : 'opacity-40'
              }`}
            >
              <span className="text-xl">{f.emoji}</span>
              <p className="text-sm font-medium text-slate-200">{f.text}</p>
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

          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Welcome back</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Sign in to your HR workspace.</p>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--color-line-strong)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-text)] shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-line)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--color-canvas)] px-3 text-xs text-[var(--color-text-muted)]">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={`space-y-4 ${shake ? 'animate-shake' : ''}`}>
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

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-[var(--color-text)]">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-[var(--color-primary-vivid)] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            </div>

            {/* Remember Me */}
            <label className="flex cursor-pointer items-center gap-2.5">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-4 w-4 rounded border border-[var(--color-line-strong)] bg-white transition-colors peer-checked:border-[var(--color-primary-vivid)] peer-checked:bg-[var(--color-primary-vivid)] flex items-center justify-center">
                  {rememberMe && (
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-[var(--color-text-muted)]">Remember me</span>
            </label>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                <p className="text-xs font-semibold text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} size="xl" className="w-full">
              {!loading && <>Sign in <ArrowRight size={16} /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            New to StudLyf HR?{' '}
            <Link to="/signup" className="font-semibold text-[var(--color-primary-vivid)] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
