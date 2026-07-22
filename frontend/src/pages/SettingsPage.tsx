import { useEffect, useState } from 'react';
import { Save, User, Building2, FileText, Lock, CheckCircle2, AlertCircle, Image as ImageIcon, Camera } from 'lucide-react';
import { profileApi, type FullProfile, type CompanyBranding } from '../api/profile';
import { Card, Button, Input, PageHeader, Avatar } from '../components/ui';
import { getErrorMessage } from '../api/client';
import { useAuthStore } from '../store/authStore';

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

  const initAuth = useAuthStore((s) => s.init);

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
        profilePhoto: profile.profilePhoto || undefined,
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
      initAuth(); // refresh global auth store so sidebar avatar updates
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

  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      update('profilePhoto', reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  if (!profile) return <p className="text-xs text-[var(--color-text-muted)] font-semibold p-6">Loading settings…</p>;

  const hasPhoto = Boolean(profile.profilePhoto);
  const branding = profile.branding || {
    primaryColor: '#2D136F',
    secondaryColor: '#5D22D8',
    logoUrl: '',
    signatureUrl: '',
    sealUrl: '',
    letterheadUrl: '',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in">
      <PageHeader
        title="Settings & Branding"
        subtitle="Manage your profile, company details, letter branding assets, and security settings."
        action={
          <Button size="sm" onClick={handleSave} loading={saving} className="flex items-center gap-2 rounded-xl">
            <Save size={15} /> {saving ? 'Saving…' : 'Save all changes'}
          </Button>
        }
      />

      {/* Profile Incomplete Banner */}
      {!hasPhoto && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-900 text-xs font-semibold animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shrink-0">
              <Camera size={16} />
            </div>
            <div>
              <p className="font-bold text-amber-900">Your profile photo is missing!</p>
              <p className="text-amber-700 font-normal mt-0.5">Upload a profile photo below to personalise your HR workspace.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('personal')}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shrink-0 cursor-pointer"
          >
            Upload Photo
          </button>
        </div>
      )}

      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border font-bold text-xs transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200/90 bg-white rounded-xl p-1.5 shadow-2xs gap-1">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'personal'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User size={16} />
          <span>Personal Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 size={16} />
          <span>Company & Branding</span>
        </button>

        <button
          onClick={() => setActiveTab('defaults')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'defaults'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText size={16} />
          <span>Letter Defaults</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Lock size={16} />
          <span>Security & Password</span>
        </button>
      </div>

      {/* Tab 1: Personal Profile */}
      {activeTab === 'personal' && (
        <Card className="p-6 space-y-6 bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-display">Personal Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">Update your personal profile, photo, and designation details.</p>
            </div>
            <User className="h-6 w-6 text-indigo-600/40" />
          </div>

          {/* Profile Photo Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <Avatar src={profile.profilePhoto} name={profile.fullName} size="xl" className="ring-4 ring-white shadow-sm" />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Profile Photo</h4>
              <p className="text-xs text-slate-500">Upload a square PNG or JPG image, or paste an image URL.</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-2xs">
                  <Camera size={14} />
                  Choose File
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoFileChange} />
                </label>
                {profile.profilePhoto && (
                  <button
                    type="button"
                    onClick={() => update('profilePhoto', null)}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Image URL Direct Input */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Or Image URL</label>
            <Input
              value={profile.profilePhoto || ''}
              onChange={(e) => update('profilePhoto', e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Full Name</label>
              <Input value={profile.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Your Full Name" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Email Address (Read-Only)</label>
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
          <Card className="p-6 space-y-5 bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-display">Company Information</h3>
                <p className="text-xs text-slate-500 mt-0.5">Set the company address and contact details shown on letters.</p>
              </div>
              <Building2 className="h-6 w-6 text-indigo-600/40" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Company Name (Fixed)</label>
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
          <Card className="p-6 space-y-6 bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-display">Branding Palette & Asset URLs</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure your brand colors, logo, authorized signature, and seal.</p>
              </div>
              <ImageIcon className="h-6 w-6 text-indigo-600/40" />
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
                  <Input
                    value={branding.primaryColor || '#2D136F'}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    placeholder="#2D136F"
                  />
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
                  <Input
                    value={branding.secondaryColor || '#5D22D8'}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    placeholder="#5D22D8"
                  />
                </div>
              </div>
            </div>

            {/* Asset URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Company Logo Image URL</label>
                <Input value={branding.logoUrl || ''} onChange={(e) => updateBranding('logoUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Authorized Signature URL</label>
                <Input value={branding.signatureUrl || ''} onChange={(e) => updateBranding('signatureUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Company Seal / Stamp URL</label>
                <Input value={branding.sealUrl || ''} onChange={(e) => updateBranding('sealUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Custom Letterhead URL</label>
                <Input value={branding.letterheadUrl || ''} onChange={(e) => updateBranding('letterheadUrl', e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Letter Defaults */}
      {activeTab === 'defaults' && (
        <Card className="p-6 space-y-5 bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-display">Document & Typography Defaults</h3>
              <p className="text-xs text-slate-500 mt-0.5">Set the default styling properties for new offer and joining letters.</p>
            </div>
            <FileText className="h-6 w-6 text-indigo-600/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Default Document Font</label>
              <select
                value={profile.defaultFont || 'Inter'}
                onChange={(e) => update('defaultFont', e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="Inter">Inter (Modern Clean Sans)</option>
                <option value="Roboto">Roboto (Classic Sans)</option>
                <option value="Merriweather">Merriweather (Formal Serif)</option>
                <option value="Playfair Display">Playfair Display (Executive Serif)</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Default Border Color</label>
              <Input value={profile.defaultBorderColor || '#E2E8F0'} onChange={(e) => update('defaultBorderColor', e.target.value)} placeholder="#E2E8F0" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Line Spacing</label>
              <Input value={profile.defaultLineSpacing || '1.6'} onChange={(e) => update('defaultLineSpacing', e.target.value)} placeholder="1.6" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Letter Spacing</label>
              <Input value={profile.defaultLetterSpacing || 'normal'} onChange={(e) => update('defaultLetterSpacing', e.target.value)} placeholder="normal" />
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Security & Password */}
      {activeTab === 'security' && (
        <Card className="p-6 space-y-5 bg-white border border-slate-200/90 shadow-xs max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-display">Change Workspace Password</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ensure your account is using a strong, unique password.</p>
            </div>
            <Lock className="h-6 w-6 text-indigo-600/40" />
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                {passwordSuccess}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Current Password</label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">New Password</label>
              <Input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Confirm New Password</label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <Button type="submit" loading={passwordSaving} size="sm" className="rounded-xl font-bold">
              {passwordSaving ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
