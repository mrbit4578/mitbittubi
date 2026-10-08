import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@supabase/")) return "cloud";
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler/")) return "react";
          if (id.includes("node_modules/fflate/")) return "excel";
        },
      },
    },
  },
});
