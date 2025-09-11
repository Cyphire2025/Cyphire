import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function PostTask() {
  const navigate = useNavigate();

  const categories = [
    "Design",
    "Development",
    "Marketing",
    "Writing",
    "Data",
    "AI",
    "DevOps",
  ];

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [numApplicants, setNumApplicants] = useState("");
  const [price, setPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
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

  // Limit to max 3 categories
  const handleCategoryClick = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      if (prev.length >= 3) {
        alert("You can select up to 3 categories.");
        return prev;
      }
      return [...prev, category];
    });
  };

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    if (attachments.length + files.length <= 5) {
      setAttachments([...attachments, ...files]);
    } else {
      alert("You can only upload up to 5 attachments.");
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handlePayment = async () => {
    try {
      if (!price || Number(price) <= 0) {
        alert("Please enter a valid price before continuing.");
        return;
      }

      const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

      // 1) create Razorpay order
      const orderRes = await axios.post(
        `${API_BASE}/api/payment/create-order`,
        { amount: Number(price) },
        { withCredentials: true }
      ); 
      const order = orderRes.data;

      // 2) open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Cyphire",
        description: "Task Payment",
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3) on success -> verify + create task (multipart with attachments)
            const fd = new FormData();
            fd.append("razorpay_order_id", response.razorpay_order_id);
            fd.append("razorpay_payment_id", response.razorpay_payment_id);
            fd.append("razorpay_signature", response.razorpay_signature);

            fd.append("title", title);
            fd.append("description", description);
            selectedCategories.forEach((c) => fd.append("categories[]", c));
            fd.append("numberOfApplicants", numApplicants);
            fd.append("price", price);
            fd.append("deadline", deadline);
            attachments.forEach((f) => fd.append("attachments", f));

            setPosting(true);

            const verifyRes = await axios.post(
              `${API_BASE}/api/payment/verify-payment`,
              fd,
              {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
              }
            );

            if (verifyRes.data?.success) {
              setPosted(true);
              setTimeout(() => navigate("/home"), 1500);
            } else {
              setPosting(false);
              alert("Payment verified but task creation failed.");
            }
          } catch (e) {
            setPosting(false);
            console.error("Verify/payment error:", e);
            alert("Payment verification failed. Task not posted.");
          }
        },
        theme: { color: "#5A67D8" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error("Payment init error:", e);
      alert("Failed to start payment.");
    }
  };

  const handleSubmit = async () => {
    try {
      setPosting(true);        // ⏳ Show overlay
      setPosted(false);        // ✅ Reset posted state

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      selectedCategories.forEach(cat => formData.append("categories[]", cat));
      formData.append("numberOfApplicants", numApplicants);
      formData.append("price", price);
      formData.append("deadline", deadline);
      formData.append("createdBy", "64b7e261fc13ae1fbd000001"); // Dummy user ID for now
      attachments.forEach(file => formData.append("attachments", file));

      const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        credentials: "include",   // 👈 ADD THIS
        body: formData,
      });

      if (res.ok) {
        setPosted(true); // ✅ Show success message on overlay
        setTimeout(() => {
          navigate("/home");
        }, 2000); // ⏱️ Wait 2s before redirecting
      } else {
        const errData = await res.json();
        alert(`❌ Failed to post task: ${errData.message || "Unknown error"}`);
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
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-pink-900 animate-gradient" />

      {/* Floating Particles */}
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
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"
          >
            Post Tech Task
          </motion.h1>

          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate("/choose-category")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f1f1f]/80 hover:bg-[#2a2a2a] border border-gray-700 hover:border-purple-400 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back to Choose Category </span>
          </motion.button>
        </div>

        {/* Title */}
        <label className="block mb-2 text-lg">Title</label>
        <input
          type="text"
          placeholder="Enter task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />

        {/* Description */}
        <textarea
          placeholder="Enter task description"
          rows="4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        ></textarea>



        {/* Category */}
        <label className="block mb-2 text-lg">Sub Category</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => {
            const selected = selectedCategories.includes(cat);
            const disabled = !selected && selectedCategories.length >= 3;
            return (
              <motion.div
                whileTap={!disabled ? { scale: 0.95 } : undefined}
                whileHover={!disabled ? { scale: 1.05 } : undefined}
                key={cat}
                onClick={() => !disabled && handleCategoryClick(cat)}
                className={`px-4 py-2 rounded-full cursor-${disabled ? "not-allowed" : "pointer"} transition-all text-sm md:text-base
        ${selected
                    ? "bg-purple-600 border border-purple-400 shadow-lg shadow-purple-500/40"
                    : `bg-[#1f1f1f]/80 border ${disabled ? "border-gray-800 opacity-50" : "border-gray-700 hover:border-purple-400"}`}
      `}
              >
                {cat}
              </motion.div>
            );
          })}

        </div>

        {/* Number of Applicants */}
        <label className="block mb-2 text-lg">Number of Applicants</label>
        <input
          type="number"
          placeholder="Enter max applicants"
          value={numApplicants}
          onChange={(e) => setNumApplicants(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />

        {/* Price */}
        <label className="block mb-2 text-lg">Price</label>
        <input
          type="number"
          placeholder="Enter price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />


        {/* Deadline */}
        <label className="block mb-2 text-lg">Deadline</label>
        <input
          type="date"
          value={deadline} // ✅ bind state
          onChange={(e) => setDeadline(e.target.value)} // ✅ update state
          className="w-full p-3 mb-4 rounded-lg bg-[#1f1f1f]/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />

        {/* Attachments */}
        <label className="block mb-2 text-lg">Attachments (Max 20)</label>
        <div
          className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center bg-[#1f1f1f]/50 hover:border-purple-400 transition-all cursor-pointer mb-4"
          onClick={() => document.getElementById("fileInput").click()}
        >
          <p className="text-gray-400">Click or drag files here to upload</p>
          <p className="text-sm text-gray-500">Max 20 files allowed</p>
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
          onClick={handlePayment}   // <-- new
        >
          Continue to Payment      
        </motion.button>

      </motion.div>
      {posting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md text-white text-lg font-semibold">
          <div className="flex flex-col items-center gap-4">
            {!posted ? (
              <>
                <svg className="animate-spin h-10 w-10 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Posting your task...</span>
              </>
            ) : (
              <>
                <svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
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
