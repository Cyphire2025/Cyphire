import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const remember = url.searchParams.get("remember") === "1";

    if (token) {
      const store = remember ? localStorage : sessionStorage;
      store.setItem("token", token);
      navigate("/home", { replace: true });
    } else {
      navigate("/signin?error=missing_token");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <p>Completing sign-in…</p>
    </div>
  );
}
