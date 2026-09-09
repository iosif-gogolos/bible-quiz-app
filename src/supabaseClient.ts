import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug logs visible in Browser Developer Console (F12)
console.log('Supabase URL Loaded:', supabaseUrl ? 'YES' : 'NO (Empty)');
console.log('Supabase Key Loaded:', supabaseAnonKey ? 'YES' : 'NO (Empty)');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);