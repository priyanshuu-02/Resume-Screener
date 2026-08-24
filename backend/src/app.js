import express from "express";
import cors from "cors";
import config from "./config.js";
import resumeRoutes from "./api/routes/resumeRoutes.js";
import jobRoutes from "./api/routes/jobRoutes.js";
import screeningRoutes from "./api/routes/screeningRoutes.js";
import analysisRoutes from "./api/routes/analysisRoutes.js";
import authRoutes from "./api/routes/authRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

// CORS — explicit config to handle preflight OPTIONS correctly
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, health checks)
    if (!origin) return callback(null, true);
    if (config.allowedOrigins.some((o) => o === origin || o === "*")) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin '${origin}' not allowed.`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Respond to all preflight OPTIONS requests immediately
app.options("*", cors());

// Body parsing — 10mb limit for large job descriptions
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/resumes", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/screen", screeningRoutes);
app.use("/api/analyze", analysisRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/auth", authRoutes);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// 404 for any unmatched route (must come after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
