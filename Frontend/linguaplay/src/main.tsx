import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// Set API base URL for the frontend to connect to the backend
// Temporarily hardcoded to bypass browser preview caching issues
setBaseUrl("http://localhost:5050");

createRoot(document.getElementById("root")!).render(<App />);
