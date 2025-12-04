import express from "express";
const router = express.Router();

const model = "vinyl";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { checkJwt, getOrCreateUser } from "../middleware/auth.js";

// ==================== PUBLIC VINYL ROUTES (No Auth Required) ====================

// Get all vinyls
router.get("/vinyls", async (req, res) => {
  try {
    const { genre, search, sortBy = "createdAt", order = "desc" } = req.query;

    const where = {};

    if (genre) where.genre = genre;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { artist: { contains: search, mode: "insensitive" } },
      ];
    }

    const result = await prisma[model].findMany({
      where,
      include: {
        tracks: { orderBy: { side: "asc" } },
      },
      orderBy: { [sortBy]: order },
    });

    res.send(result);
  } catch (err) {
    console.error("GET /vinyls error:", err);
    res
      .status(500)
      .send({ error: "Failed to fetch vinyls", details: err.message || err });
  }
});

// Get single vinyl by ID
router.get("/vinyls/:id", async (req, res) => {
  try {
    const result = await prisma[model].findUnique({
      where: { id: req.params.id },
      include: { tracks: { orderBy: { side: "asc" } } },
    });

    if (!result) return res.status(404).send({ error: "Vinyl not found" });

    res.send(result);
  } catch (err) {
    console.error("GET /vinyls/:id error:", err);
    res
      .status(500)
      .send({ error: "Failed to fetch vinyl", details: err.message || err });
  }
});

// ==================== PROTECTED ROUTES (Auth Required) ====================

// Apply auth middleware to all routes below
router.use(checkJwt, getOrCreateUser);

// ==================== CURRENT USER ROUTES ====================

// Get current user profile
router.get("/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        collections: {
          include: { vinyl: { include: { tracks: true } } },
          orderBy: { purchasedAt: "desc" },
        },
        wishlists: {
          include: { vinyl: { include: { tracks: true } } },
          orderBy: { addedAt: "desc" },
        },
        members: true,
      },
    });

    res.send(user);
  } catch (err) {
    console.error("GET /me error:", err);
    res
      .status(500)
      .send({ error: "Failed to fetch user", details: err.message || err });
  }
});

// Update current user profile
router.put("/me", async (req, res) => {
  try {
    const { name, email } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email },
    });

    res.send(updated);
  } catch (err) {
    console.error("PUT /me error:", err);
    res
      .status(500)
      .send({ error: "Failed to update user", details: err.message || err });
  }
});

// ==================== MY COLLECTION ROUTES ====================

// Get current user's collection
router.get("/me/collection", async (req, res) => {
  try {
    const {
      sortBy = "purchasedAt",
      order = "desc",
      condition,
      genre,
    } = req.query;

    const where = { userId: req.user.id };

    if (condition) where.condition = condition;
    if (genre) where.vinyl = { genre };

    const result = await prisma.collection.findMany({
      where,
      include: {
        vinyl: {
          include: { tracks: { orderBy: { side: "asc" } } },
        },
      },
      orderBy: { [sortBy]: order },
    });

    res.send(result);
  } catch (err) {
    console.error("GET /me/collection error:", err);
    res.status(500).send({
      error: "Failed to fetch collection",
      details: err.message || err,
    });
  }
});

// Add vinyl to current user's collection
router.post("/me/collection", async (req, res) => {
  try {
    const { vinylId, price, condition, note, purchasedAt } = req.body;

    // Check if vinyl exists
    const vinylExists = await prisma[model].findUnique({
      where: { id: vinylId },
    });
    if (!vinylExists) return res.status(404).send({ error: "Vinyl not found" });

    const created = await prisma.collection.create({
      data: {
        userId: req.user.id,
        vinylId,
        price,
        condition,
        note,
        purchasedAt: purchasedAt ? new Date(purchasedAt) : new Date(),
      },
      include: { vinyl: true },
    });

    res.status(201).send(created);
  } catch (err) {
    console.error("POST /me/collection error:", err);
    res.status(500).send({
      error: "Failed to add to collection",
      details: err.message || err,
    });
  }
});

// Update collection item (user can only update their own)
router.put("/collection/:id", async (req, res) => {
  try {
    // Verify the collection item belongs to the current user
    const item = await prisma.collection.findUnique({
      where: { id: req.params.id },
    });

    if (!item)
      return res.status(404).send({ error: "Collection item not found" });
    if (item.userId !== req.user.id)
      return res.status(403).send({ error: "Forbidden" });

    const { purchasedAt, ...otherData } = req.body;

    const updated = await prisma.collection.update({
      where: { id: req.params.id },
      data: {
        ...otherData,
        purchasedAt: purchasedAt ? new Date(purchasedAt) : undefined,
      },
      include: { vinyl: true },
    });

    res.send(updated);
  } catch (err) {
    console.error("PUT /collection/:id error:", err);
    res.status(500).send({
      error: "Failed to update collection item",
      details: err.message || err,
    });
  }
});

// Remove vinyl from current user's collection
router.delete("/collection/:id", async (req, res) => {
  try {
    // Verify the collection item belongs to the current user
    const item = await prisma.collection.findUnique({
      where: { id: req.params.id },
    });

    if (!item)
      return res.status(404).send({ error: "Collection item not found" });
    if (item.userId !== req.user.id)
      return res.status(403).send({ error: "Forbidden" });

    await prisma.collection.delete({
      where: { id: req.params.id },
    });

    res.send({ message: "Removed from collection successfully" });
  } catch (err) {
    console.error("DELETE /collection/:id error:", err);
    res.status(500).send({
      error: "Failed to remove from collection",
      details: err.message || err,
    });
  }
});

// ==================== MY WISHLIST ROUTES ====================

// Get current user's wishlist
router.get("/me/wishlist", async (req, res) => {
  try {
    const { sortBy = "addedAt", order = "desc", genre } = req.query;

    const where = { userId: req.user.id };

    if (genre) where.vinyl = { genre };

    const result = await prisma.wishlist.findMany({
      where,
      include: {
        vinyl: {
          include: { tracks: { orderBy: { side: "asc" } } },
        },
      },
      orderBy: { [sortBy]: order },
    });

    res.send(result);
  } catch (err) {
    console.error("GET /me/wishlist error:", err);
    res
      .status(500)
      .send({ error: "Failed to fetch wishlist", details: err.message || err });
  }
});

// Add vinyl to current user's wishlist
router.post("/me/wishlist", async (req, res) => {
  try {
    const { vinylId, note } = req.body;

    // Check if vinyl exists
    const vinylExists = await prisma[model].findUnique({
      where: { id: vinylId },
    });
    if (!vinylExists) return res.status(404).send({ error: "Vinyl not found" });

    const created = await prisma.wishlist.create({
      data: {
        userId: req.user.id,
        vinylId,
        note,
      },
      include: { vinyl: true },
    });

    res.status(201).send(created);
  } catch (err) {
    console.error("POST /me/wishlist error:", err);
    res.status(500).send({
      error: "Failed to add to wishlist",
      details: err.message || err,
    });
  }
});

// Update wishlist item (user can only update their own)
router.put("/wishlist/:id", async (req, res) => {
  try {
    // Verify the wishlist item belongs to the current user
    const item = await prisma.wishlist.findUnique({
      where: { id: req.params.id },
    });

    if (!item)
      return res.status(404).send({ error: "Wishlist item not found" });
    if (item.userId !== req.user.id)
      return res.status(403).send({ error: "Forbidden" });

    const updated = await prisma.wishlist.update({
      where: { id: req.params.id },
      data: req.body,
      include: { vinyl: true },
    });

    res.send(updated);
  } catch (err) {
    console.error("PUT /wishlist/:id error:", err);
    res.status(500).send({
      error: "Failed to update wishlist item",
      details: err.message || err,
    });
  }
});

// Remove vinyl from current user's wishlist
router.delete("/wishlist/:id", async (req, res) => {
  try {
    // Verify the wishlist item belongs to the current user
    const item = await prisma.wishlist.findUnique({
      where: { id: req.params.id },
    });

    if (!item)
      return res.status(404).send({ error: "Wishlist item not found" });
    if (item.userId !== req.user.id)
      return res.status(403).send({ error: "Forbidden" });

    await prisma.wishlist.delete({
      where: { id: req.params.id },
    });

    res.send({ message: "Removed from wishlist successfully" });
  } catch (err) {
    console.error("DELETE /wishlist/:id error:", err);
    res.status(500).send({
      error: "Failed to remove from wishlist",
      details: err.message || err,
    });
  }
});

// ==================== MY MEMBERS (FRIENDS) ROUTES ====================

// Get current user's friends list
router.get("/me/members", async (req, res) => {
  try {
    const result = await prisma.member.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Get friend details
    const friendIds = result.map((m) => m.friendId);
    const friends = await prisma.user.findMany({
      where: { id: { in: friendIds } },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Combine member data with friend details
    const membersWithDetails = result.map((member) => ({
      ...member,
      friend: friends.find((f) => f.id === member.friendId),
    }));

    res.send(membersWithDetails);
  } catch (err) {
    console.error("GET /me/members error:", err);
    res
      .status(500)
      .send({ error: "Failed to fetch members", details: err.message || err });
  }
});

// Add a friend to current user's members
router.post("/me/members", async (req, res) => {
  try {
    const { friendId } = req.body;

    // Check if friend exists
    const friendExists = await prisma.user.findUnique({
      where: { id: friendId },
    });
    if (!friendExists)
      return res.status(404).send({ error: "Friend not found" });

    // Can't add yourself
    if (req.user.id === friendId) {
      return res.status(400).send({ error: "Cannot add yourself as a friend" });
    }

    const created = await prisma.member.create({
      data: {
        userId: req.user.id,
        friendId,
      },
    });

    res.status(201).send(created);
  } catch (err) {
    console.error("POST /me/members error:", err);
    res
      .status(500)
      .send({ error: "Failed to add member", details: err.message || err });
  }
});

// Remove a friend from current user's members
router.delete("/members/:id", async (req, res) => {
  try {
    // Verify the member relationship belongs to the current user
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
    });

    if (!member)
      return res.status(404).send({ error: "Member relationship not found" });
    if (member.userId !== req.user.id)
      return res.status(403).send({ error: "Forbidden" });

    await prisma.member.delete({
      where: { id: req.params.id },
    });

    res.send({ message: "Member removed successfully" });
  } catch (err) {
    console.error("DELETE /members/:id error:", err);
    res
      .status(500)
      .send({ error: "Failed to remove member", details: err.message || err });
  }
});

// ==================== FRIEND'S COLLECTION & WISHLIST (View Only) ====================

// Get a friend's collection
router.get("/members/:friendId/collection", async (req, res) => {
  try {
    // Check if the current user is following this friend
    const isMember = await prisma.member.findFirst({
      where: {
        userId: req.user.id,
        friendId: req.params.friendId,
      },
    });

    if (!isMember) {
      return res.status(403).send({ error: "You are not following this user" });
    }

    const result = await prisma.collection.findMany({
      where: { userId: req.params.friendId },
      include: {
        vinyl: {
          include: { tracks: { orderBy: { side: "asc" } } },
        },
      },
      orderBy: { purchasedAt: "desc" },
    });

    res.send(result);
  } catch (err) {
    console.error("GET /members/:friendId/collection error:", err);
    res.status(500).send({
      error: "Failed to fetch friend's collection",
      details: err.message || err,
    });
  }
});

// Get a friend's wishlist
router.get("/members/:friendId/wishlist", async (req, res) => {
  try {
    // Check if the current user is following this friend
    const isMember = await prisma.member.findFirst({
      where: {
        userId: req.user.id,
        friendId: req.params.friendId,
      },
    });

    if (!isMember) {
      return res.status(403).send({ error: "You are not following this user" });
    }

    const result = await prisma.wishlist.findMany({
      where: { userId: req.params.friendId },
      include: {
        vinyl: {
          include: { tracks: { orderBy: { side: "asc" } } },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    res.send(result);
  } catch (err) {
    console.error("GET /members/:friendId/wishlist error:", err);
    res.status(500).send({
      error: "Failed to fetch friend's wishlist",
      details: err.message || err,
    });
  }
});

// ==================== ADMIN VINYL ROUTES (Create, Update, Delete) ====================

// Create new vinyl
router.post("/vinyls", async (req, res) => {
  try {
    const created = await prisma[model].create({
      data: {
        ...req.body,
        tracks: req.body.tracks ? { create: req.body.tracks } : undefined,
      },
    });
    res.status(201).send(created);
  } catch (err) {
    console.error("POST /vinyls error:", err);
    res
      .status(500)
      .send({ error: "Failed to create vinyl", details: err.message || err });
  }
});

// Update vinyl
router.put("/vinyls/:id", async (req, res) => {
  try {
    // Ensure vinyl exists
    const old = await prisma[model].findUnique({
      where: { id: req.params.id },
    });
    if (!old) return res.status(404).send({ error: "Vinyl not found" });

    const { tracks, ...vinylData } = req.body;

    if (tracks) {
      await prisma.track.deleteMany({
        where: { vinylId: req.params.id },
      });
    }

    const updated = await prisma[model].update({
      where: { id: req.params.id },
      data: {
        ...vinylData,
        tracks: tracks ? { create: tracks } : undefined,
      },
      include: { tracks: { orderBy: { side: "asc" } } },
    });

    res.send(updated);
  } catch (err) {
    console.error("PUT /vinyls/:id error:", err);
    res
      .status(500)
      .send({ error: "Failed to update vinyl", details: err.message || err });
  }
});

// Delete vinyl
router.delete("/vinyls/:id", async (req, res) => {
  try {
    // Ensure vinyl exists
    const exists = await prisma[model].findUnique({
      where: { id: req.params.id },
    });
    if (!exists) return res.status(404).send({ error: "Vinyl not found" });

    await prisma[model].delete({
      where: { id: req.params.id },
    });

    res.send({ message: "Vinyl deleted successfully" });
  } catch (err) {
    console.error("DELETE /vinyls/:id error:", err);
    res
      .status(500)
      .send({ error: "Failed to delete vinyl", details: err.message || err });
  }
});

// Add track to vinyl
router.post("/vinyls/:id/tracks", async (req, res) => {
  try {
    const exists = await prisma[model].findUnique({
      where: { id: req.params.id },
    });
    if (!exists) return res.status(404).send({ error: "Vinyl not found" });

    const track = await prisma.track.create({
      data: {
        ...req.body,
        vinylId: req.params.id,
      },
    });

    res.status(201).send(track);
  } catch (err) {
    console.error("POST /vinyls/:id/tracks error:", err);
    res
      .status(500)
      .send({ error: "Failed to add track", details: err.message || err });
  }
});

export default router;
