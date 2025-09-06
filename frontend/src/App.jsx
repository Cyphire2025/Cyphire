import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// pages
import LandingPage from "./pages/landing";
import Signup from "./pages/signup";
import Signin from "./pages/signin";
import Home from "./pages/home";
import PostTask from "./pages/posttask";
import ViewTask from "./pages/viewtask";
import ProfilePage from "./pages/profile";
import DashboardPage from "./pages/dashboard";
import ViewProfilePage from "./pages/viewprofile";
import Pricing from "./pages/Pricing.jsx";
import Checkout from "./pages/Checkout.jsx";

// pages2
import ScrollToTop from "./components/ScrollToTop";
import AboutUs from "./pages2/AboutUs.jsx";
import Team from "./pages2/Team.jsx";
import JoinUs from "./pages2/JoinUs.jsx";
import Contact from "./pages2/Contact.jsx";
import HowitWorks from "./pages2/HowItWorks.jsx";
import PricingPlans from "./pages2/PricingPlans.jsx";
import EscrowPolicy from "./pages2/EscrowPolicy.jsx";
import HelpCenter from "./pages2/HelpCenter.jsx";

function AutoLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Router>
      {/* 👇 This ensures scroll resets on every route change */}
      <ScrollToTop />

      <Routes>
        {/* Auth & Core */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/posttask" element={<PostTask />} />
        <Route path="/task/:id" element={<ViewTask />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/u/:slug" element={<ViewProfilePage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* Pages2 */}
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/team" element={<Team />} />
        <Route path="/join-us" element={<JoinUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/how-it-works" element={<HowitWorks />} />
        <Route path="/pricing-plans" element={<PricingPlans />} />
        <Route path="/escrow-policy" element={<EscrowPolicy />} />
        <Route path="/help" element={<HelpCenter />} />
      </Routes>
    </Router>
  );
}

export default App;
