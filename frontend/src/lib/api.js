import axios from "axios";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 60000 });

export const formatMVR = (n) => `MVR ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const WHATSAPP_NUMBER = "9607912865"; // international format without +
export const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const computeDeliveryRange = (product, island) => {
  const min = (product.estimated_delivery_min_days || 7) + (island?.min || 0);
  const max = (product.estimated_delivery_max_days || 14) + (island?.max || 1);
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
