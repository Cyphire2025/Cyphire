import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

export default function EducationPostTask() {
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [price, setPrice] = useState("");
  const [numApplicants, setNumApplicants] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [deliverableTypes, setDeliverableTypes] = useState([]);

  const handleDeliverableClick = (type) => {
    setDeliverableTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }
      if (prev.length >= 20) {
        alert("You can select up to 20 deliverables.");
        return prev;
      }
      return [...prev, type];
    });
  };



  // Floating particles (background animation)
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
      formData.append("category", "Education");
      formData.append("numberOfApplicants", numApplicants);
      formData.append("price", price);
      formData.append("deadline", deadline);
      formData.append("metadata", JSON.stringify({ subject, deliverables: deliverableTypes, }));

      attachments.forEach((file) => formData.append("attachments", file));

      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        setPosted(true);
        setTimeout(() => {
          navigate("/tasks"); // go to marketplace after posting
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
            Post an Education Task
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

        {/* Title */}
        <label className="block mb-2 text-lg">Title</label>
        <input
          type="text"
          placeholder="e.g., Class 11 Chemistry – Notes on Organic Chemistry"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />

        {/* Subject */}
        <label className="block mb-2 text-lg">Subject</label>
        <input
          type="text"
          placeholder="e.g., Chemistry"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />

        {/* Deliverable Type */}
        <label className="block mb-2 text-lg">Deliverables</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {["Assignment", "Notes", "Question Bank", "PPT", "Quiz"].map((type) => {
            const selected = deliverableTypes.includes(type);
            const disabled = !selected && deliverableTypes.length >= 20;
            return (
              <motion.div
                whileTap={!disabled ? { scale: 0.95 } : undefined}
                whileHover={!disabled ? { scale: 1.05 } : undefined}
                key={type}
                onClick={() => !disabled && handleDeliverableClick(type)}
                className={`px-4 py-2 rounded-full cursor-${disabled ? "not-allowed" : "pointer"} transition-all text-sm md:text-base
          ${selected
                    ? "bg-purple-600 border border-purple-400 shadow-lg shadow-purple-500/40"
                    : `bg-[#1f1f1f]/80 border ${disabled ? "border-gray-800 opacity-50" : "border-gray-700 hover:border-purple-400"}`}
        `}
              >
                {type}
              </motion.div>
            );
          })}
        </div>


        {/* Description */}
        <label className="block mb-2 text-lg">Details / Description</label>
        <textarea
          placeholder="Describe the deliverable requirements (length, format, topics, etc.)"
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
          placeholder="e.g., 1500"
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

      {/* Keyframes */}
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
