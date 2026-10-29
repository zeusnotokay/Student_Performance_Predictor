const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
const TOKEN_KEY = "spp:auth-token";
const USER_KEY = "spp:auth-user";

export type AuthUser = { name: string; studentId: string };
export function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
export function getUser(): AuthUser | null { try { const raw = localStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) as AuthUser : null; } catch { return null; } }
export function isLoggedIn() { return Boolean(getToken()); }
export function saveAuth(token: string, user: AuthUser) { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); }
export function logout() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
export async function authRequest(mode: "login" | "register", data: Record<string, string>) {
  const response = await fetch(`${API_URL}/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message ?? "Authentication failed. Check that the backend is running.");
  return payload as { token: string; user: AuthUser };
}
