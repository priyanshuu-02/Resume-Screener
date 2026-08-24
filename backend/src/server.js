import app from "./app.js";
import { connectDB } from "./db.js";
import config from "./config.js";

async function start() {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`🚀  Server running on http://localhost:${config.port}`);
    console.log(`📋  API docs:  http://localhost:${config.port}/health`);
  });
}

start();
