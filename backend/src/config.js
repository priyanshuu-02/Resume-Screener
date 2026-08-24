import dotenv from "dotenv";
dotenv.config();

// Collect all provided Gemini API keys for rotation & fallback
const keys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY,
]
  .filter(Boolean)
  .map((k) => k.trim())
  .filter((v, i, a) => a.indexOf(v) === i); // remove duplicates

const config = {
  geminiApiKeys: keys,
  geminiApiKey: keys[0] || "",
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/lucent_resumer_screener",
  port: parseInt(process.env.PORT) || 5000,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(","),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB) || 10,
  unstractApiKey: process.env.UNSTRACT_API_KEY,
  jwtSecret: process.env.JWT_SECRET || "change_me_in_production",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
};

// Validate required fields on startup
if (config.geminiApiKeys.length === 0) {
  console.error("❌ GEMINI_API_KEY is missing. Add GEMINI_API_KEY to your .env file.");
  process.exit(1);
}
if (!config.jwtSecret || config.jwtSecret === "change_me_in_production") {
  console.warn("⚠️  JWT_SECRET is using the default value. Set a strong secret in production.");
}

export default config;
