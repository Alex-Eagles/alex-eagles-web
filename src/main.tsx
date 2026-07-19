import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import App from "@/App";

// The one CSS entry point: Tailwind + design tokens + base styles.
import "@/styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* BrowserRouter → client-side routing; ThemeProvider → dark/light state.
        The future flags opt into React Router v7 behavior early and silence
        its upgrade warnings. */}
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
