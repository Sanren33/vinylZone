import { auth } from "express-oauth2-jwt-bearer";

// Auth0 JWT validation middleware
export const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: "RS256",
});

// Optional: Middleware to get or create user in database
export const getOrCreateUser = async (req, res, next) => {
  try {
    const auth0Id = req.auth.payload.sub; // e.g., "auth0|123456"
    const email = req.auth.payload.email;
    const name = req.auth.payload.name;

    // Find or create user in the database
    let user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          auth0Id,
          email,
          name,
        },
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in getOrCreateUser:", error);
    res.status(500).send({ error: "Failed to authenticate user" });
  }
};
