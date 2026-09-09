import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.CONFIG_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.CONFIG_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);