// src/components/Footer.jsx
import React from "react";
import { Star } from "lucide-react"; // or use react-icons if you prefer
import { motion } from "framer-motion";

// Gradient text helper (optional, for brand name styling)
const GradientText = ({ children }) => (
  <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
    {children}
  </span>
);

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="mx-auto mt-10 max-w-7xl px-6 pb-12 pt-10 text-sm text-white/60"
    >
      <div className="grid gap-8 md:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="text-lg font-semibold text-white">
            <GradientText>Cyphire</GradientText>
          </div>
          <p className="mt-2 max-w-xs text-white/60">
            A secure, outcome-driven marketplace for modern teams and expert
            executors.
          </p>
        </div>

        {/* Product */}
        <div>
          <div className="mb-2 font-medium text-white">Product</div>
          <ul className="space-y-1">
            <li className="hover:text-purple-400 transition-colors">How it works</li>
            <li className="hover:text-purple-400 transition-colors">Pricing</li>
            <li className="hover:text-purple-400 transition-colors">Escrow</li>
            <li className="hover:text-purple-400 transition-colors">Templates</li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <div className="mb-2 font-medium text-white">Company</div>
          <ul className="space-y-1">
            <li className="hover:text-purple-400 transition-colors">About</li>
            <li className="hover:text-purple-400 transition-colors">Careers</li>
            <li className="hover:text-purple-400 transition-colors">Press Kit</li>
            <li className="hover:text-purple-400 transition-colors">Contact</li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <div className="mb-2 font-medium text-white">Legal</div>
          <ul className="space-y-1">
            <li className="hover:text-purple-400 transition-colors">Terms</li>
            <li className="hover:text-purple-400 transition-colors">Privacy</li>
            <li className="hover:text-purple-400 transition-colors">Security</li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-t border-white/10 pt-6">
        <div>© {new Date().getFullYear()} Cyphire. All rights reserved.</div>
        <div className="inline-flex items-center gap-2 text-white/50">
          <Star className="h-4 w-4" /> Built with care
        </div>
      </div>
    </motion.footer>
  );
}
