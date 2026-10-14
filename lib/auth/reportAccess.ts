/**
 * Centralized authorization rules for trade analysis reports, certificates, and strategy profiles.
 *
 * Report Rules:
 * 1. A report marked as public (is_public = true) is accessible by anyone (anonymous or authenticated).
 * 2. A private report (is_public = false or null) is strictly accessible ONLY by its authenticated owner (user_id === session.user.id).
 * 3. Anonymous reports without owner (user_id = null) are NOT accessible unless explicitly published (is_public = true).
 * 4. Third-party users requesting a private report must receive no sensitive data or existence confirmation.
 *
 * Strategy Profile Rules:
 * 1. 'public': accessible by anyone, indexable by search engines, listed in rankings and directories.
 * 2. 'unlisted': accessible by anyone who possesses the direct link (slug), NOT indexable (noindex, nofollow),
 *               excluded from rankings and directories.
 * 3. 'private': strictly accessible ONLY by its authenticated owner (user_id === session.user.id).
 *               Third parties and anonymous visitors receive 404 (Not Found).
 */

export interface ReportAccessTarget {
    user_id?: string | null;
    is_public?: boolean | null;
}

export function canAccessReport(
    report: ReportAccessTarget | null | undefined,
    userId?: string | null
): boolean {
    if (!report) return false;

    const isPublic = Boolean(report.is_public);
    const isOwner = Boolean(userId && report.user_id && report.user_id === userId);

    return isPublic || isOwner;
}

export interface StrategyProfileAccessTarget {
    user_id?: string | null;
    visibility?: string | null;
}

export function canAccessStrategyProfile(
    profile: StrategyProfileAccessTarget | null | undefined,
    userId?: string | null
): boolean {
    if (!profile) return false;

    const visibility = profile.visibility || "public";

    if (visibility === "public" || visibility === "unlisted") {
        return true;
    }

    if (visibility === "private") {
        return Boolean(userId && profile.user_id && profile.user_id === userId);
    }

    return false;
}

export function isStrategyProfileIndexable(
    profile: StrategyProfileAccessTarget | null | undefined
): boolean {
    if (!profile) return false;
    return (profile.visibility || "public") === "public";
}
