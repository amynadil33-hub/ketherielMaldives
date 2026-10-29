import React from "react";
import { useCatalog } from "../lib/catalog.jsx";

export default function CatalogNotice() {
  const { error, loading } = useCatalog();
  if (loading) return <p role="status" className="bg-stone-100 px-4 py-3 text-center text-sm">Loading the catalogue…</p>;
  if (!error) return null;
  return <p role="status" className="bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">The catalogue is temporarily unavailable. Please try again later.</p>;
}
