/**
 * Supabase Client Configuration
 * SSR-safe client setup for Next.js
 * File: lib/supabase/client.ts
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase client for client-side operations
 * Use this in React components, client-side hooks, etc.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables.\n" +
        "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.\n" +
        "You can find these values in your Supabase project settings: https://app.supabase.com/project/_/settings/api"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Get a singleton instance of the Supabase client
 * This ensures we only create one client instance
 */
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

// Export a default instance for convenience
export const supabase = getSupabaseClient();
