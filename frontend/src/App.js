import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "./lib/store.jsx";
import { I18nProvider } from "./lib/i18n.jsx";
import { Toaster } from "sonner";
import Header from "./components/Header.jsx";
import MobileBottomNav from "./components/MobileBottomNav.jsx";
import Footer from "./components/Footer.jsx";
import FloatingActions from "./components/FloatingActions.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import TrackOrder from "./pages/TrackOrder.jsx";
import FindItForMe from "./pages/FindItForMe.jsx";
import AIAssistant from "./pages/AIAssistant.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import HowItWorks from "./pages/HowItWorks.jsx";
import DeliveryIslands from "./pages/DeliveryIslands.jsx";
import Admin from "./pages/Admin.jsx";

function App() {
  return (
    <div className="App min-h-screen bg-stone-50">
      <BrowserRouter>
        <I18nProvider>
          <StoreProvider>
          <Header />
          <main className="pb-24 md:pb-0 min-h-[80vh]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:category" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
              <Route path="/track" element={<TrackOrder />} />
              <Route path="/track/:orderNumber" element={<TrackOrder />} />
              <Route path="/find-it-for-me" element={<FindItForMe />} />
              <Route path="/ai" element={<AIAssistant />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/delivery" element={<DeliveryIslands />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <Footer />
          <MobileBottomNav />
          <FloatingActions />
          <Toaster position="top-center" richColors closeButton />
        </StoreProvider>
        </I18nProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
