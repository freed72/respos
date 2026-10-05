import { createClient, createAdminClient } from '@insforge/sdk';

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://bz7jcdzc.ap-southeast.insforge.app';
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'ik_dc04c2eb020995bf0f2293454c5e9df7';

// Public / Browser Client
export const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey,
});

// Admin / Server Client
export const insforgeAdmin = createAdminClient({
  baseUrl: insforgeUrl,
  apiKey: insforgeAnonKey,
});
