import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LandingPage from './pages/landing';
import Signup from './pages/signup';
import Signin from './pages/signin';
import Home from './pages/home';
import PostTask from './pages/posttask';
import ViewTask from './pages/viewtask';
import ProfilePage from './pages/profile';
import DashboardPage from "./pages/dashboard";
import ViewProfilePage from './pages/viewprofile';
import WorkroomPage from "./pages/workroom.jsx";
import WorkroomComplete from "./pages/WorkroomComplete.jsx";
import WorkroomPayment from "./pages/WorkroomPayment.jsx";
import Pricing from './pages/Pricing.jsx';
import Checkout from "./pages/Checkout.jsx";
import OAuthSuccess from "./pages/OAuthSuccess.jsx"

function AutoLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  return null;
}
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/oauth/success" element={<OAuthSuccess />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/posttask" element={<PostTask />} />
        <Route path="/task/:id" element={<ViewTask />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/u/:slug" element={<ViewProfilePage />} />
        <Route path="/workroom/:workroomId" element={<WorkroomPage />} />
        <Route path="/workroom/:workroomId/complete" element={<WorkroomComplete />} />
        <Route path="/workroom/:workroomId/payment" element={<WorkroomPayment />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </Router>
  );
}

export default App;
