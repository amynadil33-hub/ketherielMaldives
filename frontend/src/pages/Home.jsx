import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Search, MapPin, Truck, ShieldCheck, MessageCircle, Star } from "lucide-react";
import { TRENDING_PROMPTS } from "../lib/seedData";
import { useCatalog } from "../lib/catalog.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useStore } from "../lib/store.jsx";
import { useT } from "../lib/i18n.jsx";

const heroImage = "https://images.pexels.com/photos/972937/pexels-photo-972937.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1600";

export default function Home() {
  const { island } = useStore();
  const { categories, products, brands, reviews } = useCatalog();
  const t = useT();
  const featured = products.filter((p) => p.is_featured).slice(0, 8);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/70 to-transparent" />
          <div className="absolute inset-0 grain opacity-20" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-32 grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-7 animate-fade-up">
            <div className="text-xs uppercase tracking-[0.3em] text-amber-300 font-semibold mb-4">{t("hero.kicker")}</div>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance">
              {t("hero.title.line1")}<br />
              <span className="italic text-teal-300">{t("hero.title.line2.a")}</span> {t("hero.title.line2.b")}
            </h1>
            <p className="mt-5 max-w-xl text-base md:text-lg text-slate-200 leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-6 py-3 font-semibold hover:bg-amber-300 transition-colors" data-testid="hero-shop-cta">
                {t("hero.cta.shop")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/find-it-for-me" className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur px-6 py-3 font-semibold hover:bg-white/20" data-testid="hero-fifm-cta">
                <Search className="h-4 w-4" /> {t("hero.cta.fifm")}
              </Link>
              <Link to="/ai" className="inline-flex items-center gap-2 rounded-full gradient-coral px-6 py-3 font-semibold hover:opacity-90" data-testid="hero-ai-cta">
                <Sparkles className="h-4 w-4" /> {t("hero.cta.ai")}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> {t("hero.trust.verified")}</span>
              <span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4 text-emerald-400" /> {t("hero.trust.wa")}</span>
              <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-emerald-400" /> {t("hero.trust.delivery")}</span>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="glass-dark rounded-3xl p-6 md:p-7">
              <div className="text-xs uppercase tracking-widest text-teal-300 font-semibold">{t("hero.island.deliveringTo")}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <MapPin className="h-5 w-5 text-amber-300" />
                <div className="font-display text-3xl">{island.island}</div>
              </div>
              <div className="text-sm text-slate-300 mt-1">{island.atoll} {t("hero.island.atoll")} · +{island.min}–{island.max} {t("product.days")} · MVR {island.fee} {t("hero.island.delivery")}</div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Link to="/track" className="rounded-2xl bg-white/10 hover:bg-white/15 p-4 transition-colors">
                  <div className="text-xs uppercase tracking-widest text-teal-300">{t("nav.track")}</div>
                  <div className="font-semibold mt-1">{t("foot.linkTrack")}</div>
                </Link>
                <Link to="/delivery" className="rounded-2xl bg-white/10 hover:bg-white/15 p-4 transition-colors">
                  <div className="text-xs uppercase tracking-widest text-teal-300">{t("cart.delivery")}</div>
                  <div className="font-semibold mt-1">{t("nav.delivery")}</div>
                </Link>
              </div>
              <div className="mt-5 text-[11px] text-slate-400 leading-relaxed">
                {t("hero.island.confirm")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY BENTO */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-teal-700 font-semibold">{t("sec.shopByMood.kicker")}</div>
            <h2 className="font-display text-4xl md:text-5xl mt-2">{t("sec.shopByMood.title")}</h2>
          </div>
          <Link to="/shop" className="hidden md:inline-flex items-center gap-1 text-sm font-semibold hover:text-teal-700">Explore all <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-8 gap-3 md:gap-5">
          {categories.map((c, i) => {
            // bento sizing: big block for index 0 and 3
            const span = i === 0 ? "md:col-span-4 md:row-span-2" : i === 1 ? "md:col-span-4" : i === 2 ? "md:col-span-2" : i === 3 ? "md:col-span-2" : "md:col-span-2";
            const tall = i === 0 ? "aspect-[4/5] md:aspect-auto md:h-[420px]" : "aspect-[4/5]";
            return (
              <Link key={c.slug} to={`/shop/${c.slug}`} className={`relative group overflow-hidden rounded-2xl ${span} ${tall}`} data-testid={`home-cat-${c.slug}`}>
                <img src={c.img} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-[10px] uppercase tracking-[0.3em] opacity-90">{c.count}+ products</div>
                  <div className="font-display text-2xl md:text-3xl mt-1">{c.name}</div>
                  <div className="text-xs md:text-sm text-white/80 mt-1 line-clamp-1">{c.blurb}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* HOT PRE-ORDERS */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-rose-500 font-semibold">{t("sec.hot.kicker")}</div>
            <h2 className="font-display text-3xl md:text-4xl mt-2">{t("sec.hot.title")}</h2>
          </div>
          <Link to="/shop" className="text-sm font-semibold inline-flex items-center gap-1 hover:text-teal-700">{t("sec.hot.seeAll")} <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* FIND IT FOR ME BANNER */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-3xl overflow-hidden gradient-ocean text-white px-8 py-12 md:px-14 md:py-16 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7">
            <div className="text-xs uppercase tracking-[0.3em] text-amber-300 font-semibold">{t("sec.fifm.kicker")}</div>
            <h2 className="font-display text-4xl md:text-5xl mt-3 leading-tight">{t("sec.fifm.title.a")} <span className="italic text-teal-200">{t("sec.fifm.title.b")}</span></h2>
            <p className="mt-4 text-slate-200 max-w-xl">{t("sec.fifm.sub")}</p>
            <div className="mt-6 flex gap-3 flex-wrap">
              <Link to="/find-it-for-me" className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-6 py-3 font-semibold hover:bg-amber-300" data-testid="home-fifm-cta">
                <Search className="h-4 w-4" /> {t("sec.fifm.cta")}
              </Link>
              <a href="https://wa.me/9607912865?text=Hi%20Ketheriel%20Maldives%2C%20I%20need%20help%20sourcing%20a%20product." className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-semibold hover:bg-white/10" data-testid="home-fifm-wa">
                <MessageCircle className="h-4 w-4" /> {t("sec.fifm.wa")}
              </a>
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-5 space-y-3">
              {[
                { label: t("sec.fifm.label.url"), val: "amazon.in/s/...gift-box" },
                { label: t("sec.fifm.label.upload"), val: "screenshot.jpg" },
                { label: t("sec.fifm.label.budget"), val: "MVR 1,200" },
                { label: t("sec.fifm.label.deliverTo"), val: island.island },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-white/10 pb-2 last:border-0">
                  <span className="text-xs uppercase tracking-widest text-teal-200">{r.label}</span>
                  <span className="font-semibold">{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI CONCIERGE */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5">
            <div className="text-xs uppercase tracking-[0.25em] text-teal-700 font-semibold">{t("sec.ai.kicker")}</div>
            <h2 className="font-display text-4xl md:text-5xl mt-3 leading-tight">{t("sec.ai.title")}</h2>
            <p className="text-slate-600 mt-5 max-w-md">{t("sec.ai.sub")}</p>
            <Link to="/ai" className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-6 py-3 font-semibold hover:bg-slate-800" data-testid="home-ai-cta">
              <Sparkles className="h-4 w-4 text-amber-300" /> {t("sec.ai.cta")}
            </Link>
          </div>
          <div className="md:col-span-7 grid sm:grid-cols-2 gap-3">
            {TRENDING_PROMPTS.map((p, i) => (
              <Link key={p} to="/ai" className="group rounded-2xl border border-stone-200 bg-white p-5 hover:border-teal-700 hover:-translate-y-0.5 transition-all" data-testid={`home-prompt-${i}`}>
                <div className="text-xs uppercase tracking-widest text-rose-500 font-semibold">{t("sec.ai.prompt")} {i + 1}</div>
                <div className="mt-2 text-slate-900 font-semibold">{p}</div>
                <div className="mt-3 text-xs text-slate-500 inline-flex items-center gap-1">{t("sec.ai.try")} <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS TIMELINE */}
      <section className="bg-stone-100 mt-16">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.25em] text-teal-700 font-semibold">{t("sec.howSummary.kicker")}</div>
            <h2 className="font-display text-4xl md:text-5xl mt-3">{t("sec.howSummary.title")}</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-5 gap-4">
            {[
              { num: "01", title: t("sec.howSummary.s1.t"), note: t("sec.howSummary.s1.n") },
              { num: "02", title: t("sec.howSummary.s2.t"), note: t("sec.howSummary.s2.n") },
              { num: "03", title: t("sec.howSummary.s3.t"), note: t("sec.howSummary.s3.n") },
              { num: "04", title: t("sec.howSummary.s4.t"), note: t("sec.howSummary.s4.n") },
              { num: "05", title: t("sec.howSummary.s5.t"), note: t("sec.howSummary.s5.n") },
            ].map((s) => (
              <div key={s.num} className="rounded-2xl bg-white border border-stone-200 p-5">
                <div className="font-display text-3xl text-teal-700">{s.num}</div>
                <div className="mt-2 font-semibold text-slate-900">{s.title}</div>
                <div className="text-sm text-slate-500 mt-1">{s.note}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/how-it-works" className="text-sm font-semibold text-teal-700 hover:underline">{t("sec.howSummary.viewFull")}</Link>
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-xs uppercase tracking-[0.25em] text-teal-700 font-semibold text-center">{t("sec.brands.kicker")}</div>
        <h2 className="font-display text-3xl md:text-4xl text-center mt-2">{t("sec.brands.title")}</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {brands.map((b) => (
            <div key={b.slug} className="rounded-full border border-stone-200 bg-white px-5 py-2 text-sm text-slate-700 hover:border-teal-700 hover:text-teal-700 transition-colors">
              {b.name}
              {b.verified && <span className="ml-2 text-[10px] uppercase tracking-widest text-amber-600">{t("sec.brands.verified")}</span>}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500 max-w-2xl mx-auto">{t("sec.brands.disclaimer")}</p>
      </section>

      {/* REVIEWS */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.25em] text-amber-300 font-semibold">{t("sec.reviews.kicker")}</div>
            <h2 className="font-display text-4xl md:text-5xl mt-3">{t("sec.reviews.title")}</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-4 gap-5">
            {reviews.map((r, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="flex gap-0.5">
                  {[...Array(r.rating)].map((_, k) => <Star key={k} className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />)}
                </div>
                <p className="mt-3 text-sm text-slate-200 leading-relaxed">"{r.comment}"</p>
                <div className="mt-4 text-xs">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-slate-400">{r.island} {r.verified && <span className="text-emerald-300">· {t("sec.reviews.verified")}</span>}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
