import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { ArrowLeft, Laptop, GraduationCap, Heart, Calendar, Building2 } from "lucide-react";
import { useState } from "react";

interface Category {
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
  gradient: string;
  isActive: boolean;
}

const categories: Category[] = [
  {
    name: "Tech",
    desc: "From software to AI solutions, build the future with experts.",
    icon: Laptop,
    link: "/posttask-tech",
    gradient: "linear-gradient(135deg, hsl(326, 78%, 60%), hsl(266, 83%, 67%), hsl(198, 93%, 60%))",
    isActive: true,
  },
  {
    name: "Education",
    desc: "Tutors, e-learning content, and academic support on demand.",
    icon: GraduationCap,
    link: "/posttask-education",
    gradient: "linear-gradient(135deg, hsl(198, 93%, 60%), hsl(326, 78%, 60%), hsl(266, 83%, 67%))",
    isActive: true,
  },
  {
    name: "Healthcare",
    desc: "Medical writers, telehealth assistants, and research support.",
    icon: Heart,
    link: "#",
    gradient: "linear-gradient(135deg, hsl(266, 83%, 67%), hsl(198, 93%, 60%), hsl(326, 78%, 60%))",
    isActive: false,
  },
  {
    name: "Event Management",
    desc: "Organizers, planners, and designers to make your events shine.",
    icon: Calendar,
    link: "/posttask-event",
    gradient: "linear-gradient(135deg, hsl(326, 78%, 60%), hsl(198, 93%, 60%))",
    isActive: true,
  },
  {
    name: "Architecture",
    desc: "3D designs, CAD models, and urban planning tasks made simple.",
    icon: Building2,
    link: "/posttask-architecture",
    gradient: "linear-gradient(135deg, hsl(198, 93%, 60%), hsl(266, 83%, 67%))",
    isActive: true,
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

export default function ChooseCategory() {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleCategoryClick = (category: Category) => {
    if (category.isActive && category.link !== "#") {
      navigate(category.link);
    }
  };

  return (
    <div 
      className="min-h-screen text-foreground flex flex-col relative overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, #0a0a0f, #0c0c14, #000000)",
        color: "hsl(0, 0%, 98%)",
      }}
    >
      {/* Ambient Background Glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "-40rem",
            left: "-20rem",
            width: "60rem",
            height: "60rem",
            background: "radial-gradient(circle at top, hsla(326, 78%, 60%, 0.15), transparent 70%)",
          }}
        />
        <motion.div 
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          style={{
            position: "absolute",
            bottom: "-40rem",
            right: "-20rem",
            width: "60rem",
            height: "60rem",
            background: "radial-gradient(circle at bottom, hsla(198, 93%, 60%, 0.12), transparent 70%)",
          }}
        />
      </div>

      {/* Grain Texture Overlay for Depth */}
      <div 
        className="absolute inset-0 -z-10 mix-blend-soft-light" 
        style={{
          opacity: 0.015,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")"
        }}
      />

      <main className="flex-1 relative z-10">
        {/* Header with Back Button */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-6 pt-8 pb-4 max-w-7xl mx-auto w-full"
        >
          <button
            onClick={() => navigate("/home")}
            className="group relative inline-flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300"
            style={{
              background: "hsla(240, 8%, 6%, 0.4)",
              backdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid hsla(0, 0%, 100%, 0.12)",
              color: "hsla(0, 0%, 98%, 0.7)",
            }}
            aria-label="Go back to home"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "hsl(0, 0%, 98%)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(236, 72, 153, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "hsla(0, 0%, 98%, 0.7)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span 
              className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300"
              style={{
                background: "linear-gradient(to right, hsla(326, 78%, 60%, 0.1), hsla(266, 83%, 67%, 0.1), hsla(198, 93%, 60%, 0.1))",
              }}
            />
            
            <ArrowLeft className="w-4 h-4 relative transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="relative font-medium">Back to Home</span>
          </button>
        </motion.header>

        {/* Hero Section */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
              Choose Your{" "}
              <span 
                style={{
                  background: "linear-gradient(to right, hsl(326, 78%, 60%), hsl(198, 93%, 60%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Category
              </span>
            </h1>
            <p 
              className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
              style={{ color: "hsl(240, 5%, 64.9%)" }}
            >
              Select the category that best matches your task. We'll connect you with the right experts faster.
            </p>
          </motion.div>
        </section>

        {/* Categories Grid */}
        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6"
          >
            {categories.slice(0, 3).map((category, index) => (
              <CategoryCard
                key={category.name}
                category={category}
                index={index}
                isHovered={hoveredIndex === index}
                onHover={setHoveredIndex}
                onClick={handleCategoryClick}
              />
            ))}
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto"
          >
            {categories.slice(3, 5).map((category, index) => (
              <CategoryCard
                key={category.name}
                category={category}
                index={index + 3}
                isHovered={hoveredIndex === index + 3}
                onHover={setHoveredIndex}
                onClick={handleCategoryClick}
              />
            ))}
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative z-10 mt-auto"
        role="contentinfo"
        style={{
          borderTop: "1px solid hsla(240, 6%, 15%, 0.5)",
          background: "hsla(240, 8%, 6%, 0.3)",
          backdropFilter: "blur(48px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span 
                className="text-lg font-bold"
                style={{
                  background: "linear-gradient(to right, hsl(326, 78%, 60%), hsl(198, 93%, 60%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Cyphire
              </span>
            </div>

            <div className="text-sm" style={{ color: "hsl(240, 5%, 64.9%)" }}>
              © {new Date().getFullYear()} Cyphire. All rights reserved.
            </div>

            <nav className="flex items-center gap-6" aria-label="Footer navigation">
              <a 
                href="#" 
                className="text-sm transition-colors duration-200 rounded-sm"
                style={{ color: "hsl(240, 5%, 64.9%)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "hsl(0, 0%, 98%)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "hsl(240, 5%, 64.9%)"}
                aria-label="Privacy Policy"
              >
                Privacy
              </a>
              <a 
                href="#" 
                className="text-sm transition-colors duration-200 rounded-sm"
                style={{ color: "hsl(240, 5%, 64.9%)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "hsl(0, 0%, 98%)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "hsl(240, 5%, 64.9%)"}
                aria-label="Terms of Service"
              >
                Terms
              </a>
              <a 
                href="#" 
                className="text-sm transition-colors duration-200 rounded-sm"
                style={{ color: "hsl(240, 5%, 64.9%)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "hsl(0, 0%, 98%)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "hsl(240, 5%, 64.9%)"}
                aria-label="Contact Support"
              >
                Contact
              </a>
            </nav>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

interface CategoryCardProps {
  category: Category;
  index: number;
  isHovered: boolean;
  onHover: (index: number | null) => void;
  onClick: (category: Category) => void;
}

function CategoryCard({ category, index, isHovered, onHover, onClick }: CategoryCardProps) {
  const Icon = category.icon;
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <motion.article
      variants={itemVariants}
      whileHover={{ scale: 1.03, y: -8 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => {
        onHover(index);
        setIsHovering(true);
      }}
      onHoverEnd={() => {
        onHover(null);
        setIsHovering(false);
      }}
      onClick={() => onClick(category)}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${
        category.isActive ? '' : 'opacity-60 cursor-not-allowed'
      }`}
      style={{
        background: "hsla(240, 8%, 6%, 0.4)",
        backdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid hsla(0, 0%, 100%, 0.12)",
        boxShadow: isHovered && category.isActive ? "0 20px 60px -15px rgba(236, 72, 153, 0.4)" : "none",
      }}
      tabIndex={0}
      role="button"
      aria-label={`Select ${category.name} category`}
      aria-disabled={!category.isActive}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && category.isActive) {
          e.preventDefault();
          onClick(category);
        }
      }}
    >
      {/* Gradient Border Effect */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-500"
        style={{
          background: category.gradient,
          opacity: isHovering && category.isActive ? 0.2 : 0,
        }}
      />
      
      {/* Card Content */}
      <div className="relative p-8 flex flex-col items-center text-center h-full min-h-[280px]">
        {/* Icon Container */}
        <motion.div
          animate={isHovered && category.isActive ? { y: [0, -8, 0] } : { y: 0 }}
          transition={{ duration: 2, repeat: isHovered ? Infinity : 0, ease: "easeInOut" }}
          className="mb-6 p-5 rounded-2xl shadow-lg transition-shadow duration-500"
          style={{
            background: category.gradient,
            boxShadow: isHovering ? "0 20px 40px -10px rgba(0, 0, 0, 0.5)" : "0 10px 20px -5px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Icon className="w-10 h-10 text-white" />
        </motion.div>

        {/* Text Content */}
        <h3 
          className="text-2xl font-semibold mb-3 transition-all duration-300"
          style={{
            color: isHovering ? "transparent" : "hsl(0, 0%, 98%)",
            background: isHovering ? "linear-gradient(to right, hsl(326, 78%, 60%), hsl(198, 93%, 60%))" : "none",
            WebkitBackgroundClip: isHovering ? "text" : "unset",
            WebkitTextFillColor: isHovering ? "transparent" : "unset",
            backgroundClip: isHovering ? "text" : "unset",
          }}
        >
          {category.name}
        </h3>
        <p 
          className="text-sm leading-relaxed flex-1"
          style={{ color: "hsl(240, 5%, 64.9%)" }}
        >
          {category.desc}
        </p>

        {/* Status Badge */}
        {!category.isActive && (
          <div 
            className="mt-4 px-3 py-1 rounded-full text-xs"
            style={{
              background: "hsla(240, 5%, 15%, 0.5)",
              color: "hsl(240, 5%, 64.9%)",
            }}
          >
            Coming Soon
          </div>
        )}
      </div>

      {/* Shine Effect on Hover */}
      {category.isActive && (
        <div 
          className="absolute inset-0 rounded-2xl transition-transform duration-1000 ease-in-out"
          style={{
            background: "linear-gradient(to right, transparent, hsla(255, 255, 255, 0.05), transparent)",
            transform: isHovering ? "translateX(100%)" : "translateX(-100%)",
          }}
        />
      )}
    </motion.article>
  );
}
