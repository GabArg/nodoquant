import { getSupabaseServer } from "./supabase";

/**
 * Generates a URL-friendly slug from a string.
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')     // Remove all non-word chars
        .replace(/--+/g, '-')       // Replace multiple - with single -
        .replace(/^-+/, '')         // Trim - from start of text
        .replace(/-+$/, '');        // Trim - from end of text
}

/**
 * Generates a unique slug for a strategy profile, handled collisions with a suffix.
 */
export async function generateUniqueSlug(
    baseName: string,
    tableName: string = 'public_strategy_profiles'
): Promise<string> {
    const supabase = getSupabaseServer();
    if (!supabase) throw new Error("Supabase client not initialized");

    const baseSlug = slugify(baseName);

    // Check if base slug exists
    const { data: existing } = await supabase
        .from(tableName)
        .select('slug')
        .like('slug', `${baseSlug}%`);

    if (!existing || existing.length === 0) {
        return baseSlug;
    }

    // Collision handling: find largest suffix
    const slugs = existing.map(s => s.slug);
    if (!slugs.includes(baseSlug)) {
        return baseSlug;
    }

    let suffix = 2;
    while (slugs.includes(`${baseSlug}-${suffix}`)) {
        suffix++;
    }

    return `${baseSlug}-${suffix}`;
}
