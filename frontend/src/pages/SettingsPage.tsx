import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { profileApi, type FullProfile } from '../api/profile';
import { Card, Button, Input, PageHeader } from '../components/ui';
import { getErrorMessage } from '../api/client';

export function SettingsPage() {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    profileApi.get().then(({ data }) => setProfile(data));
  }, []);

  function update<K extends keyof FullProfile>(field: K, value: FullProfile[K]) {
    setProfile((p) => (p ? { ...p, [field]: value } : p));
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    try {
      await profileApi.update({
        fullName: profile.fullName,
        phone: profile.phone || undefined,
        designation: profile.designation || undefined,
        city: profile.city || undefined,
        state: profile.state || undefined,
        country: profile.country || undefined,
        companyAddress: profile.companyAddress || undefined,
        companyPhone: profile.companyPhone || undefined,
        companyEmail: profile.companyEmail || undefined,
        companyWebsite: profile.companyWebsite || undefined,
      });
      if (profile.branding) {
        await profileApi.updateBranding({
          primaryColor: profile.branding.primaryColor,
          secondaryColor: profile.branding.secondaryColor,
        });
      }
      setMessage('Saved.');
    } catch (err) {
      setMessage(getErrorMessage(err, 'Could not save changes'));
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Your profile, company details, and letter branding."
        action={
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      {message && <p className="mb-4 text-sm text-[var(--color-primary-vivid)]">{message}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-6">
          <h3 className="font-display text-sm font-semibold text-[var(--color-ink)]">Personal</h3>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Full name</label>
            <Input value={profile.fullName} onChange={(e) => update('fullName', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input value={profile.email} disabled />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Designation</label>
            <Input value={profile.designation || ''} onChange={(e) => update('designation', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Phone</label>
            <Input value={profile.phone || ''} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">City</label>
              <Input value={profile.city || ''} onChange={(e) => update('city', e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">State</label>
              <Input value={profile.state || ''} onChange={(e) => update('state', e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Country</label>
              <Input value={profile.country || ''} onChange={(e) => update('country', e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h3 className="font-display text-sm font-semibold text-[var(--color-ink)]">Company & branding</h3>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Company name</label>
            <Input value={profile.companyName} disabled />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Company website</label>
            <Input value={profile.companyWebsite || ''} onChange={(e) => update('companyWebsite', e.target.value)} placeholder="https://" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Company email</label>
            <Input value={profile.companyEmail || ''} onChange={(e) => update('companyEmail', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Company address</label>
            <Input value={profile.companyAddress || ''} onChange={(e) => update('companyAddress', e.target.value)} />
          </div>
          {profile.branding && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Primary color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={profile.branding.primaryColor}
                    onChange={(e) =>
                      setProfile((p) => (p && p.branding ? { ...p, branding: { ...p.branding, primaryColor: e.target.value } } : p))
                    }
                    className="h-9 w-9 cursor-pointer rounded border border-[var(--color-line-strong)]"
                  />
                  <Input value={profile.branding.primaryColor} readOnly />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Secondary color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={profile.branding.secondaryColor}
                    onChange={(e) =>
                      setProfile((p) => (p && p.branding ? { ...p, branding: { ...p.branding, secondaryColor: e.target.value } } : p))
                    }
                    className="h-9 w-9 cursor-pointer rounded border border-[var(--color-line-strong)]"
                  />
                  <Input value={profile.branding.secondaryColor} readOnly />
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
