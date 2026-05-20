import { createBrowserClient } from "@supabase/ssr";

// Lazy initialization to ensure environment variables are loaded
let _supabase: ReturnType<typeof createBrowserClient> | null = null;

function createSupabaseClient() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing:', {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
      env: process.env.NODE_ENV
    });
    
    // Return a client with placeholder values to prevent crashes
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Getter function to ensure lazy initialization
function getSupabaseClient() {
  if (!_supabase) {
    _supabase = createSupabaseClient();
  }
  return _supabase;
}

// Export as a property getter to maintain API compatibility
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof typeof client];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
