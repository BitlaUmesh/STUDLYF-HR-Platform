import { useEffect, useState } from 'react';
import { Save, User, Building2, FileText, Lock, CheckCircle2, AlertCircle, Image as ImageIcon, Camera, Eye, EyeOff, Mail, ShieldCheck, Server, RefreshCw } from 'lucide-react';
import { profileApi, type FullProfile, type CompanyBranding, type EmailSettings } from '../api/profile';
import { Card, Button, Input, PageHeader, Avatar, PasswordRequirementsInfo, PasswordMetricsList, validatePasswordMetrics } from '../components/ui';
import { getErrorMessage } from '../api/client';
import { useAuthStore } from '../store/authStore';

export function SettingsPage() {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'branding' | 'defaults' | 'security' | 'email'>('personal');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Email & SMTP State
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    profileApi.get().then(({ data }) => setProfile(data));
    profileApi.getEmailSettings().then(({ data }) => {
      setEmailSettings(data);
      setSmtpHost(data.smtpHost || '');
      setSmtpPort(data.smtpPort || 587);
      setSmtpUser(data.smtpUser || '');
      setSmtpFrom(data.smtpFrom || '');
      if (data.isPassSet) {
        setSmtpPass('••••••••••••');
      }
    }).catch(console.error);
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
        profilePhoto: profile.profilePhoto ?? null,
        phone: profile.phone ?? null,
        designation: profile.designation ?? null,
        city: profile.city ?? null,
        state: profile.state ?? null,
        country: profile.country ?? null,
        companyAddress: profile.companyAddress ?? null,
        companyPhone: profile.companyPhone ?? null,
        companyEmail: profile.companyEmail ?? null,
        companyWebsite: profile.companyWebsite ?? null,
        defaultFont: profile.defaultFont ?? null,
        defaultBorderColor: profile.defaultBorderColor ?? null,
        defaultLineSpacing: profile.defaultLineSpacing ?? null,
        defaultLetterSpacing: profile.defaultLetterSpacing ?? null,
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
    if (currentPassword === newPassword) {
      setPasswordError('New password cannot be the same as your current password.');
      return;
    }
    const validation = validatePasswordMetrics(newPassword);
    if (!validation.valid && validation.errorMsg) {
      setPasswordError(validation.errorMsg);
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

        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'email'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Mail size={16} />
          <span>Email & Integrations</span>
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
              <p className="text-xs text-slate-500">Upload a square PNG or JPG image for your profile.</p>
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
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                  title={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">New Password</label>
                <PasswordRequirementsInfo password={newPassword} />
              </div>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword.length > 0 && <PasswordMetricsList password={newPassword} />}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Confirm New Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={passwordSaving} size="sm" className="rounded-xl font-bold">
              {passwordSaving ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 5: Email & Integrations */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* Card 1: Google Workspace Status */}
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Google Workspace / Gmail Integration</h3>
                  <p className="text-xs text-slate-500">Send emails directly out of your Google Workspace or Gmail inbox with 0 DNS setup required.</p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                emailSettings?.hasGoogleConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {emailSettings?.hasGoogleConnected ? 'Connected & Ready' : 'Not Connected'}
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-100">
              <p className="text-xs text-slate-600">
                {emailSettings?.hasGoogleConnected
                  ? `Authenticated as ${profile.email}. Emails are sent directly using Google's HTTPS Gmail API.`
                  : 'Connect your Google account to enable 1-click email sending directly from your Gmail / Google Workspace inbox.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  const backendUrl = (import.meta.env.VITE_API_URL || 'https://studlyf-hr-platform.onrender.com/api').replace(/\/$/, '');
                  window.location.href = `${backendUrl}/auth/google`;
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                <RefreshCw size={14} />
                {emailSettings?.hasGoogleConnected ? 'Reconnect Google Account' : 'Connect Google Workspace'}
              </button>
            </div>
          </Card>

          {/* Card 2: AES-256 Encrypted Custom SMTP Settings */}
          <Card className="p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <Server size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Custom SMTP Configuration</h3>
                  <p className="text-xs text-slate-500">For non-Google email providers (Hostinger, Microsoft 365, Zoho, private webmail).</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600">
                <ShieldCheck size={13} className="text-indigo-600" />
                <span>AES-256 Encrypted</span>
              </div>
            </div>

            {smtpMsg && (
              <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                smtpMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {smtpMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{smtpMsg.text}</span>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setSmtpSaving(true);
              setSmtpMsg(null);
              try {
                const { data } = await profileApi.updateEmailSettings({
                  smtpHost,
                  smtpPort,
                  smtpUser,
                  smtpPass,
                  smtpFrom,
                });
                setEmailSettings(data);
                setSmtpMsg({ text: 'Custom SMTP settings saved and encrypted successfully!', type: 'success' });
              } catch (err) {
                setSmtpMsg({ text: getErrorMessage(err, 'Failed to save SMTP settings'), type: 'error' });
              } finally {
                setSmtpSaving(false);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">SMTP Host Server</label>
                  <Input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="e.g. smtp.hostinger.com or smtp.office365.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">SMTP Port</label>
                  <Input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">SMTP Username / Email</label>
                  <Input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="e.g. hr@yourcompany.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    SMTP Password <span className="text-[10px] text-indigo-600 font-normal">(Saved with AES-256 encryption)</span>
                  </label>
                  <Input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="Enter SMTP password"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Custom Sender Display Name (Optional)</label>
                <Input
                  type="text"
                  value={smtpFrom}
                  onChange={(e) => setSmtpFrom(e.target.value)}
                  placeholder='e.g. "STUDLYF HR" <hr@yourcompany.com>'
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" loading={smtpSaving} size="sm" className="rounded-xl font-bold">
                  {smtpSaving ? 'Saving & Encrypting…' : 'Save SMTP Settings'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
