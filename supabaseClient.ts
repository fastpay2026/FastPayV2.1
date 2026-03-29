import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] VITE_SUPABASE_URL:', supabaseUrl);
console.log('[Supabase] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co');

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials missing or placeholder. Persistence will be limited to localStorage.');
}

const url = (supabaseUrl && supabaseUrl !== '') ? supabaseUrl : 'https://placeholder.supabase.co';
const key = (supabaseAnonKey && supabaseAnonKey !== '') ? supabaseAnonKey : 'placeholder';

export const supabase = createClient(
  url,
  key,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
