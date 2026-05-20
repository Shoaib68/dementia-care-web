'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SERVER_TIMEOUT_MS = 20_000; // 20 seconds
const SERVER_MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 500;

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

async function serverFetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let lastError: Error = new Error('Unknown fetch error');

  for (let attempt = 0; attempt < SERVER_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);

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

      const isLast = attempt === SERVER_MAX_RETRIES - 1;
      if (isLast || !isRetryableError(error)) throw error;

      // Exponential back-off with jitter: 500 ms → 1 s → 2 s → 4 s → …
      const base = BASE_BACKOFF_MS * 2 ** attempt;
      const jitter = Math.floor(Math.random() * 200);
      await new Promise(resolve => setTimeout(resolve, Math.min(base + jitter, 8_000)));
    }
  }

  throw lastError;
}

// Server client for server-side operations
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component – safe to ignore.
          }
        },
      },
      global: { fetch: serverFetchWithRetry },
    }
  );
};
