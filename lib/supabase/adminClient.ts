import { createClient } from '@supabase/supabase-js';
import { serverConfig } from '../config/serverConfig'; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = serverConfig.SUPABASE_SERVICE_ROLE_KEY;
/*
if (!supabaseUrl || !serviceKey) {
  throw new Error('Supabase service role key is not configured.');
}

// Client that bypasses RLS policies
export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    // Only fetch from server, never expose this client to the browser
    auth: { persistSession: false }, 
});
*/