import { checkoutAttempt, rememberOrder, orderAccessHeaders, orderAccessToken } from "./orderAccess";
beforeEach(() => {
  sessionStorage.clear(); let count = 0;
  Object.defineProperty(window, "crypto", { configurable: true, value: { randomUUID: () => `attempt-${++count}`, getRandomValues: (bytes) => bytes.fill(123) } });
});
test("network retries reuse the same checkout key and strong private token", () => {
  const payload = { items: [{ id: "one", quantity: 1 }] }; const first = checkoutAttempt(payload);
  expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/); expect(checkoutAttempt(payload)).toEqual(first);
});
test("changed details cannot create a second order while confirmation is uncertain", () => { checkoutAttempt({ total: 1 }); expect(() => checkoutAttempt({ total: 2 })).toThrow("Retry the previous checkout"); });
test("successful checkout stores private access and clears the retry attempt", () => {
  const first = checkoutAttempt({ total: 1 }); rememberOrder("MV1", first.token);
  expect(orderAccessToken("MV1")).toBe(first.token); expect(orderAccessHeaders("MV1")).toEqual({ "X-Order-Token": first.token });
  expect(orderAccessToken("MV2")).toBe(""); expect(checkoutAttempt({ total: 1 }).key).not.toBe(first.key);
});
