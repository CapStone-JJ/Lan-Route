const express = require("express");
const votesRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { authenticateUser } = require("../auth/middleware");

// Route for getting all votes for comment
votesRouter.get("/", async (req, res) => {
  try {
    const votes = await prisma.vote.findMany();
    res.json(votes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch votes" });
  }
});

// Route for creating a new vote
votesRouter.post("/", authenticateUser, async (req, res) => {
  try {
    const { commentId, type } = req.body;
    const userId = req.user.id;
    // Check for an existing vote by this user on this comment
    const existingVote = await prisma.vote.findFirst({
      where: { commentId, userId },
    });

    // If an existing vote is found, prevent creating a duplicate
    if (existingVote) {
      return res
        .status(400)
        .json({ message: "User has already voted on this comment." });
    }

    // If no existing vote, proceed to create a new vote
    const vote = await prisma.vote.create({
      data: {
        commentId,
        userId,
        type,
      },
    });
    res.json(vote);
  } catch (error) {
    res.status(500).json({ error: "Failed to create vote" });
  }
});

// Route for deleting a vote
votesRouter.delete("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.vote.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: "Vote deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete vote" });
  }
});

module.exports = votesRouter;
