// Maps a raw Supabase auth error message to a key under the `authErrors`
// i18n namespace, so users see a localized message instead of English internals.
export function authErrorKey(message?: string): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "invalidCredentials";
  }
  if (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already exists")
  ) {
    return "emailInUse";
  }
  if (m.includes("weak") || m.includes("at least") || m.includes("should be")) {
    return "weakPassword";
  }
  if (m.includes("session") || m.includes("expired") || m.includes("jwt")) {
    return "sessionExpired";
  }
  return "generic";
}
