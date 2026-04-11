type ClassValue = string | boolean | undefined | null | (string | boolean | undefined | null)[]

export function cn(...classes: ClassValue[]): string {
  return classes
    .flat(1)
    .filter(Boolean)
    .join(' ')
}
