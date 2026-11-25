import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rhshyvpwvnbrtshvwijy.supabase.co';
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_qs5gPt0EyC6N0LXlWNjMsA_u_Xp2_jc';

// Public / Browser Client
export const supabase = createClient(supabaseUrl, supabasePublishableKey);
