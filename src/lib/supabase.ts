import { createClient } from '@supabase/supabase-js';

// Use env vars if available, otherwise use fallback for localStorage mode
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

// Create client with either real or placeholder credentials
// The store.ts will check if Supabase is actually configured before using it
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
