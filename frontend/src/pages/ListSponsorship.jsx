import React, { useState, useEffect } from "react";
import {motion} from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

export default function SponsorshipPostTask() {
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [eventTypes, setEventTypes] = useState([]);
  const [expectedReturns, setExpectedReturns] = useState([]);
  const [eventOther, setEventOther] = useState("");
  const [returnsOther, setReturnsOther] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [logo, setLogo] = useState(null);


  // Floating particles (background)
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const newParticles = Array.from({ length: 15 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 6 + 4}px`,
      duration: `${Math.random() * 8 + 4}s`,
    }));
    setParticles(newParticles);
  }, []);


  // Options
  const eventTypeOptions = [
    "College Fest",
    "Tech Seminar",
    "Hackathon",
    "Cultural Event",
    "Corporate Conference",
    "Community Meetup",
    "Concert / Festival",
    "Other",
  ];

  const returnOptions = [
    "Logo on Posters / Flyers",
    "Stall / Booth at Venue",
    "Social Media Mentions",
    "Mentions in Brochure / Announcements",
    "Free Passes / VIP Invites",
    "Banner Display at Venue",
    "Branding on Merchandise",
    "Other",
  ];

  // Multi-select handler
  const toggleSelection = (value, state, setState, max = 20) => {
  if (value === "Other") {
    if (state.includes("Other")) {
      setState(state.filter((v) => v !== "Other"));
    } else {
      setState([...state, "Other"]);
    }
    return;
  }

  setState((prev) => {
    if (prev.includes(value)) return prev.filter((v) => v !== value);
    if (prev.length >= max) {
      alert(`You can select up to ${max}`);
      return prev;
    }
    return [...prev, value];
  });
};


  // File upload
  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    if (attachments.length + files.length <= 5) {
      setAttachments([...attachments, ...files]);
    } else {
      alert("You can upload up to 5 attachments.");
    }
  };
  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Direct Post (no payment)
  const handleDirectPost = async () => {
    try {
      setPosting(true);
      setPosted(false);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", "Sponsorship");
      formData.append("description", description);
      if (logo) formData.append("logo", logo);

      const allEvents = [...eventTypes];
      if (eventOther.trim()) allEvents.push(eventOther.trim());

      const allReturns = [...expectedReturns];
      if (returnsOther.trim()) allReturns.push(returnsOther.trim());

      formData.append(
        "metadata",
        JSON.stringify({
          budgetRange,
          eventTypes: allEvents,
          expectedReturns: allReturns,
          tier: "basic", // default
        })
      );

      attachments.forEach((file) => formData.append("attachments", file));

      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        setPosted(true);
        setTimeout(() => navigate("/sponsorships"), 2000);
      } else {
        const errData = await res.json();
        alert(`❌ Failed: ${errData.error || "Unknown error"}`);
        setPosting(false);
      }
    } catch (e) {
      console.error(e);
      setPosting(false);
      alert("❌ Failed to post sponsorship.");
    }
  };

  // Handle Payment + Post
  const handlePayment = async (amount) => {
    try {
      setPosting(true);
      setPosted(false);

      // Step 1: Create Razorpay order
      const orderRes = await axios.post(
        `${API_BASE}/api/payment/create-order`,
        { amount },
        { withCredentials: true }
      );
      const order = orderRes.data;

      // Step 2: Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Cyphire Sponsorship",
        description: amount === 1000 ? "Basic Sponsorship" : "Premium Sponsorship",
        order_id: order.id,
        handler: async function () {
          try {
            // Step 3: Verify + Create Sponsorship Task
            const formData = new FormData();
            formData.append("title", title);
            formData.append("category", "Sponsorship");
            formData.append("description", description);
            if (logo) formData.append("logo", logo);


            const allEvents = [...eventTypes];
            if (eventOther.trim()) allEvents.push(eventOther.trim());

            const allReturns = [...expectedReturns];
            if (returnsOther.trim()) allReturns.push(returnsOther.trim());

            formData.append(
              "metadata",
              JSON.stringify({
                budgetRange,
                eventTypes: allEvents,
                expectedReturns: allReturns,
                tier: amount === 1000 ? "basic" : "premium",
              })
            );

            attachments.forEach((file) => formData.append("attachments", file));

            const res = await fetch(`${API_BASE}/api/tasks`, {
              method: "POST",
              credentials: "include",
              body: formData,
            });

            if (res.ok) {
              setPosted(true);
              setTimeout(() => navigate("/sponsorships"), 2000);
            } else {
              const errData = await res.json();
              alert(`❌ Failed: ${errData.error || "Unknown error"}`);
              setPosting(false);
            }
          } catch (e) {
            console.error(e);
            setPosting(false);
            alert("❌ Payment verified but task failed.");
          }
        },
        theme: { color: amount === 1000 ? "#8B5CF6" : "#EC4899" },
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("❌ Payment failed.");
      setPosting(false);
    }
  };


  return (
    <div className="relative flex justify-center items-start min-h-screen text-white p-4 md:p-10 gap-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-pink-900 animate-gradient" />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute bg-purple-500/40 rounded-full blur-md animate-float"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
          }}
        />
      ))}

      {/* Left Side Features */}
      <div className="hidden md:flex flex-col gap-6 w-1/3">
        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-fuchsia-500/30 shadow-lg">
          <h2 className="text-xl font-bold text-fuchsia-300">Basic Sponsorship</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>✔ Listing visible in sponsor marketplace</li>
            <li>✔ Up to 3 attachments (logos, brochures)</li>
            <li>✔ Standard placement in search</li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-pink-500/30 shadow-lg">
          <h2 className="text-xl font-bold text-pink-300">Premium Sponsorship</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>🌟 Highlighted placement in marketplace</li>
            <li>🌟 Up to 5 attachments (logos, decks)</li>
            <li>🌟 Featured in “Spotlight Sponsors” carousel</li>
          </ul>
        </div>

      </div>

      {/* Main Form */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full md:w-2/3 bg-[#141414]/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-purple-500/30 shadow-purple-500/20"
      >
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-6">
          Post a Sponsorship Listing
        </h1>

        {/* Logo Upload */}
        <label className="block mb-2 text-lg">Title Image</label>
        <div
          className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center bg-[#1f1f1f]/50 hover:border-purple-400 cursor-pointer mb-4"
          onClick={() => document.getElementById("logoInput").click()}
        >
          <p className="text-gray-400">Click or drag an image here</p>
          <p className="text-sm text-gray-500">1 file (PNG/JPG)</p>
          <input
            id="logoInput"
            type="file"
            accept="image/*"
            onChange={(e) => setLogo(e.target.files[0])}
            className="hidden"
          />
        </div>
        {logo && (
          <div className="flex items-center gap-2 mb-4 bg-[#1f1f1f]/80 px-3 py-2 rounded-lg border border-gray-700">
            <span className="text-sm">{logo.name}</span>
            <button onClick={() => setLogo(null)} className="text-red-400 hover:text-red-500">
              ✕
            </button>
          </div>
        )}

        {/* Title */}
        <label className="block mb-2 text-lg">Title</label>
        <input
          type="text"
          placeholder="e.g., BrandX Sponsorship"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:ring-2 focus:ring-purple-500"
        />

        {/* Budget */}
        <label className="block mb-2 text-lg">Budget / Contribution</label>
        <input
          type="text"
          placeholder="e.g., ₹20,000 – ₹50,000"
          value={budgetRange}
          onChange={(e) => setBudgetRange(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:ring-2 focus:ring-purple-500"
        />

        {/* Event Types */}
        <label className="block mb-2 text-lg">Interested Event Types</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {eventTypeOptions.map((type) => {
            const selected = eventTypes.includes(type);
            return (
              <motion.div
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                key={type}
                onClick={() => toggleSelection(type, eventTypes, setEventTypes)}
                className={`px-4 py-2 rounded-full cursor-pointer transition-all text-sm
                  ${selected
                    ? "bg-purple-600 border border-purple-400"
                    : "bg-[#1f1f1f]/80 border border-gray-700 hover:border-purple-400"}`}
              >
                {type}
              </motion.div>
            );
          })}
        </div>
        {eventTypes.includes("Other") && (
          <input
            type="text"
            maxLength={50}
            placeholder="Enter custom event type..."
            value={eventOther}
            onChange={(e) => setEventOther(e.target.value)}
            className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:ring-2 focus:ring-purple-500 text-sm"
          />
        )}

        {/* Expected Returns */}
        <label className="block mb-2 text-lg">Expected Returns</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {returnOptions.map((ret) => {
            const selected = expectedReturns.includes(ret);
            return (
              <motion.div
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                key={ret}
                onClick={() => toggleSelection(ret, expectedReturns, setExpectedReturns)}
                className={`px-4 py-2 rounded-full cursor-pointer transition-all text-sm
                  ${selected
                    ? "bg-pink-600 border border-pink-400"
                    : "bg-[#1f1f1f]/80 border border-gray-700 hover:border-pink-400"}`}
              >
                {ret}
              </motion.div>
            );
          })}
        </div>
        {expectedReturns.includes("Other") && (
          <input
            type="text"
            maxLength={50}
            placeholder="Enter custom return..."
            value={returnsOther}
            onChange={(e) => setReturnsOther(e.target.value)}
            className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:ring-2 focus:ring-pink-500 text-sm"
          />
        )}

        {/* Description */}
        <label className="block mb-2 text-lg">Description</label>
        <textarea
          placeholder="Describe your sponsorship offer and conditions..."
          rows="4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:ring-2 focus:ring-purple-500"
        ></textarea>

        {/* Attachments */}
        <label className="block mb-2 text-lg">Attachments</label>
        <div
          className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center bg-[#1f1f1f]/50 hover:border-purple-400 cursor-pointer mb-4"
          onClick={() => document.getElementById("fileInput").click()}
        >
          <p className="text-gray-400">Click or drag files here to upload</p>
          <p className="text-sm text-gray-500">Max 5 files</p>
          <input
            id="fileInput"
            type="file"
            multiple
            onChange={handleAttachmentChange}
            className="hidden"
          />
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="bg-[#1f1f1f]/80 px-3 py-2 rounded-lg flex items-center gap-2 border border-gray-700"
            >
              <span className="text-sm truncate max-w-[120px]">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-red-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          {/* 🔥 New Plain Post Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex-1 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 shadow-md font-semibold"
            onClick={handleDirectPost}
            disabled={posting}
          >
            {posting ? "Posting..." : "Post (Free)"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex-1 py-3 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 shadow-lg font-semibold"
            onClick={() => handlePayment(1000)}
            disabled={posting}
          >
            {posting ? "Processing..." : "Post Basic (₹1000)"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex-1 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-fuchsia-600 shadow-lg font-semibold"
            onClick={() => handlePayment(2000)}
            disabled={posting}
          >
            {posting ? "Processing..." : "Post Premium (₹2000)"}
          </motion.button>
        </div>
      </motion.div>



      {/* Success Overlay */}
      {posted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="mx-auto mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-400 shadow-[0_0_40px_rgba(34,197,94,0.6)]"
            >
              <span className="text-5xl">✅</span>
            </motion.div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-green-400 mb-2">
              Task Posted Successfully!
            </h2>
            <p className="text-gray-300 mb-6">
              Redirecting you to Sponsorships...
            </p>

            {/* Subtle confetti effect */}
            <motion.div
              className="flex justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i % 2 === 0 ? "#22c55e" : "#4ade80",
                  }}
                  initial={{ y: 0 }}
                  animate={{ y: [0, -20, 0] }}
                  transition={{
                    duration: 1 + i * 0.05,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
