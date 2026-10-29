import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Checkout from "./Checkout";
import { api } from "../lib/api";
import { useStore } from "../lib/store.jsx";
import { checkoutAttempt, rememberOrder, pendingCheckout } from "../lib/orderAccess";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate, Link: ({ children }) => <span>{children}</span> }), { virtual: true });
jest.mock("../lib/store.jsx", () => ({ useStore: jest.fn() }));
jest.mock("../lib/i18n.jsx", () => ({ useT: () => (key) => key }));
jest.mock("../lib/catalog.jsx", () => ({ useCatalog: () => ({ islands: [{ island: "Test Island", atoll: "Test Atoll", fee: 20 }], products: [{ id: "product-1", estimated_delivery_min_days: 15, estimated_delivery_max_days: 15 }] }) }));
jest.mock("../lib/api", () => ({ api: { get: jest.fn(), post: jest.fn() }, formatMVR: (n) => `MVR ${n}` }));
jest.mock("../lib/orderAccess", () => ({ checkoutAttempt: jest.fn(), rememberOrder: jest.fn(), pendingCheckout: jest.fn(), discardRejectedCheckout: jest.fn() }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
global.IS_REACT_ACT_ENVIRONMENT = true;
let root, container, store;
beforeEach(() => {
  store = { cart: [{ key: "one", id: "product-1", title: "Reviewed product", qty: 1, variant: null, price_mvr: 100 }], subtotal: 100,
    island: { island: "Test Island", atoll: "Test Atoll", fee: 20, min: 0, max: 0 }, cartValid: true, setIsland: jest.fn(), clearCart: jest.fn() };
  useStore.mockReturnValue(store);
  pendingCheckout.mockReturnValue(null);
  api.get.mockResolvedValue({ data: { enabled: true, payment_methods: [{ id: "bml_transfer", label: "Approved transfer", instructions: "Approved instructions" }] } });
  checkoutAttempt.mockReturnValue({ key: "attempt", token: "private-code" });
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); jest.clearAllMocks(); });
async function render() { await act(async () => root.render(<Checkout />)); }
async function prepare() {
  for (const [testId, value] of [["checkout-name", "Test Buyer"], ["checkout-phone", "+9607000000"], ["checkout-address", "Test address"]]) {
    const input = container.querySelector(`[data-testid="${testId}"] input`);
    await act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); });
  }
  await act(() => container.querySelector('[data-testid="payment-bml_transfer"] input').click());
}
async function submit() { await act(async () => container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); }

test("unconfigured checkout cannot submit and displays no invented payment options", async () => {
  api.get.mockResolvedValue({ data: { enabled: false, payment_methods: [] } });
  await render(); await submit();
  expect(container.querySelector('[data-testid="checkout-place-order"]').disabled).toBe(true);
  expect(api.post).not.toHaveBeenCalled();
  expect(container.textContent).toContain("Checkout is not yet available");
});
test("invalid cart cannot submit even if the form submit is triggered directly", async () => {
  store.cartValid = false; await render(); await prepare(); await submit(); expect(api.post).not.toHaveBeenCalled();
});
test("successful checkout sends minimal data, retains private access and then clears the cart", async () => {
  api.post.mockResolvedValue({ data: { order_number: "MV123" } });
  await render(); await prepare(); await submit();
  expect(api.post).toHaveBeenCalledWith("/orders", {
    customer_name: "Test Buyer", customer_phone: "+9607000000", customer_email: null, island: "Test Island", address_line: "Test address", notes: "", payment_method: "bml_transfer",
    items: [{ product_id: "product-1", quantity: 1, variant: null }], expected_total_mvr: 120,
  }, { headers: { "Idempotency-Key": "attempt", "X-Order-Token": "private-code" } });
  expect(rememberOrder).toHaveBeenCalledWith("MV123", "private-code"); expect(store.clearCart).toHaveBeenCalledTimes(1); expect(mockNavigate).toHaveBeenCalledWith("/order-success/MV123");
});
test("failed checkout preserves cart and private retry credentials", async () => {
  api.post.mockRejectedValue(new Error("network lost"));
  await render(); await prepare(); await submit(); await submit();
  expect(api.post).toHaveBeenCalledTimes(2); expect(api.post.mock.calls[0][2]).toEqual(api.post.mock.calls[1][2]);
  expect(store.clearCart).not.toHaveBeenCalled(); expect(rememberOrder).not.toHaveBeenCalled();
});

test("an interrupted checkout offers recovery even after a reload and with an empty cart", async () => {
  const original = { items: [{ product_id: "product-1", quantity: 1, variant: null }], expected_total_mvr: 120 };
  pendingCheckout.mockReturnValue({ key: "original-key", token: "original-code", fingerprint: JSON.stringify(original) });
  store.cart = [];
  api.post.mockResolvedValue({ data: { order_number: "MV_RECOVERED" } });
  await render();
  expect(container.textContent).toContain("Recover your previous checkout");
  await act(async () => container.querySelector("button").click());
  expect(api.post).toHaveBeenCalledWith("/orders", original, { headers: { "Idempotency-Key": "original-key", "X-Order-Token": "original-code" } });
  expect(rememberOrder).toHaveBeenCalledWith("MV_RECOVERED", "original-code");
  expect(store.clearCart).not.toHaveBeenCalled();
});

test("recovery keeps the original attempt when storage or services are unavailable", async () => {
  const original = { items: [], expected_total_mvr: 120 };
  pendingCheckout.mockReturnValue({ key: "original-key", token: "original-code", fingerprint: JSON.stringify(original) });
  api.post.mockRejectedValue({ response: { status: 503, data: { detail: "Storage unavailable" } } });
  await render();
  await act(async () => container.querySelector("button").click());
  expect(container.textContent).toContain("Recover your previous checkout");
  expect(container.textContent).toContain("Retry or contact support");
  expect(store.clearCart).not.toHaveBeenCalled();
});
