import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { useDocumentBuilderStore } from '@/store/documentBuilderStore';

export function useDocumentCreation() {
  const router = useRouter();
  const { resetState } = useDocumentBuilderStore();
  const [isCreating, setIsCreating] = useState(false);

  const createDocument = async (type: 'offer' | 'joining') => {
    try {
      setIsCreating(true);
      resetState(); // Clear any previous state

      const documentType = type === 'offer' ? 'OFFER_LETTER' : 'JOINING_LETTER';

      // Create a blank draft in the backend.
      const data = await fetchAPI('/api/documents/create', {
        method: 'POST',
        body: JSON.stringify({
          title: `Untitled ${type === 'offer' ? 'Offer' : 'Joining'} Letter`,
          type: documentType,
          status: 'draft',
          candidateDetails: {},
          contentJSON: { html: '' }
        })
      });

      const newDocId = data.id;
      
      // Navigate to the dynamic builder route
      router.push(`/dashboard/builder/${newDocId}`);
    } catch (error) {
      console.error("Failed to create document", error);
      // fallback or toast error
    } finally {
      setIsCreating(false);
    }
  };

  return { createDocument, isCreating };
}
