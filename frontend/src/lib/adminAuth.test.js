import { signInAdmin, signOutAdmin } from "./adminAuth";
import { api } from "./api";
jest.mock("./supabase", () => ({ SUPABASE_URL: "https://test.invalid", SUPABASE_KEY: "public-test-key", isSupabaseConfigured: true }));
jest.mock("./api", () => ({ api: { get: jest.fn() } }));
beforeEach(() => { sessionStorage.clear(); global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: "test-session" }) }); });
afterEach(() => jest.clearAllMocks());
test("stores an admin session only after server authorization", async () => {
  api.get.mockResolvedValue({ data: { id: "admin" } }); await signInAdmin("admin@test.invalid", "example-only");
  expect(api.get).toHaveBeenCalledWith("/admin/session", { headers: { Authorization: "Bearer test-session" } });
  expect(sessionStorage.getItem("ketheriel_admin_access")).toBe("test-session"); signOutAdmin(); expect(sessionStorage.getItem("ketheriel_admin_access")).toBeNull();
});
test("a valid non-admin sign-in cannot unlock the admin UI", async () => {
  api.get.mockRejectedValue(new Error("forbidden")); await expect(signInAdmin("customer@test.invalid", "example-only")).rejects.toThrow(); expect(sessionStorage.getItem("ketheriel_admin_access")).toBeNull();
});
