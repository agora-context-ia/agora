// Slug URL-safe a partir de un nombre: minúsculas, sin acentos, solo
// [a-z0-9-]. Compartido por organizaciones y espacios.
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);
}
