import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Middleware to get or create a user in the database based on Auth0 user info
 * This syncs Auth0 users with Prisma database
 *
 * What it does:
 * 1. Gets Auth0 user info from req.oidc.user (provided by express-openid-connect)
 * 2. Checks if user exists in database using auth0Id
 * 3. Creates user in database if they don't exist
 * 4. Attaches database user object to req.user for use in route handlers
 */
export const getOrCreateUser = async (req, res, next) => {
  try {
    // Get Auth0 user info from OIDC (provided by express-openid-connect)
    const auth0User = req.oidc.user;

    // Safety check - this should never happen if requiresAuth() is used first
    if (!auth0User || !auth0User.sub) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No user information found",
      });
    }

    // Check if user exists in database using Auth0 ID (sub claim)
    let user = await prisma.user.findUnique({
      where: { auth0Id: auth0User.sub },
    });

    // If user doesn't exist, create them in the database
    if (!user) {
      user = await prisma.user.create({
        data: {
          auth0Id: auth0User.sub,
          email: auth0User.email,
          name: auth0User.name || auth0User.nickname || "User",
        },
      });
      console.log(`✓ Created new user in database: ${user.id} (${user.email})`);
    }

    // Attach database user to request object
    // Now in routes, able to access req.user.id, req.user.email, etc.
    req.user = user;
    next();
  } catch (error) {
    console.error("getOrCreateUser error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
