import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { getUserEntitlement } from "./lib/payments/entitlements";

type Locale = (typeof routing.locales)[number];

const handleI18nRouting = createIntlMiddleware(routing);

function isSupportedLocale(locale: string): locale is Locale {
    return routing.locales.some(
        (supportedLocale) => supportedLocale === locale
    );
}

function getRequestLocale(request: NextRequest): Locale | null {
    const locale = request.nextUrl.pathname.split("/")[1];

    return isSupportedLocale(locale) ? locale : null;
}

export async function middleware(request: NextRequest) {
    const isApiRoute =
        request.nextUrl.pathname.startsWith("/api") ||
        request.nextUrl.pathname.startsWith("/_next");

    const response = isApiRoute
        ? NextResponse.next()
        : handleI18nRouting(request);

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    cookiesToSet.forEach(
                        ({ name, value, options }) =>
                            response.cookies.set(
                                name,
                                value,
                                options
                            )
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
    const pathWithoutLocale =
        request.nextUrl.pathname.replace(/^\/(en|es)/, "");

    const protectedPaths = ["/dashboard", "/account"];
    const isProtected = protectedPaths.some((path) =>
        pathWithoutLocale.startsWith(path)
    );

    const proPaths = [
        "/dashboard/advanced",
        "/dashboard/analytics",
        "/analyzer/pro",
    ];
    const isProPath = proPaths.some((path) =>
        pathWithoutLocale.startsWith(path)
    );

    // Fetch user plan if needed (only for protected or pro paths to save latency)
    let hasProAccess = false;

    if (user && (isProtected || isProPath)) {
        hasProAccess = (await getUserEntitlement(supabase, {
            id: user.id,
            email: user.email,
        })).isPro;
    }

    if (isProtected && !user) {
        // Redirigir a login si intenta entrar a dashboard sin sesión
        const url = request.nextUrl.clone();
        const locale = getRequestLocale(request);

        url.pathname = locale
            ? `/${locale}/login`
            : "/login";

        return NextResponse.redirect(url);
    }

    if (isProPath && !hasProAccess) {
        // Paid upgrades are unavailable during beta; return users to their dashboard.
        const url = request.nextUrl.clone();
        const locale = getRequestLocale(request);

        url.pathname = locale
            ? `/${locale}/dashboard?beta_limit=advanced`
            : "/dashboard?beta_limit=advanced";

        return NextResponse.redirect(url);
    }

    const authPaths = ["/login", "/signup"];
    const isAuthPath = authPaths.some((path) =>
        pathWithoutLocale.startsWith(path)
    );

    if (isAuthPath && user) {
        // Redirigir a dashboard si ya está logueado y va al login
        const url = request.nextUrl.clone();
        const locale = getRequestLocale(request);

        url.pathname = locale
            ? `/${locale}/dashboard`
            : "/dashboard";

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
