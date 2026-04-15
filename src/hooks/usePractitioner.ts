import { useState, useEffect } from 'react';
import type { Practitioner } from '../types/database';
import { getPractitioner } from '../lib/store';

const SESSION_KEY = 'buddy_active_practitioner_id';

export function useActivePractitioner() {
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem(SESSION_KEY);
    if (id) {
      getPractitioner(id).then((p) => setPractitioner(p ?? null));
    }
  }, []);

  return practitioner;
}

export function loginPractitioner(practitionerId: string) {
  sessionStorage.setItem(SESSION_KEY, practitionerId);
}

export function logoutPractitioner() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getLoggedInPractitionerId(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}
