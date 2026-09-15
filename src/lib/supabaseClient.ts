import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let lastUsedUrl: string | null = null;
let lastUsedKey: string | null = null;

// Real verified Supabase project URL for Capacity Connect
export const SUPABASE_DEFAULT_URL = 'https://jxmgovsoerukppnaygjg.supabase.co';

// Verified Supabase Publishable Key for Capacity Connect (safe for browser use)
export const SUPABASE_DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_0-Tkv3p2yXkfB9vY2l19Pw_GfpXWkql';

/**
 * Normalizes and validates the Supabase project URL.
 * Automatically cleans quotes, trailing slashes, and overrides generic/placeholder domains.
 */
export function cleanSupabaseUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return SUPABASE_DEFAULT_URL;
  }
  const trimmed = rawUrl.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (
    !trimmed ||
    trimmed === 'https://supabase.co' ||
    trimmed === 'http://supabase.co' ||
    trimmed === 'https://supabase.com' ||
    !trimmed.includes('.supabase.co')
  ) {
    return SUPABASE_DEFAULT_URL;
  }
  return trimmed;
}

/**
 * Normalizes and validates the Supabase client key.
 */
export function cleanSupabaseKey(rawKey?: string | null): string | null {
  if (!rawKey || typeof rawKey !== 'string') {
    return null;
  }
  const trimmed = rawKey.trim().replace(/^['"]|['"]$/g, '');
  if (
    !trimmed ||
    trimmed === '' ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === 'your-anon-key'
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Detects whether a key is a secret or service-role key.
 * Strictly used to prevent secret keys from ever being loaded into the browser client.
 */
export function isSecretKey(key?: string | null): boolean {
  if (!key || typeof key !== 'string') return false;
  const lower = key.trim().toLowerCase();
  return (
    lower.startsWith('sb_secret') ||
    lower.startsWith('service_role') ||
    lower.includes('service_role') ||
    lower.includes('secret')
  );
}

export interface SafeKeyResolution {
  key: string | null;
  keyType: 'publishable' | 'anon' | 'none';
  secretRejected: boolean;
}

/**
 * Resolves a safe publishable or anon key for the frontend browser.
 * Strictly rejects any secret or service-role key from browser memory.
 */
export function getSafeBrowserApiKey(overrideKey?: string): SafeKeyResolution {
  const env = (import.meta as any).env || {};
  let secretRejected = false;

  // 1. If custom key is provided (e.g. from diagnostic tester)
  if (overrideKey) {
    const cleaned = cleanSupabaseKey(overrideKey);
    if (cleaned) {
      if (isSecretKey(cleaned)) {
        console.error('[Supabase Client Security] Secret/service-role key was rejected. Only publishable or anon keys are allowed in browser code.');
        return { key: null, keyType: 'none', secretRejected: true };
      }
      return { 
        key: cleaned, 
        keyType: cleaned.startsWith('sb_publish') ? 'publishable' : 'anon', 
        secretRejected: false 
      };
    }
  }

  // 2. Check VITE_SUPABASE_PUBLISHABLE_KEY
  const pub = cleanSupabaseKey(env.VITE_SUPABASE_PUBLISHABLE_KEY);
  if (pub) {
    if (isSecretKey(pub)) {
      secretRejected = true;
      console.warn('[Supabase Client Security] Detected secret key in VITE_SUPABASE_PUBLISHABLE_KEY. Rejecting from browser client.');
    } else {
      return { key: pub, keyType: 'publishable', secretRejected: false };
    }
  }

  // 3. Check VITE_SUPABASE_ANON_KEY
  const anon = cleanSupabaseKey(env.VITE_SUPABASE_ANON_KEY);
  if (anon) {
    if (isSecretKey(anon)) {
      secretRejected = true;
      console.warn('[Supabase Client Security] Detected secret key in VITE_SUPABASE_ANON_KEY. Rejecting from browser client.');
    } else {
      return { 
        key: anon, 
        keyType: anon.startsWith('sb_publish') ? 'publishable' : 'anon', 
        secretRejected 
      };
    }
  }

  // 4. Fall back to verified project publishable key
  return { 
    key: SUPABASE_DEFAULT_PUBLISHABLE_KEY, 
    keyType: 'publishable', 
    secretRejected 
  };
}


/**
 * Lazy initialization of Supabase client using Publishable key or legacy Anon key.
 * Never exposes service role or secret key to the browser.
 */
export function getSupabase(overrideKey?: string): SupabaseClient | null {
  const env = (import.meta as any).env || {};
  const url = cleanSupabaseUrl(env.VITE_SUPABASE_URL);
  const { key: publicApiKey } = getSafeBrowserApiKey(overrideKey);

  if (!url || !publicApiKey) {
    return null;
  }

  // Recreate client if url or key changed
  if (supabaseInstance && lastUsedUrl === url && lastUsedKey === publicApiKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, publicApiKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    lastUsedUrl = url;
    lastUsedKey = publicApiKey;
    return supabaseInstance;
  } catch (err) {
    console.warn('[Supabase Client] Failed to initialize Supabase client:', err);
    return null;
  }
}

export const isSupabaseConfigured = (): boolean => {
  const env = (import.meta as any).env || {};
  const url = cleanSupabaseUrl(env.VITE_SUPABASE_URL);
  const { key } = getSafeBrowserApiKey();
  return Boolean(url && key);
};

export interface SupabaseClientTestResult {
  connected: boolean;
  projectUrl: string;
  hasKey: boolean;
  keyType: 'publishable' | 'anon' | 'none';
  secretRejected?: boolean;
  tableTest?: {
    table: string;
    accessible: boolean;
    error?: string;
    rowCount?: number;
    isEmpty?: boolean;
  };
  details?: string;
  error?: string;
}

/**
 * Direct client-side test to verify connection to the real Supabase project and courses table.
 * Uses only safe publishable/anon keys.
 */
export async function testSupabaseClientConnection(customKey?: string): Promise<SupabaseClientTestResult> {
  const env = (import.meta as any).env || {};
  const url = cleanSupabaseUrl(env.VITE_SUPABASE_URL);
  const { key: effectiveKey, keyType, secretRejected } = getSafeBrowserApiKey(customKey);

  if (secretRejected && !effectiveKey) {
    return {
      connected: false,
      projectUrl: url,
      hasKey: false,
      keyType: 'none',
      secretRejected: true,
      error: 'Security Notice: A secret/service-role key was detected and blocked from frontend code. Please use your Supabase Publishable key (sb_publish_...) or Anon key (eyJhbGci...).'
    };
  }

  if (!effectiveKey) {
    return {
      connected: false,
      projectUrl: url,
      hasKey: false,
      keyType: 'none',
      error: 'Supabase Publishable/Anon key is not provided. Please set VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.'
    };
  }

  const client = getSupabase(effectiveKey);
  if (!client) {
    return {
      connected: false,
      projectUrl: url,
      hasKey: true,
      keyType,
      error: 'Could not construct Supabase client instance with the provided parameters.'
    };
  }


  try {
    // Query the courses table: check accessibility and exact row count
    const { data, error, count } = await client
      .from('courses')
      .select('id, title', { count: 'exact' })
      .limit(5);

    if (error) {
      // Analyze the Postgres / PostgREST error
      let remediation = error.message;
      if (error.message.includes('relation "public.courses" does not exist') || error.code === '42P01') {
        remediation = 'Table "courses" does not exist yet. Please run the SQL schema migration.';
      } else if (error.code === '42501' || error.message.toLowerCase().includes('violates row-level security')) {
        remediation = 'RLS policy on "courses" is blocking read access. Enable a public SELECT policy: CREATE POLICY "Public read published courses" ON public.courses FOR SELECT USING (true);';
      } else if (error.message.toLowerCase().includes('invalid api key')) {
        remediation = 'Invalid Supabase API key provided. Check Project Settings -> API in Supabase.';
      }

      return {
        connected: false,
        projectUrl: url,
        hasKey: true,
        keyType,
        tableTest: {
          table: 'courses',
          accessible: false,
          error: error.message
        },
        error: remediation
      };
    }

    const rowCount = typeof count === 'number' ? count : (Array.isArray(data) ? (data as any[]).length : 0);
    const isEmpty = rowCount === 0;

    return {
      connected: true,
      projectUrl: url,
      hasKey: true,
      keyType,
      tableTest: {
        table: 'courses',
        accessible: true,
        rowCount,
        isEmpty
      },
      details: isEmpty
        ? 'The "courses" table is connected, accessible via RLS, and currently empty (0 records). Ready for course creation.'
        : `Successfully connected. "courses" table contains ${rowCount} course records.`
    };
  } catch (err: any) {
    const isFetchError = err?.name === 'TypeError' && String(err?.message || '').includes('Failed to fetch');
    const msg = isFetchError
      ? `Network fetch failed to reach ${url}. Please confirm network access and that your project URL is correct.`
      : (err?.message || 'Handshake failed.');

    return {
      connected: false,
      projectUrl: url,
      hasKey: true,
      keyType,
      error: msg
    };
  }
}

