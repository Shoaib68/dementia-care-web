import { createClient } from "@supabase/supabase-js";

const ADMIN_TIMEOUT_MS = 15_000; // 15 seconds
const ADMIN_MAX_RETRIES = 3;

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code: string = (error as any)?.code ?? (error as any)?.cause?.code ?? '';
  const msg = error.message ?? '';
  return (
    code === 'ECONNRESET' ||
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'ECONNREFUSED' ||
    msg.includes('fetch failed') ||
    msg.includes('Connect Timeout') ||
    msg.includes('ECONNRESET')
  );
}

async function adminFetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let lastError: Error = new Error('Unknown fetch error');

  for (let attempt = 0; attempt < ADMIN_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ADMIN_TIMEOUT_MS);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      const isLast = attempt === ADMIN_MAX_RETRIES - 1;
      if (isLast || !isRetryableError(error)) throw error;

      // Exponential back-off: 500 ms → 1 000 ms
      await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }

  throw lastError;
}

// Lazy initialization to prevent client-side crashes
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function createSupabaseAdminClient() {
  // Only allow on server-side
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be used on the server-side');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase admin configuration');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: { fetch: adminFetchWithRetry },
    realtime: {
      params: { eventsPerSecond: 2 },
    },
  });
}

function getSupabaseAdminClient() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createSupabaseAdminClient();
  }
  return _supabaseAdmin;
}

// This client uses the service role key and bypasses RLS
// Only use this for server-side admin operations like user creation
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseAdminClient();
    const value = client[prop as keyof typeof client];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
