// Private credentials stay in this browser tab; never put them in URLs or analytics.
const ATTEMPT = "ketheriel_checkout_attempt";
const ORDER_PREFIX = "ketheriel_order_access:";

export function checkoutAttempt(payload) {
  const fingerprint = JSON.stringify(payload);
  const previous = pendingCheckout();
  if (previous?.fingerprint === fingerprint && previous.key && previous.token) return previous;
  if (previous) throw new Error("Retry the previous checkout before changing the order. Its confirmation may have been interrupted.");
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const attempt = { fingerprint, key: window.crypto.randomUUID(), token };
  // Fail before submitting if private access cannot be retained for a network retry.
  sessionStorage.setItem(ATTEMPT, JSON.stringify(attempt));
  return attempt;
}

export function pendingCheckout() {
  const raw = sessionStorage.getItem(ATTEMPT);
  if (!raw) return null;
  const attempt = JSON.parse(raw);
  if (!attempt?.fingerprint || !attempt?.key || !attempt?.token) throw new Error("Checkout recovery needs support. Do not submit another order yet.");
  return attempt;
}

export function discardRejectedCheckout() {
  sessionStorage.removeItem(ATTEMPT);
}

export function rememberOrder(orderNumber, token) {
  sessionStorage.setItem(ORDER_PREFIX + orderNumber, token);
  sessionStorage.removeItem(ATTEMPT);
}

export function orderAccessToken(orderNumber) {
  try { return sessionStorage.getItem(ORDER_PREFIX + orderNumber) || ""; } catch { return ""; }
}

export function orderAccessHeaders(orderNumber, token) {
  return { "X-Order-Token": token || orderAccessToken(orderNumber) };
}
