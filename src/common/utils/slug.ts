export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const slug = slugify(base) || 'item';
  let candidate = slug;
  let i = 1;
  while (await exists(candidate)) {
    candidate = `${slug}-${i}`;
    i += 1;
  }
  return candidate;
}
