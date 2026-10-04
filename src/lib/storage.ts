import { z } from 'zod';
const listSchema = z.array(z.string()).max(500);
export function loadList(key: string): string[] {
  try {
    const raw = localStorage.getItem(`afroatlas:v1:${key}`);
    if (!raw) return [];
    const parsed = listSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}
export function saveList(key: string, list: string[]): boolean {
  try {
    localStorage.setItem(`afroatlas:v1:${key}`, JSON.stringify(list));
    window.dispatchEvent(new Event('afroatlas-storage'));
    return true;
  } catch {
    return false;
  }
}
export function toggleId(
  key: string,
  id: string,
  max = 500,
): { values: string[]; message: string } {
  const values = loadList(key);
  if (values.includes(id)) {
    const next = values.filter((v) => v !== id);
    return {
      values: next,
      message: saveList(key, next)
        ? 'Retiré de la sélection'
        : 'Stockage indisponible : modification non conservée',
    };
  }
  if (values.length >= max)
    return { values, message: `La sélection est limitée à ${max} produits` };
  const next = [...values, id];
  return {
    values: next,
    message: saveList(key, next)
      ? 'Ajouté à la sélection'
      : 'Stockage indisponible : modification non conservée',
  };
}
