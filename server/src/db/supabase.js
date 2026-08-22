const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://epnkoxnepauxkluqewib.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_K7iZ-nkDLbnhJK9ZaSkQmw_0pKMzzV_';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Supabase URL or Key missing in .env configuration');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = { supabase };
