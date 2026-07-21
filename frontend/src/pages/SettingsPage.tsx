import { useEffect, useState } from 'react';
import { Save, User, Building2, FileText, Lock, CheckCircle2, AlertCircle, Image as ImageIcon, ShieldCheck, Key } from 'lucide-react';
import { profileApi, type FullProfile, type CompanyBranding } from '../api/profile';
import { Card, Button, Input, PageHeader } from '../components/ui';
import { getErrorMessage } from '../api/client';

export function SettingsPage() {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'branding' | 'defaults' | 'security'>('personal');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    profileApi.get().then(({ data }) => setProfile(data));
  }, []);

  function update<K extends keyof FullProfile>(field: K, value: FullProfile[K]) {
    setProfile((p) => (p ? { ...p, [field]: value } : p));
  }

  function updateBranding<K extends keyof CompanyBranding>(field: K, value: CompanyBranding[K]) {
    setProfile((p) => {
      if (!p) return p;
      const currentBranding = p.branding || {
        id: '',
        primaryColor: '#2D136F',
        secondaryColor: '#5D22D8',
        logoUrl: '',
        signatureUrl: '',
        sealUrl: '',
        letterheadUrl: '',
      };
      return {
        ...p,
        branding: {
          ...currentBranding,
          [field]: value,
        },
      };
    });
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
        defaultFont: profile.defaultFont || undefined,
        defaultBorderColor: profile.defaultBorderColor || undefined,
        defaultLineSpacing: profile.defaultLineSpacing || undefined,
        defaultLetterSpacing: profile.defaultLetterSpacing || undefined,
      });

      if (profile.branding) {
        await profileApi.updateBranding({
          primaryColor: profile.branding.primaryColor,
          secondaryColor: profile.branding.secondaryColor,
          logoUrl: profile.branding.logoUrl || null,
          signatureUrl: profile.branding.signatureUrl || null,
          sealUrl: profile.branding.sealUrl || null,
          letterheadUrl: profile.branding.letterheadUrl || null,
        });
      }
      setMessage({ text: 'Settings updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: getErrorMessage(err, 'Could not save changes'), type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await profileApi.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Failed to update password. Incorrect current password.'));
    } finally {
      setPasswordSaving(false);
    }
  }

  if (!profile) return <p className="text-sm text-[var(--color-text-muted)] font-medium p-6">Loading settings…</p>;

  const branding = profile.branding || {
    primaryColor: '#2D136F',
    secondaryColor: '#5D22D8',
    logoUrl: '',
    signatureUrl: '',
    sealUrl: '',
    letterheadUrl: '',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Settings & Branding"
        subtitle="Manage your profile, company details, letter branding assets, and security settings."
        action={
          <Button size="sm" onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            <Save size={15} /> {saving ? 'Saving…' : 'Save all changes'}
          </Button>
        }
      />

      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border font-medium text-sm transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-2xs gap-1">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'personal'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User size={16} />
          <span>Personal Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 size={16} />
          <span>Company & Branding</span>
        </button>

        <button
          onClick={() => setActiveTab('defaults')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'defaults'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText size={16} />
          <span>Letter Defaults</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Lock size={16} />
          <span>Security & Password</span>
        </button>
      </div>

      {/* Tab 1: Personal Profile */}
      {activeTab === 'personal' && (
        <Card className="p-6 space-y-5 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Personal Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">Update your personal profile and designation details.</p>
            </div>
            <User className="h-6 w-6 text-primary/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Full Name</label>
              <Input value={profile.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Your Full Name" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address (Read-Only)</label>
              <Input value={profile.email} disabled className="bg-slate-50 text-slate-400 cursor-not-allowed" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Designation / Role</label>
              <Input value={profile.designation || ''} onChange={(e) => update('designation', e.target.value)} placeholder="HR Manager / Talent Acquisition" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Phone Number</label>
              <Input value={profile.phone || ''} onChange={(e) => update('phone', e.target.value)} placeholder="+91 9876543210" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">City</label>
              <Input value={profile.city || ''} onChange={(e) => update('city', e.target.value)} placeholder="Hyderabad" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">State</label>
              <Input value={profile.state || ''} onChange={(e) => update('state', e.target.value)} placeholder="Telangana" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Country</label>
              <Input value={profile.country || ''} onChange={(e) => update('country', e.target.value)} placeholder="India" />
            </div>
          </div>
        </Card>
      )}

      {/* Tab 2: Company & Branding */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5 bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Company Information</h3>
                <p className="text-xs text-slate-500 mt-0.5">Set the company address and contact details shown on letters.</p>
              </div>
              <Building2 className="h-6 w-6 text-primary/40" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Company Name (Fixed)</label>
                <Input value={profile.companyName} disabled className="bg-slate-50 text-slate-500 font-semibold" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Company Website</label>
                <Input value={profile.companyWebsite || ''} onChange={(e) => update('companyWebsite', e.target.value)} placeholder="https://www.company.com" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Company Contact Email</label>
                <Input value={profile.companyEmail || ''} onChange={(e) => update('companyEmail', e.target.value)} placeholder="hr@company.com" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Company Address</label>
                <Input value={profile.companyAddress || ''} onChange={(e) => update('companyAddress', e.target.value)} placeholder="Suite 400, Tech Park, City" />
              </div>
            </div>
          </Card>

          {/* Branding Colors & Upload Assets */}
          <Card className="p-6 space-y-6 bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Branding Palette & Asset URLs</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure your brand colors, logo, authorized signature, and seal.</p>
              </div>
              <ImageIcon className="h-6 w-6 text-primary/40" />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Primary Theme Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.primaryColor || '#2D136F'}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-slate-300 p-0.5 bg-white"
                  />
                  <Input value={branding.primaryColor || '#2D136F'} onChange={(e) => updateBranding('primaryColor', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Secondary Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.secondaryColor || '#5D22D8'}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-slate-300 p-0.5 bg-white"
                  />
                  <Input value={branding.secondaryColor || '#5D22D8'} onChange={(e) => updateBranding('secondaryColor', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Asset Image URLs */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Company Logo Image URL</label>
                <div className="flex gap-3 items-center">
                  <Input
                    value={branding.logoUrl || ''}
                    onChange={(e) => updateBranding('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1"
                  />
                  {branding.logoUrl && (
                    <img src={branding.logoUrl} alt="Logo Preview" className="h-10 w-10 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Authorized HR Signature URL</label>
                <div className="flex gap-3 items-center">
                  <Input
                    value={branding.signatureUrl || ''}
                    onChange={(e) => updateBranding('signatureUrl', e.target.value)}
                    placeholder="https://example.com/signature.png"
                    className="flex-1"
                  />
                  {branding.signatureUrl && (
                    <img src={branding.signatureUrl} alt="Signature Preview" className="h-10 w-16 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Company Official Seal / Stamp URL</label>
                <div className="flex gap-3 items-center">
                  <Input
                    value={branding.sealUrl || ''}
                    onChange={(e) => updateBranding('sealUrl', e.target.value)}
                    placeholder="https://example.com/seal.png"
                    className="flex-1"
                  />
                  {branding.sealUrl && (
                    <img src={branding.sealUrl} alt="Seal Preview" className="h-10 w-10 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Letter Defaults */}
      {activeTab === 'defaults' && (
        <Card className="p-6 space-y-5 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Default Typography & Formatting</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customize font and spacing defaults for generated letters.</p>
            </div>
            <FileText className="h-6 w-6 text-primary/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Default Document Font</label>
              <select
                value={profile.defaultFont || 'Times New Roman'}
                onChange={(e) => update('defaultFont', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
              >
                <option value="Times New Roman">Times New Roman (Classic Corporate)</option>
                <option value="Inter">Inter (Modern Clean)</option>
                <option value="Roboto">Roboto (Professional Tech)</option>
                <option value="Garamond">Garamond (Executive Formal)</option>
                <option value="Outfit">Outfit (Contemporary)</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Default Line Spacing</label>
              <select
                value={profile.defaultLineSpacing || '1.35'}
                onChange={(e) => update('defaultLineSpacing', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
              >
                <option value="1.15">Compact (1.15x)</option>
                <option value="1.35">Comfortable (1.35x - Recommended)</option>
                <option value="1.50">Spacious (1.50x)</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Security & Password */}
      {activeTab === 'security' && (
        <Card className="p-6 space-y-5 bg-white border border-slate-200 shadow-xs max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Change Account Password</h3>
              <p className="text-xs text-slate-500 mt-0.5">Update your login password securely.</p>
            </div>
            <ShieldCheck className="h-6 w-6 text-primary/40" />
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl font-medium">
                <AlertCircle size={16} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl font-medium">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">New Password (Min 8 Chars)</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-2">
              <Button type="submit" size="sm" disabled={passwordSaving} className="flex items-center gap-2">
                <Key size={14} /> {passwordSaving ? 'Updating Password…' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
