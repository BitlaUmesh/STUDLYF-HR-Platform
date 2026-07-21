import { create } from 'zustand';
import { fetchAPI } from '@/lib/api';

export interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  profilePhoto: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  designation: string | null;
  
  companyName: string;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  
  defaultFont: string;
  defaultBorderColor: string;
  defaultLineSpacing: string;
  defaultLetterSpacing: string;
}

interface ProfileState {
  profile: ProfileData | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  draftProfile: Partial<ProfileData>;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  
  fetchProfile: () => Promise<void>;
  updateDraft: (updates: Partial<ProfileData>) => void;
  saveChanges: () => Promise<void>;
  discardChanges: () => void;
  uploadPhoto: (file: File) => Promise<void>;
  uploadCompanyLogo: (file: File) => Promise<void>;
  resetSaveStatus: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  hasUnsavedChanges: false,
  draftProfile: {},
  saveStatus: 'idle',

  fetchProfile: async () => {
    try {
      set({ isLoading: true });
      const data = await fetchAPI('/api/profile/');
      set({ profile: data, draftProfile: {}, hasUnsavedChanges: false, isLoading: false, saveStatus: 'idle' });
    } catch (error) {
      console.error('Failed to fetch profile', error);
      set({ isLoading: false });
    }
  },

  updateDraft: (updates) => {
    set((state) => ({
      draftProfile: { ...state.draftProfile, ...updates },
      hasUnsavedChanges: true,
      saveStatus: 'idle'
    }));
  },

  saveChanges: async () => {
    const { draftProfile } = get();
    if (Object.keys(draftProfile).length === 0) return;

    try {
      set({ saveStatus: 'saving' });
      const updatedData = await fetchAPI('/api/profile/', {
        method: 'PUT',
        body: JSON.stringify(draftProfile)
      });
      set({ profile: updatedData, draftProfile: {}, hasUnsavedChanges: false, saveStatus: 'success' });
      
      setTimeout(() => {
        set({ saveStatus: 'idle' });
      }, 3000);
    } catch (error) {
      console.error('Failed to save profile', error);
      set({ saveStatus: 'error' });
      
      setTimeout(() => {
        set({ saveStatus: 'idle' });
      }, 3000);
    }
  },

  discardChanges: () => {
    set({ draftProfile: {}, hasUnsavedChanges: false, saveStatus: 'idle' });
  },

  resetSaveStatus: () => {
    set({ saveStatus: 'idle' });
  },

  uploadPhoto: async (file: File) => {
    try {
      set({ saveStatus: 'saving' });
      const formData = new FormData();
      formData.append("file", file);
      
      await fetchAPI('/api/profile/upload-photo', {
        method: 'POST',
        body: formData
      });
      get().fetchProfile();
    } catch (error) {
      console.error('Failed to upload photo', error);
      set({ saveStatus: 'error' });
    }
  },

  uploadCompanyLogo: async (file: File) => {
    // Empty
  }
}));
