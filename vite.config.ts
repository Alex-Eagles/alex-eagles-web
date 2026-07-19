import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  // `@tailwindcss/vite` is Tailwind v4's first-class Vite integration —
  // no PostCSS config or tailwind.config.js needed. Theme lives in CSS (see src/styles/).
  plugins: [react(), tailwindcss()],
  server: {
    // Bind on all interfaces (IPv4 127.0.0.1 + IPv6 ::1 + LAN) so every browser
    // reaches the same server regardless of how it resolves "localhost".
    host: true,
    // Fail loudly if the port is taken instead of silently jumping ports
    // (which is how orphaned servers piled up during debugging).
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      // Lets us write `import Button from "@/components/ui/Button"` anywhere.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
