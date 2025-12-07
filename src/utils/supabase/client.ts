import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://edlnpolgtkrmddjyrxwm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbG5wb2xndGtybWRkanlyeHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MzI1NjcsImV4cCI6MjA4MDIwODU2N30.k-bwY7moYoEbpPsyuMF187yUzpd0YngGpzJ5OmjeN9w';

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