/**
 * Returns the base URL based on the environment.
 * Prioritizes explicitly set NEXT_PUBLIC_SITE_URL, 
 * then falls back to Vercel's generated URL (NEXT_PUBLIC_VERCEL_URL),
 * and finally defaults to localhost for local dev.
 */
export const getBaseUrl = () => {
    let url =
        process?.env?.NEXT_PUBLIC_APP_URL ??   // Explicit app URL (highest priority)
        process?.env?.NEXT_PUBLIC_SITE_URL ??   // Set this to https://nodoquant.com in production
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Set automatically by Vercel
        "http://localhost:3000"; // Local fallback

    // Make sure to include `https://` when not localhost
    url = url.startsWith("http") ? url : `https://${url}`;
    
    // Ensure trailing slash is removed for consistent path building
    url = url.endsWith("/") ? url.slice(0, -1) : url;
    
    return url;
};
