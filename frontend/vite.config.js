import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: "./postcss.config.js",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // 👈 @ alias
    },
  },
  build: {
    chunkSizeWarningLimit: 600, // increase limit to reduce warnings
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split all node_modules into a vendor chunk
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
