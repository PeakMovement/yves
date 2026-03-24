import { useState, useEffect } from 'react';
import type { Client } from '../types/database';
import { getClient } from '../lib/store';

const SESSION_KEY = 'buddy_active_client_id';

export function useActiveClient() {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem(SESSION_KEY);
    if (id) {
      getClient(id).then((c) => setClient(c ?? null));
    }
  }, []);

  return client;
}

export function loginClient(clientId: string) {
  sessionStorage.setItem(SESSION_KEY, clientId);
}

export function logoutClient() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getLoggedInClientId(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}
