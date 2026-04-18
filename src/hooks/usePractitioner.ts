import { useState, useEffect } from 'react';
import type { Practitioner } from '../types/database';
import { getPractitioner } from '../lib/store';

const SESSION_KEY = 'buddy_active_practitioner_id';

export function useActivePractitioner() {
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPractitioner() {
      const id = sessionStorage.getItem(SESSION_KEY);
      if (id) {
        try {
          const p = await getPractitioner(id);
          setPractitioner(p ?? null);
        } catch (err) {
          setPractitioner(null);
        }
      } else {
        setPractitioner(null);
      }
      setLoading(false);
    }

    loadPractitioner();

    const handleLogin = () => {
      setLoading(true);
      loadPractitioner();
    };

    window.addEventListener('practitioner-login', handleLogin);
    return () => window.removeEventListener('practitioner-login', handleLogin);
  }, []);

  return { practitioner, loading };
}

export function loginPractitioner(practitionerId: string) {
  sessionStorage.setItem(SESSION_KEY, practitionerId);
  window.dispatchEvent(new Event('practitioner-login'));
}

export function logoutPractitioner() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getLoggedInPractitionerId(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}
