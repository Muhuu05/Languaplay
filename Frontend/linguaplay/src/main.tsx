import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

const apiUrl = import.meta.env.VITE_API_URL?.trim() || null;
// Never use a localhost URL in production — use relative paths instead
const safeUrl =
  apiUrl &&
  typeof window !== "undefined" &&
  !window.location.hostname.match(/^(localhost|127\.0\.0\.1)$/) &&
  new URL(apiUrl, window.location.href).hostname.match(
    /^(localhost|127\.0\.0\.1)$/,
  )
    ? null
    : apiUrl;
setBaseUrl(safeUrl);

createRoot(document.getElementById("root")!).render(<App />);
