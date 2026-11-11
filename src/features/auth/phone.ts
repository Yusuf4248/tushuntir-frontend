/** Uzbek mobile numbers: +998 followed by 9 digits, shown as "90 123 45 67". */
export const PHONE_PREFIX = '+998'
const LOCAL_LENGTH = 9

/** Keeps the 9 local digits from anything typed or pasted ("+998 90…", "998901…", "90-123…"). */
export function toLocalDigits(input: string): string {
  let digits = input.replace(/\D/g, '')
  if (digits.length > LOCAL_LENGTH && digits.startsWith('998')) digits = digits.slice(3)
  return digits.slice(0, LOCAL_LENGTH)
}

export function formatLocal(digits: string): string {
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)]
  return parts.filter(Boolean).join(' ')
}

export function isCompleteLocal(digits: string): boolean {
  return digits.length === LOCAL_LENGTH
}

export function toE164(digits: string): string {
  return `${PHONE_PREFIX}${digits}`
}
