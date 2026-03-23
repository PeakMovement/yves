import { useState, useEffect } from 'react';
import type { Client } from '../types/database';
import { getClients, seedDemoData } from '../lib/store';

export function useActiveClient() {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    seedDemoData();
    const clients = getClients();
    if (clients.length > 0) {
      setClient(clients[0]);
    }
  }, []);

  return client;
}
