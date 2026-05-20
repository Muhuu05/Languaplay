import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const configuredOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string): boolean {
  if (
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1")
  ) {
    return true;
  }

  if (configuredOrigins.includes(origin)) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    return (
      protocol === "https:" &&
      (hostname === "linguaplay-ten.vercel.app" ||
        hostname.endsWith(".vercel.app"))
    );
  } catch {
    return false;
  }
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      callback(null, isAllowedOrigin(origin));
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply clerkMiddleware globally to all /api routes
app.use(
  "/api",
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  }),
);

app.use("/api", router);

export default app;
