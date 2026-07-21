import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { "/api": "http://localhost:3000" } },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020",
    cssMinify: "lightningcss",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("hls.js")) return "hls";
            if (id.includes("react-router-dom") || id.includes("react-dom") || id.includes("react/")) return "vendor";
          }
        },
      },
    },
  },
});
