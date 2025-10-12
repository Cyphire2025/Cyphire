import React from "react";
import { useNavigate } from "react-router-dom";
import { motion} from "framer-motion";
// import Navbar from "../components/navbar";
import Footer from "../components/footer";

const categories = [
  {
    name: "Tech",
    desc: "From software to AI solutions, build the future with experts.",
    img: "https://img.icons8.com/color/96/000000/laptop--v1.png",
    link: "/posttask-tech",
  },
  {
    name: "Education",
    desc: "Tutors, e-learning content, and academic support on demand.",
    img: "https://img.icons8.com/color/96/000000/online-support.png",
    link: "/posttask-education",
  },
  {
    name: "Healthcare",
    desc: "Medical writers, telehealth assistants, and research support.",
    img: "https://img.icons8.com/color/96/000000/heart-health.png",
    link: "#",
  },
  {
    name: "Event Management",
    desc: "Organizers, planners, and designers to make your events shine.",
    img: "https://img.icons8.com/color/96/000000/conference.png",
    link: "/posttask-event",
  },
  {
    name: "Architecture",
    desc: "3D designs, CAD models, and urban planning tasks made simple.",
    img: "https://img.icons8.com/color/96/000000/city-buildings.png",
    link: "/posttask-architecture",
  },
  // {
  //   name: "Sponsorship",
  //   desc: "List your brand as a sponsor and unlock event partnership opportunities.",
  //   img: "https://img.icons8.com/color/96/handshake.png",
  //   link: "/posttask-sponsorship",
  // },
];

export default function ChooseCategory() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-white flex flex-col relative">
      {/* <Navbar /> */}

      {/* Background glow effect */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -inset-x-40 -top-40 h-[50rem] bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.15),transparent_70%)]" />
        <div className="absolute -inset-x-20 bottom-0 h-[50rem] bg-[radial-gradient(circle_at_bottom,rgba(14,165,233,0.12),transparent_70%)]" />
      </div>

      <main className="flex-1 relative overflow-hidden">
        {/* Back Button */}
        <div className="px-6 pt-6">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/home")}
            className="relative inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white/80 backdrop-blur-xl
               border border-white/10 bg-white/5 transition-all hover:text-white
               hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] overflow-hidden"
          >
            {/* Gradient overlay on hover */}
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-sky-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />

            {/* Icon */}
            <motion.span
              initial={{ x: 0 }}
              whileHover={{ x: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              ⬅
            </motion.span>

            <span className="relative">Back to Home</span>
          </motion.button>
        </div>


        {/* Heading */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 py-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Choose{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
              Category
            </span>
          </motion.h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Select the category that best matches your task. This helps us
            connect you with the right freelancers faster.
          </p>
        </section>

        {/* Categories */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
          {/* Row 1: Tech, Education, Healthcare */}
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center mb-8">
            {categories.slice(0, 3).map((c) => (
              <motion.div
                key={c.name}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => c.link !== "#" && navigate(c.link)}
                className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg p-6 flex flex-col items-center text-center hover:border-fuchsia-400/40 transition"
              >
                <motion.img
                  src={c.img}
                  alt={c.name}
                  className="w-20 h-20 mb-4"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <h3 className="text-xl font-semibold">{c.name}</h3>
                <p className="mt-2 text-sm text-white/70">{c.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Row 2: Event Mgmt + Architecture, centered under row 1 */}
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 justify-center max-w-3xl mx-auto">
            {categories.slice(3, 5).map((c) => (
              <motion.div
                key={c.name}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => c.link !== "#" && navigate(c.link)}
                className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg p-6 flex flex-col items-center text-center hover:border-fuchsia-400/40 transition"
              >
                <motion.img
                  src={c.img}
                  alt={c.name}
                  className="w-20 h-20 mb-4"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <h3 className="text-xl font-semibold">{c.name}</h3>
                <p className="mt-2 text-sm text-white/70">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
