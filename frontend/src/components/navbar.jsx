// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { FiSearch, FiMessageSquare, FiSettings, FiChevronDown, FiMenu, FiX } from "react-icons/fi";
import { FaRegBell } from "react-icons/fa";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

export default function Navbar() {
  const [msgOpen, setMsgOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [user, setUser] = useState(null);

  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllMsgs, setShowAllMsgs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  const GradientText = ({ children }) => (
    <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-pink-400 bg-clip-text text-transparent">
      {children}
    </span>
  );

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/notifications`, {
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setMessages(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch {
      // ignore
    }
  };

  const markMessageRead = async (index) => {
    try {
      await fetch(`${API_BASE}/api/auth/notifications/${index}/read`, {
        method: "POST",
        credentials: "include",
      });
      setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, read: true } : m)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore 
    }
  };

  useEffect(() => {
    let alive = true;
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const d = await res.json();
          if (alive) setUser(d.user || null);
        } else if (alive) setUser(null);
      } catch {
        if (alive) setUser(null);
      }
    };
    fetchMe();
    const onFocus = () => {
      fetchMe();
      fetchMessages();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    fetchMessages();
    const iv = setInterval(fetchMessages, 30000);
    return () => clearInterval(iv);
  }, []);

  const initial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();
  const avatarUrl = user?.avatar && typeof user.avatar === "string" ? user.avatar : null;

  // Only show 5 until expanded
  const visibleMessages = showAllMsgs ? messages : messages.slice(0, 1);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/10 via-white/5 to-purple-500/10 backdrop-blur-2xl" />
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 40%, rgba(133, 42, 218, 0.08) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(255,255,255,0.1)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-4 sm:mx-6 lg:mx-8 px-1 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 flex-grow">
          <h1
            className="text-xl sm:text-2xl lg:text-[26px] font-bold cursor-pointer transition-colors duration-200 whitespace-nowrap"
            onClick={() => (window.location.href = "/home")}
          >
            <GradientText>
              {user?.plan === "plus"
                ? "Cyphire Plus"
                : user?.plan === "ultra"
                  ? "Cyphire Ultra"
                  : "Cyphire"}
            </GradientText>
          </h1>


          <div className="hidden md:flex items-center bg-white/10 rounded-full px-3 sm:px-4 py-2 w-full max-w-xs lg:max-w-lg focus-within:ring-2 focus-within:ring-purple-500 transition">
            <FiSearch className="text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-sm text-gray-200 w-full placeholder-gray-500"
            />
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-3">
          {/* Discover */}
          <div className="relative">
            <button
              onClick={() => {
                setDiscoverOpen((v) => !v);
                setSolutionsOpen(false);
                setMsgOpen(false);
                setNotifOpen(false);
                setSettingsOpen(false);
                setProfileOpen(false);
              }}
              className="flex items-center text-gray-300 hover:text-white transition-all duration-200 font-medium"
            >
              About
              <FiChevronDown
                className={`ml-1 transition-transform duration-200 ${discoverOpen ? "rotate-180" : ""}`}
              />
            </button>
            {discoverOpen && (
              <div className="absolute right-0 mt-3 w-52 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-20">
                {["About Us", "Team", "Join us", "Contact"].map((t, i) => {
                  const paths = ["/about-us", "/team", "/join-us", "/contact"];
                  return (
                    <Link
                      key={i}
                      to={paths[i]}
                      className="block px-4 py-3 text-sm text-gray-200 hover:bg-white/20 border-b last:border-b-0 border-white/10"
                    >
                      {t}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Solutions */}
          <div className="relative">
            <button
              onClick={() => {
                setSolutionsOpen((v) => !v);
                setDiscoverOpen(false);
                setMsgOpen(false);
                setNotifOpen(false);
                setSettingsOpen(false);
                setProfileOpen(false);
              }}
              className="flex items-center text-gray-300 hover:text-white transition-all duration-200 font-medium"
            >
              Explore
              <FiChevronDown
                className={`ml-1 transition-transform duration-200 ${solutionsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {solutionsOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-20">
                {["How It Works", "Pricing & Plans", "Escrow Policy", "Help Center"].map((t, i) => {
                  const paths = ["/how-it-works", "/pricing", "/escrow-policy", "/help"];
                  return (
                    <Link
                      key={i}
                      to={paths[i]}
                      className="block px-4 py-3 text-sm text-gray-200 hover:bg-white/20 border-b last:border-b-0 border-white/10"
                    >
                      {t}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="relative">
            <button
              onClick={() => {
                setMsgOpen((v) => !v);
                setNotifOpen(false);
                setSettingsOpen(false);
                setDiscoverOpen(false);
                setSolutionsOpen(false);
                setProfileOpen(false);
                if (!msgOpen) fetchMessages();
              }}
              className="text-gray-300 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-white/10 relative"
              aria-label="Messages"
            >
              <FiMessageSquare size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-fuchsia-400 ring-2 ring-black/70" />
              )}
            </button>

            {msgOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/20">
                  <h3 className="text-sm font-semibold text-white">Messages</h3>
                </div>

                {/* Body */}
                <div className="max-h-96 overflow-auto divide-y divide-white/10">
                  {messages.length === 0 ? (
                    <div className="p-4">
                      <p className="text-sm text-gray-300 text-center">No new messages</p>
                    </div>
                  ) : (
                    visibleMessages.map((m, i) => (
                      <div key={i} className="p-3">
                        <div className="flex items-start gap-2">
                          {!m.read && <span className="mt-1 h-2 w-2 rounded-full bg-fuchsia-400 flex-shrink-0" />}
                          <div className="min-w-0">
                            <div className="text-sm text-white">
                              {m.message}{" "}
                              {m.link && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    // mark the specific message read
                                    const idx = messages.indexOf(m);
                                    if (idx > -1) {
                                      await fetch(`${API_BASE}/api/auth/notifications/${idx}/read`, {
                                        method: "POST",
                                        credentials: "include",
                                      }).catch(() => { });
                                    }
                                    window.location.href = m.link;
                                  }}
                                  className="text-fuchsia-300 hover:text-fuchsia-200 underline underline-offset-2 ml-1"
                                >
                                  View Dashboard
                                </button>
                              )}
                            </div>
                            <button
                              onClick={async () => {
                                await fetch(`${API_BASE}/api/auth/notifications/${i}`, {
                                  method: "DELETE",
                                  credentials: "include",
                                });
                                setMessages(prev => prev.filter((_, j) => j !== i));
                              }}
                              className="text-red-400 hover:text-red-300 text-xs ml-2"
                            >
                              Delete
                            </button>
                            {!!m.createdAt && (
                              <div className="mt-1 text-[10px] text-white/40">
                                {new Date(m.createdAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer: View all / Show less */}
                <div className="p-3 border-t border-white/20">
                  {messages.length > 1 ? (
                    <button
                      className="w-full text-xs text-purple-300 hover:text-purple-200"
                      onClick={() => setShowAllMsgs((v) => !v)}
                    >
                      {showAllMsgs ? "Show less" : "View all messages"}
                    </button>
                  ) : (
                    // no empty space when there's 0 or 1 message
                    <div className="h-0" />
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Notifications (unchanged placeholder) */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen((v) => !v);
                setMsgOpen(false);
                setSettingsOpen(false);
                setDiscoverOpen(false);
                setSolutionsOpen(false);
                setProfileOpen(false);
              }}
              className="text-gray-300 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-white/10 relative"
            >
              <FaRegBell size={20} />
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-20">
                <div className="px-4 py-3 border-b border-white/20">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-300 text-center">No new notifications</p>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => {
                setSettingsOpen((v) => !v);
                setMsgOpen(false);
                setNotifOpen(false);
                setDiscoverOpen(false);
                setSolutionsOpen(false);
                setProfileOpen(false);
              }}
              className="text-gray-300 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-white/10"
            >
              <FiSettings size={20} />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-20">
                <a className="block px-4 py-3 text-sm text-gray-200 hover:bg-white/20 border-b border-white/10 cursor-pointer">
                  Preferences
                </a>
                <a className="block px-4 py-3 text-sm text-gray-200 hover:bg-white/20 border-b border-white/10 cursor-pointer">
                  Account
                </a>
                <a className="block px-4 py-3 text-sm text-gray-200 hover:bg-white/20 cursor-pointer">
                  Help & Support
                </a>
              </div>
            )}
          </div>

          {/* Dashboard button */}
          <button
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-4 py-1.5 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Dashboard
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen((v) => !v);
                setMsgOpen(false);
                setNotifOpen(false);
                setSettingsOpen(false);
                setDiscoverOpen(false);
                setSolutionsOpen(false);
              }}
              className="flex items-center justify-center h-9 w-9 rounded-full border border-white/20 bg-white/10 overflow-hidden hover:bg-white/15 transition"
              aria-label="Profile"
              title={user?.name || user?.email || "Profile"}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-white/90">{initial}</span>
              )}
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-44 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-20">
                <a
                  className="block px-4 py-3 text-sm text-gray-200 hover:bg-white/20 cursor-pointer"
                  onClick={() => (window.location.href = "/profile")}
                >
                  View Profile
                </a>
                <a
                  className="block px-4 py-3 text-sm text-red-300 hover:bg-red-400/20 cursor-pointer"
                  onClick={async () => {
                    try {
                      await fetch(`${API_BASE}/api/auth/signout`, {
                        method: "POST",
                        credentials: "include",
                      });
                    } catch {
                      // ignore
                    }
                    localStorage.removeItem("token");
                    localStorage.removeItem("userId");
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("userId");
                    window.location.href = "/signin";
                  }}
                >
                  Sign Out
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Mobile actions (Dashboard + Profile + Menu) */}
        <div className="lg:hidden flex items-center space-x-3">
          {/* Dashboard button always visible */}
          <button
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-3 py-1.5 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Dashboard
          </button>

          {/* Profile */}
          {/* Profile button (mobile + desktop) */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center justify-center h-9 w-9 rounded-full border border-white/20 bg-white/10 overflow-hidden hover:bg-white/15 transition"
              aria-label="Profile"
              title={user?.name || user?.email || "Profile"}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-white/90">{initial}</span>
              )}
            </button>

            {/* Profile dropdown - floats below avatar */}
            {profileOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 border border-white/10 shadow-xl rounded-xl z-50 backdrop-blur-md p-2 animate-fadeIn">
                <a
                  onClick={() => {
                    setProfileOpen(false);
                    window.location.href = "/profile";
                  }}
                  className="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded-md cursor-pointer transition"
                >
                  👤 View Profile
                </a>
                <a
                  onClick={async () => {
                    setProfileOpen(false);
                    try {
                      await fetch(`${API_BASE}/api/auth/signout`, {
                        method: "POST",
                        credentials: "include",
                      });
                    } catch {}
                    localStorage.removeItem("token");
                    localStorage.removeItem("userId");
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("userId");
                    window.location.href = "/signin";
                  }}
                  className="block px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-md cursor-pointer transition"
                >
                  🚪 Sign Out
                </a>
              </div>
            )}
          </div>


          {/* Hamburger menu toggle */}
          <button
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>


      </div>
      {/* Step 3: Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/20 shadow-lg">
          <div className="flex flex-col space-y-3 p-4 text-gray-200">
            {/* Search bar */}
            <div className="flex items-center bg-white/10 rounded-full px-3 py-2">
              <FiSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none text-sm text-gray-200 w-full placeholder-gray-500"
              />
            </div>

            {/* Discover */}
          <div className="relative">
            <button
              onClick={() => {
                setDiscoverOpen((v) => !v);
                setSolutionsOpen(false);
                setMsgOpen(false);
                setNotifOpen(false);
                setSettingsOpen(false);
                setProfileOpen(false);
              }}
              className="flex items-center text-gray-300 hover:text-white transition-all duration-200 font-medium"
            >
              About
              <FiChevronDown
                className={`ml-1 transition-transform duration-200 ${discoverOpen ? "rotate-180" : ""}`}
              />
            </button>
            {discoverOpen && (
              <div className="absolute right-0 mt-3 w-52 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-20">
                {["About Us", "Team", "Join us", "Contact"].map((t, i) => {
                  const paths = ["/about-us", "/team", "/join-us", "/contact"];
                  return (
                    <Link
                      key={i}
                      to={paths[i]}
                      className="block px-4 py-3 text-sm text-gray-200 hover:bg-white/20 border-b last:border-b-0 border-white/10"
                    >
                      {t}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Solutions */}
          <div className="relative">
            <button
              onClick={() => {
                setSolutionsOpen((v) => !v);
                setDiscoverOpen(false);
                setMsgOpen(false);
                setNotifOpen(false);
                setSettingsOpen(false);
                setProfileOpen(false);
              }}
              className="flex items-center text-gray-300 hover:text-white transition-all duration-200 font-medium"
            >
              Explore
              <FiChevronDown
                className={`ml-1 transition-transform duration-200 ${solutionsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {solutionsOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-20">
                {["How It Works", "Pricing & Plans", "Escrow Policy", "Help Center"].map((t, i) => {
                  const paths = ["/how-it-works", "/pricing", "/escrow-policy", "/help"];
                  return (
                    <Link
                      key={i}
                      to={paths[i]}
                      className="block px-4 py-3 text-sm text-gray-200 hover:bg-white/20 border-b last:border-b-0 border-white/10"
                    >
                      {t}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

            {/* Messages */}
            <button
              className="text-left hover:text-white"
              onClick={() => setMsgOpen((v) => !v)}
            >
              Messages{" "}
              {unreadCount > 0 && (
                <span className="ml-1 text-xs text-pink-400">({unreadCount})</span>
              )}
            </button>
            {msgOpen && (
              <div className="pl-4 space-y-1 text-sm">
                {messages.length === 0 ? (
                  <p className="text-gray-400">No new messages</p>
                ) : (
                  visibleMessages.map((m, i) => (
                    <div key={i} className="py-1">
                      <span className="text-white">{m.message}</span>
                      {m.link && (
                        <button
                          onClick={() => (window.location.href = m.link)}
                          className="text-fuchsia-300 hover:text-fuchsia-200 underline underline-offset-2 ml-1"
                        >
                          View
                        </button>
                      )}
                    </div>
                  ))
                )}
                {messages.length > 1 && (
                  <button
                    className="text-purple-300 hover:text-purple-200 text-xs"
                    onClick={() => setShowAllMsgs((v) => !v)}
                  >
                    {showAllMsgs ? "Show less" : "View all messages"}
                  </button>
                )}
              </div>
            )}

            {/* Notifications */}
            <button
              className="text-left hover:text-white"
              onClick={() => setNotifOpen((v) => !v)}
            >
              Notifications
            </button>
            {notifOpen && (
              <div className="pl-4 text-sm text-gray-400">No new notifications</div>
            )}

            {/* Settings */}
            <button
              className="text-left hover:text-white"
              onClick={() => setSettingsOpen((v) => !v)}
            >
              Settings
            </button>
            {settingsOpen && (
              <div className="pl-4 space-y-1 text-sm">
                <a className="block hover:text-white cursor-pointer">Preferences</a>
                <a className="block hover:text-white cursor-pointer">Account</a>
                <a className="block hover:text-white cursor-pointer">
                  Help & Support
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
