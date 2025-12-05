// Express is a framework for building APIs and web apps
// See also: https://expressjs.com/
import express from "express";
// Initialize Express app
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// import path module to help with file paths
import path from "path";

// Serve static files from the 'public' folder
app.use(express.static("public"));

// On Vercel, point the root url (/) to index.html explicitly
if (process.env.VERCEL) {
  app.get("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "index.html"));
  });
}

// Import the OpenID Connect Library (maintained by Auth0)
// See also: https://github.com/auth0/express-openid-connect
import auth0 from "express-openid-connect";
const { auth, requiresAuth } = auth0;

// Auth0 Configuration
// Make sure add the following environment variables are set:
// SECRET, BASE_URL, CLIENT_ID, ISSUER_BASE_URL
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
};

// Show an error if any environment variables are missing
if (Object.keys(config).some((key) => config[key] == null)) {
  console.error("Error: Auth0 environment variable(s) are missing.");
  process.exit(1);
}

// Enable auth in our Express app.
// This will automatically setup /login, /logout, /callback endpoints
app.use(auth(config));

// NOTE: OpenIdConnect attaches user data to all incoming requests
// We can find this data at "req.oidc"

// Publish the user's data and authentication state to the frontend
// PROTECTED - requires authentication
app.get("/api/user", requiresAuth(), (req, res) => {
  // User is authenticated, send their data
  res.send({
    ...req.oidc.user,
    isAuthenticated: true,
  });
});

// Import API routes
import apiRoutes from "./routes/api.js";
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// API info endpoint
app.get("/api/info", (req, res) => {
  res.json({
    message: "Vinyl Collection API",
    version: "1.0.0",
    authentication: req.oidc?.isAuthenticated()
      ? "Authenticated"
      : "Not authenticated",
    endpoints: {
      public: {
        vinyls: "/api/vinyls",
        vinyl: "/api/vinyls/:id",
      },
      protected: {
        user: "/api/user (requires auth)",
        profile: "/api/me (requires auth)",
        collection: "/api/me/collection (requires auth)",
        wishlist: "/api/me/wishlist (requires auth)",
        members: "/api/me/members (requires auth)",
      },
      auth: {
        login: "/login",
        logout: "/logout",
      },
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
