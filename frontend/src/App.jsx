import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// pages
import LandingPage from "./pages/landing";
import Signup from "./pages/signup";
import Signin from "./pages/signin";
import Home from "./pages/home";
import Tasks from "./pages/Tasks"

import TechPostTask from "./pages/Techposttask.jsx";
import ViewTask from "./pages/viewtask";
import EducationPostTask from "./pages/EducationPostTask"; 
import ArchitecturePostTask from "./pages/ArchitecturePostTask"; 
import EventManagementPostTask from "./pages/EventManagementPostTask";
import ListSponsorship from "./pages/ListSponsorship.jsx";
import Sponsorships from "./pages/Sponsorships.jsx";

import ProfilePage from "./pages/profile";
import DashboardPage from "./pages/dashboard";
import ViewProfilePage from "./pages/viewprofile";

import Pricing from "./pages/Pricing.jsx";
import Checkout from "./pages/Checkout.jsx";
import ChooseCategory from "./pages/ChooseCategory"; 

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
    // Check if user is authenticated via HTTP-only cookie
    const checkAuth = async () => {
      try {
        const response = await fetch(`${import.meta.env?.VITE_API_BASE || "http://localhost:5000"}/api/auth/me`, {
          credentials: "include"
        });
        if (response.ok) {
          navigate("/home", { replace: true });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    
    checkAuth();
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Router>
      {/* 👇 This ensures scroll resets on every route change */}
      <ScrollToTop />
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Auth & Core */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/home" element={<Home />} />

        <Route path="/tasks" element={<Tasks />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/posttask-tech" element={<TechPostTask />} />
        <Route path="/posttask-education" element={<EducationPostTask />} />
        <Route path="/posttask-architecture" element={<ArchitecturePostTask />} />
        <Route path="/posttask-event" element={<EventManagementPostTask />} />
        <Route path="/List-Sponsorship" element={<ListSponsorship />} />
        <Route path="/Sponsorships" element={<Sponsorships/>}/>

        <Route path="/task/:id" element={<ViewTask />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/u/:slug" element={<ViewProfilePage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/choose-category" element={<ChooseCategory />} />


        {/* Pages2 */}
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/team" element={<Team />} />
        <Route path="/join-us" element={<JoinUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/how-it-works" element={<HowitWorks />} />
        <Route path="/pricing-plans" element={<PricingPlans />} />
        <Route path="/escrow-policy" element={<EscrowPolicy />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/how-it-works" element={<HowitWorks />} />
        <Route path="/escrow-policy" element={<EscrowPolicy />} />


      </Routes>
    </Router>
  );
}

export default App;