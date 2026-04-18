import { useState, useEffect } from 'react';
import type { Practitioner } from '../types/database';
import { getPractitioner } from '../lib/store';

const SESSION_KEY = 'buddy_active_practitioner_id';

export function useActivePractitioner() {
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);

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
      }
    }

    loadPractitioner();

    const handleLogin = () => { loadPractitioner(); };
    window.addEventListener('practitioner-login', handleLogin);
    return () => window.removeEventListener('practitioner-login', handleLogin);
  }, []);

  return practitioner;
}

export function useIsAdmin(): boolean {
  const practitioner = useActivePractitioner();
  return practitioner?.is_admin === true;
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
