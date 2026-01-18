import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/theme-provider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <div onContextMenu={(e) => e.preventDefault()} className="select-none">
        <App />
        <Toaster />
      </div>
    </ThemeProvider>
  </React.StrictMode>,
);
