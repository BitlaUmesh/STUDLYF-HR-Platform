import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button, Input } from '../components/ui';
import { getErrorMessage } from '../api/client';

export function SignupPage() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', companyName: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create your account'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-ink)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-vivid)] font-display text-lg font-bold text-white">
            S
          </div>
          <span className="font-display text-lg font-semibold text-white">StudLyf HR</span>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="font-display text-xl font-semibold text-[var(--color-ink)]">Create your workspace</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Start discovering talent in minutes.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">Full name</label>
              <Input required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">Company name</label>
              <Input required value={form.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="Acme Inc." />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">Work email</label>
              <Input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">Password</label>
              <Input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            {error && <p className="text-sm text-[var(--color-signal-rejected)]">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            Already have a workspace?{' '}
            <Link to="/login" className="font-medium text-[var(--color-primary-vivid)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
