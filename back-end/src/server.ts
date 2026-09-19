// src/server.ts  – local development entry point
import { connectDB } from "./config/db";
import app from "./app";

const PORT = process.env.PORT || "5000";

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Back-end server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();
