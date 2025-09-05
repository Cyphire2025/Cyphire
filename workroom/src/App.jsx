import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import WorkroomPage from "./pages/workroom";
import WorkroomComplete from "./pages/WorkroomComplete";
import WorkroomPayment from "./pages/WorkroomPayment";

// Simple landing page with button
function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center text-white bg-black">
      <h1 className="text-3xl font-bold mb-4">Welcome to Cyphire Workroom 🚀</h1>
      <p className="text-gray-400 mb-6">Click below to enter a workroom.</p>
      <button
        onClick={() => navigate("/workroom/demo123")}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-colors"
      >
        Go to Workroom
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Default landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Workroom main chat */}
        <Route path="/workroom/:workroomId" element={<WorkroomPage />} />

        {/* After both finalise */}
        <Route
          path="/workroom/:workroomId/complete"
          element={<WorkroomComplete />}
        />

        {/* Payment details */}
        <Route
          path="/workroom/:workroomId/payment"
          element={<WorkroomPayment />}
        />

        {/* Fallback 404 */}
        <Route
          path="*"
          element={
            <div className="h-screen flex items-center justify-center text-white bg-black">
              <h1 className="text-2xl font-bold">404 – Page Not Found</h1>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
