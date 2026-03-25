import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://teehpkaxgqnzwqtmxfhe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZWhwa2F4Z3FuendxdG14ZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDEzNjUsImV4cCI6MjA5MDAxNzM2NX0.SdUMpEGxyhpUARp1U4vQelzvx-CrEJqaQgmv8_uYY2U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
