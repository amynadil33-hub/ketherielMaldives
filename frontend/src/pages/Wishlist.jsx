import React from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { useT } from "../lib/i18n.jsx";
import { useCatalog } from "../lib/catalog.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { Heart } from "lucide-react";

export default function Wishlist() {
  const { wishlist } = useStore();
  const { products: catalogProducts } = useCatalog();
  const t = useT();
  const products = catalogProducts.filter((p) => wishlist.includes(p.id));
  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <Heart className="h-12 w-12 mx-auto text-slate-300" />
        <h1 className="font-display text-4xl mt-4">{t("wishlist.empty.title")}</h1>
        <p className="text-slate-500 mt-2">{t("wishlist.empty.sub")}</p>
        <Link to="/shop" className="mt-6 inline-block rounded-full bg-slate-900 text-white px-6 py-3 font-semibold">{t("wishlist.browse")}</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <h1 className="font-display text-4xl md:text-5xl">{t("wishlist.title")} <span className="text-teal-700">({products.length})</span></h1>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
