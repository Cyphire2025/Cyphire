import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

export default function EventManagementPostTask() {
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [price, setPrice] = useState("");
  const [numApplicants, setNumApplicants] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [logo, setLogo] = useState(null);

  // Metadata
  const [eventTypes, setEventTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [audienceSize, setAudienceSize] = useState("");
  const [venueType, setVenueType] = useState("");
  const [location, setLocation] = useState("");

  // Options
  const eventTypeOptions = [
    "College Fest",
    "Corporate Event",
    "Seminar / Conference",
    "Workshop",
    "Webinar",
    "Community Event",
    "Concert / Festival",
  ];

  const serviceOptions = [
    "Posters & Flyers",
    "Branding Kit (Logo/Banner/Theme)",
    "Registration Website / Portal",
    "Social Media Campaign",
    "Promo / Aftermovie Video",
    "Schedule PPT / Brochure",
    "Invitations / Email Templates",
  ];

  const venueOptions = [
    "College Campus",
    "Office / Corporate",
    "Hotel / Banquet",
    "Outdoor Venue",
    "Online",
    "Other",
  ];

  // Multi-select handler
  const toggleSelection = (value, state, setState, max = 20) => {
    setState((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= max) {
        alert(`You can select up to ${max}`);
        return prev;
      }
      return [...prev, value];
    });
  };

  // Floating background
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

  // File upload
  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    if (attachments.length + files.length <= 10) {
      setAttachments([...attachments, ...files]);
    } else {
      alert("You can upload up to 10 attachments.");
    }
  };
  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Submit task
  const handleSubmit = async () => {
    try {
      setPosting(true);
      setPosted(false);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", "Event Management");
      formData.append("numberOfApplicants", numApplicants);
      formData.append("price", price);
      formData.append("deadline", deadline);

      formData.append(
        "metadata",
        JSON.stringify({
          eventTypes,
          services,
          audienceSize,
          venueType,
          location,
        })
      );
      if (logo) formData.append("logo", logo);

      attachments.forEach((file) => formData.append("attachments", file));

      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        setPosted(true);
        setTimeout(() => {
          navigate("/tasks");
        }, 2000);
      } else {
        const errData = await res.json();
        alert(`❌ Failed to post task: ${errData.error || "Unknown error"}`);
        setPosting(false);
      }
    } catch (error) {
      console.error("Error posting task:", error);
      alert("❌ An error occurred while posting the task.");
      setPosting(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen text-white p-4 md:p-6 overflow-hidden">
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

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl bg-[#141414]/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-purple-500/30 shadow-purple-500/20"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"
          >
            Post an Event Management Task
          </motion.h1>

          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/choose-category")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f1f1f]/80 hover:bg-[#2a2a2a] border border-gray-700 hover:border-purple-400 transition-all"
          >
            ⬅ Back
          </motion.button>
        </div>

        {/* Title Image Upload */}
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
            <span className="text-sm truncate max-w-[200px]">{logo.name}</span>
            <button
              onClick={() => setLogo(null)}
              className="text-red-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        )}

        {/* Title */}
        <label className="block mb-2 text-lg">Title</label>
        <input
          type="text"
          placeholder="e.g., Annual Tech Fest – Posters + Registration Website"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />

        {/* Event Type */}
        <label className="block mb-2 text-lg">Event Type</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {eventTypeOptions.map((type) => {
            const selected = eventTypes.includes(type);
            return (
              <motion.div
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                key={type}
                onClick={() =>
                  toggleSelection(type, eventTypes, setEventTypes)
                }
                className={`px-4 py-2 rounded-full cursor-pointer transition-all text-sm md:text-base
                  ${selected
                    ? "bg-purple-600 border border-purple-400 shadow-lg shadow-purple-500/40"
                    : "bg-[#1f1f1f]/80 border border-gray-700 hover:border-purple-400"
                  }
                `}
              >
                {type}
              </motion.div>
            );
          })}
        </div>

        {/* Services */}
        <label className="block mb-2 text-lg">Services Needed</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {serviceOptions.map((srv) => {
            const selected = services.includes(srv);
            return (
              <motion.div
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                key={srv}
                onClick={() => toggleSelection(srv, services, setServices)}
                className={`px-4 py-2 rounded-full cursor-pointer transition-all text-sm md:text-base
                  ${selected
                    ? "bg-purple-600 border border-purple-400 shadow-lg shadow-purple-500/40"
                    : "bg-[#1f1f1f]/80 border border-gray-700 hover:border-purple-400"
                  }
                `}
              >
                {srv}
              </motion.div>
            );
          })}
        </div>

        {/* Event Details */}
        <label className="block mb-2 text-lg">Audience Size</label>
        <input
          type="number"
          placeholder="e.g., 500"
          value={audienceSize}
          onChange={(e) => setAudienceSize(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />

        <label className="block mb-2 text-lg">Venue Type</label>
        <select
          value={venueType}
          onChange={(e) => setVenueType(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        >
          <option value="">Select venue type</option>
          {venueOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <label className="block mb-2 text-lg">City / Location</label>
        <input
          type="text"
          placeholder="e.g., Bangalore"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />

        {/* Description */}
        <label className="block mb-2 text-lg">Details / Description</label>
        <textarea
          placeholder="Describe your event requirements, timelines, or design inspirations..."
          rows="4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        ></textarea>

        {/* Deadline */}
        <label className="block mb-2 text-lg">Deadline</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />

        {/* Budget */}
        <label className="block mb-2 text-lg">Budget (₹)</label>
        <input
          type="number"
          placeholder="e.g., 10000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />

        {/* Applicants */}
        <label className="block mb-2 text-lg">Max Applicants</label>
        <input
          type="number"
          placeholder="e.g., 5"
          value={numApplicants}
          onChange={(e) => setNumApplicants(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />

        {/* Attachments */}
        <label className="block mb-2 text-lg">Attachments</label>
        <div
          className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center bg-[#1f1f1f]/50 hover:border-purple-400 transition-all cursor-pointer mb-4"
          onClick={() => document.getElementById("fileInput").click()}
        >
          <p className="text-gray-400">Click or drag files here to upload</p>
          <p className="text-sm text-gray-500">Max 10 files</p>
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

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg shadow-purple-500/30 font-semibold text-lg"
          onClick={handleSubmit}
          disabled={posting}
        >
          {posting ? "Posting..." : "Post Task"}
        </motion.button>
      </motion.div>

      {/* Overlay */}
      {posting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md text-white text-lg font-semibold">
          <div className="flex flex-col items-center gap-4">
            {!posted ? (
              <>
                <svg
                  className="animate-spin h-10 w-10 text-pink-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                <span>Posting your task...</span>
              </>
            ) : (
              <>
                <svg
                  className="h-10 w-10 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-green-300">Task posted successfully!</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 10s ease infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
