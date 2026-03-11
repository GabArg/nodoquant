import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
    const isApiRoute = request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname.startsWith('/_next');
    const response = isApiRoute ? NextResponse.next() : handleI18nRouting(request);

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Remove locale prefix for routing checks
    const pathWithoutLocale = request.nextUrl.pathname.replace(/^\/(en|es)/, "");

    const protectedPaths = ["/dashboard", "/account"];
    const isProtected = protectedPaths.some((path) => pathWithoutLocale.startsWith(path));

    const proPaths = ["/dashboard/advanced", "/dashboard/analytics", "/analyzer/pro"]; // Example pro-only paths
    const isProPath = proPaths.some((path) => pathWithoutLocale.startsWith(path));

    // Fetch user plan if needed (only for protected or pro paths to save latency)
    let userPlan = "free";
    if (user && (isProtected || isProPath)) {
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("plan")
            .eq("id", user.id)
            .single();
        userPlan = profile?.plan || "free";
    }

    if (isProtected && !user) {
        // Redirigir a login si intenta entrar a dashboard sin sesión
        const url = request.nextUrl.clone();
        const locale = request.nextUrl.pathname.split("/")[1];
        if (routing.locales.includes(locale as any)) {
            url.pathname = `/${locale}/login`;
        } else {
            url.pathname = "/login";
        }
        return NextResponse.redirect(url);
    }

    if (isProPath && userPlan !== "pro") {
        // Redirigir a pricing si intenta entrar a ruta PRO sin ser PRO
        const url = request.nextUrl.clone();
        const locale = request.nextUrl.pathname.split("/")[1];
        if (routing.locales.includes(locale as any)) {
            url.pathname = `/${locale}/pricing`;
        } else {
            url.pathname = "/pricing";
        }
        return NextResponse.redirect(url);
    }

    const authPaths = ["/login", "/signup"];
    const isAuthPath = authPaths.some((path) => pathWithoutLocale.startsWith(path));

    if (isAuthPath && user) {
        // Redirigir a dashboard si ya está logueado y va al login
        const url = request.nextUrl.clone();
        const locale = request.nextUrl.pathname.split("/")[1];
        if (routing.locales.includes(locale as any)) {
            url.pathname = `/${locale}/dashboard`;
        } else {
            url.pathname = "/dashboard";
        }
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
