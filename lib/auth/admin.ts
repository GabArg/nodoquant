import "server-only";

export type AdminEnvironment = {
    ADMIN_EMAILS?: string;
    NODE_ENV?: string;
};

/**
 * Checks if a user has administrator privileges in NodoQuant.
 *
 * Rules:
 * 1. An explicit list of admin emails can be configured via ADMIN_EMAILS (comma separated).
 * 2. Any internal @nodoquant.com email address has admin privileges.
 * 3. In non-production environments (development), access can be allowed for testing if configured.
 */
export function isUserAdmin(
    user: { id: string; email?: string | null } | null | undefined,
    env: AdminEnvironment = process.env
): boolean {
    if (!user || !user.email) return false;

    const email = user.email.trim().toLowerCase();

    // 1. Specific allowlist from environment variable
    if (env.ADMIN_EMAILS) {
        const allowlist = env.ADMIN_EMAILS
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
        if (allowlist.includes(email)) return true;
    }

    // 2. Company domain check
    if (email.endsWith("@nodoquant.com")) {
        return true;
    }

    // 3. Local development fallback
    if (env.NODE_ENV === "development" && email.includes("admin")) {
        return true;
    }

    return false;
}
