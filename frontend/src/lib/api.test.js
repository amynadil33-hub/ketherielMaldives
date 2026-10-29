import { api, computeDeliveryRange, formatMVR } from "./api";
jest.mock("axios", () => ({ create: jest.fn(() => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } })) }));
const requestHook = api.interceptors.request.use.mock.calls[0][0];
test("admin bearer tokens are attached only to management requests", () => {
  const hook = requestHook;
  sessionStorage.setItem("ketheriel_admin_access", "admin-test-token");
  expect(hook({ url: "/orders", method: "get", headers: {} }).headers.Authorization).toBe("Bearer admin-test-token");
  expect(hook({ url: "/orders", method: "post", headers: {} }).headers.Authorization).toBeUndefined();
  expect(hook({ url: "/orders/MV1", method: "get", headers: {} }).headers.Authorization).toBeUndefined();
  expect(hook({ url: "/admin/session", headers: { Authorization: "Bearer new-sign-in" } }).headers.Authorization).toBe("Bearer new-sign-in");
  sessionStorage.clear();
});
test("delivery estimates have no invented default when reviewed data is missing", () => {
  expect(computeDeliveryRange({}, { island: "Test", min: 0, max: 0 })).toEqual({ min: null, max: null });
  expect(computeDeliveryRange({ estimated_delivery_min_days: 15, estimated_delivery_max_days: 15 }, { island: "Test", min: 0, max: 0 })).toEqual({ min: 15, max: 15 });
});
test("MVR display preserves approved fractional prices", () => { expect(formatMVR(120.5)).toBe("MVR 120.5"); });
