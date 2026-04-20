import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail gracefully if env vars missing to prevent app crash
let client;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. App running in offline/mock mode.');
  // Create a dummy client that warns on use
  client = {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: { id: 'mock_id' }, error: null }) }) }),
      update: () => ({ eq: () => ({}) })
    })
  } as any;
} else {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = client;
