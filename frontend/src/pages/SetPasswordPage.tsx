import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '../api/client';

export function SetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authUser = useAuthStore((s) => s.user);
  const email = searchParams.get('email') || authUser?.email || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await authApi.setGooglePassword({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save password. Please try again.'));
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
            Welcome to StudLyf HR! Secure your account by creating your account password.
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex flex-1 items-center justify-center bg-[var(--color-canvas)] px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in-up space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              <ShieldCheck size={28} />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Set Account Password</h1>
            <p className="text-xs font-medium text-slate-500">
              Create a password for <span className="font-bold text-slate-800">{email}</span> so you can log in using either Google or Email + Password in the future.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                New Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer hover:text-slate-700 transition-colors">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Confirm Password
              </label>
              <Input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                leftIcon={<Lock size={16} />}
                error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : ''}
                rightIcon={
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="cursor-pointer hover:text-slate-700 transition-colors">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5">
                <p className="text-xs font-bold text-rose-600">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} size="xl" className="w-full font-bold rounded-xl shadow-md">
              {!loading && <>Save Password & Continue <ArrowRight size={16} /></>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
