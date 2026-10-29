import axios from "axios";
const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 60000 });
const isAdminRequest = (config) => config.url === "/admin/session" ||
  (config.method === "get" && ["/orders", "/sourcing-requests"].includes(config.url)) ||
  /^\/orders\/[^/]+\/status$/.test(config.url || "") || config.url === "/ai/product-description";
api.interceptors.request.use((config) => {
  if (isAdminRequest(config)) {
    try {
      const token = sessionStorage.getItem("ketheriel_admin_access");
      if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if ([401, 403].includes(error.response?.status) && isAdminRequest(error.config || {})) {
    try { sessionStorage.removeItem("ketheriel_admin_access"); } catch {}
    window.dispatchEvent(new Event("ketheriel-admin-expired"));
  }
  return Promise.reject(error);
});

export const formatMVR = (n) => `MVR ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const WHATSAPP_NUMBER = "9607912865"; // international format without +
export const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const computeDeliveryRange = (product, island) => {
  if (!island?.island || !Number.isInteger(product.estimated_delivery_min_days) || !Number.isInteger(product.estimated_delivery_max_days)) return { min: null, max: null };
  const min = product.estimated_delivery_min_days + island.min;
  const max = product.estimated_delivery_max_days + island.max;
  return { min, max };
};

export const sessionId = (() => {
  try {
    let s = localStorage.getItem("mv_session_id");
    if (!s) {
      s = "sess_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem("mv_session_id", s);
    }
    return s;
  } catch { return "sess_" + Date.now(); }
})();
