import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://kcbxyonombsqamwsmmqz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnh5b25vbWJzcWFtd3NtbXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzA3OTMsImV4cCI6MjA3OTk0Njc5M30.IR1b_sKmNZnPHSx_EBTI0G5ouARblxMepr24nOxq8iM';

// إنشاء Supabase client (singleton)
export const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Export createClient function for compatibility
export const createClient = () => supabase;

// Export configuration
export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};