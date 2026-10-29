import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured } from "./supabase";
import { api } from "./api";

export async function signInAdmin(email, password) {
  if (!isSupabaseConfigured) throw new Error("Admin sign-in is not configured.");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const session = await response.json();
  if (!response.ok || !session.access_token) throw new Error("Sign-in failed. Check your details and try again.");
  // The backend verifies the identity and server-managed admin allowlist.
  await api.get("/admin/session", { headers: { Authorization: `Bearer ${session.access_token}` } });
  sessionStorage.setItem("ketheriel_admin_access", session.access_token);
}

export function signOutAdmin() {
  sessionStorage.removeItem("ketheriel_admin_access");
}
