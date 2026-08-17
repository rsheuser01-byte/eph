const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  if (email.length < 5 || email.length > 254) {
    return false;
  }
  return EMAIL_PATTERN.test(email);
}
