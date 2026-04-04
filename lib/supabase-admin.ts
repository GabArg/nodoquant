import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a server-only Supabase client that uses the SERVICE ROLE KEY.
 * WARNING: Never import this on the client-side. It bypasses all RLS.
 */
export function getSupabaseAdmin() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("CRITICAL: Missing Supabase Admin configuration. SUPABASE_SERVICE_ROLE_KEY is required.");
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
