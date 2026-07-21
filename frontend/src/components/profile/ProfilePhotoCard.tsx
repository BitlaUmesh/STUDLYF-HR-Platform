"use client";

import React, { useRef } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { API_BASE_URL } from '../../api/client';
import { Camera, Mail, Building, UserCircle2 } from 'lucide-react';

export default function ProfilePhotoCard() {
  const { profile, uploadPhoto } = useProfileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const profilePhotoUrl = profile.profilePhoto
    ? profile.profilePhoto.startsWith('http')
      ? profile.profilePhoto
      : `${API_BASE_URL.replace(/\/api$/, '')}${profile.profilePhoto}`
    : null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative group">
      
      {/* Decorative background header */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary to-secondary opacity-10"></div>
      
      <div className="relative flex flex-col items-center mt-6">
        {/* Photo Upload Area */}
        <div className="relative w-28 h-28 mb-4">
          <div className="w-full h-full rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-50 flex items-center justify-center">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCircle2 className="w-16 h-16 text-slate-300" />
            )}
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors z-10"
          >
            <Camera size={16} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={handlePhotoUpload}
          />
        </div>

        {/* User Info */}
        <h2 className="text-xl font-bold text-slate-900">{profile.fullName}</h2>
        <p className="text-sm font-medium text-slate-500 mb-4">{profile.designation || 'Team Member'}</p>

        {/* Active Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          Active Account
        </div>

        {/* Details list */}
        <div className="w-full space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Mail size={16} className="text-slate-400" />
            <span className="truncate">{profile.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Building size={16} className="text-slate-400" />
            <span className="truncate">{profile.companyName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
