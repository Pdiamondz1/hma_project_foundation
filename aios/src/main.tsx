import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent unhandled promise rejections from killing the tab.
window.addEventListener("unhandledrejection", (event) => {
  console.error("[Global] Unhandled promise rejection:", event.reason);
  event.preventDefault();
});

const root = document.getElementById("root")!;
createRoot(root).render(<App />);
