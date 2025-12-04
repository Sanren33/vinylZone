// Express is a framework for building APIs and web apps
// See also: https://expressjs.com/
import cors from "cors";
import express from "express";
// Initialize Express app
const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Enable express to parse JSON data
app.use(express.json());

// Our API is defined in a separate module to keep things tidy.
// Let's import our API endpoints and activate them.
import apiRoutes from "./routes/api.js";
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Vinyl Collection API",
    version: "1.0.0",
    endpoints: {
      vinyls: "/api/vinyls",
      auth: "Protected routes require Bearer token",
      docs: "See README for full API documentation",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const port = 3001;
app.listen(port, () => {
  console.log(`Express is live at http://localhost:${port}`);
});
