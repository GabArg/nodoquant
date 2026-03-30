import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getBaseUrl } from '@/lib/url';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if 'next' is in param, use it as the redirect target
    const next = searchParams.get('next') ?? '/dashboard';
    const locale = searchParams.get('locale') ?? 'en';

    if (code) {
        const cookieStore = cookies();
        const supabase = createServerClient(
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
                        } catch (error) {
                            // Cookie options fail silently from server
                        }
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // Forward to the intended path
            // Example: https://nodoquant.com/en/dashboard
            let targetPath = next.startsWith('/') ? next : `/${next}`;
            if (!targetPath.startsWith(`/${locale}`)) {
                targetPath = `/${locale}${targetPath}`;
            }
            return NextResponse.redirect(`${getBaseUrl()}${targetPath}`);
        }
    }

    // fallback to homepage with error or a specific error page
    return NextResponse.redirect(`${getBaseUrl()}/${locale}/?error=auth_callback_failed`);
}
