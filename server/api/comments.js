const express = require("express");
const commentRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { authenticateUser } = require("../auth/middleware");

// Get all comments for a post
commentRouter.get("/post/:postId", async (req, res, next) => {
  const { postId } = req.params;
  console.log("Post ID:", postId);
  try {
    const comments = await prisma.comment.findMany({
      where: {
        postId: parseInt(postId),
      },
    });
    res.json(comments);
  } catch (error) {
    next(error);
  }
});

// Create a new comnment
commentRouter.post("/", authenticateUser, async (req, res, next) => {
  const { text, postId } = req.body;

  // Ensure that the user is authenticated
  if (!req.user) {
    return res.status(403).send("Unauthorized");
  }

  // Extract userId from the verified JWT payload
  const userId = req.user.id; // Adjust based on how your token payload is structured

  try {
    // Create a new comment with the author set to the retrieved user
    const comments = await prisma.comment.create({
      data: {
        text,
        postId: parseInt(postId),
        userId: userId,
      },
    });

    res.status(201).send(comments);
  } catch (error) {
    console.error("Error creating comment:", error);
    next(error);
  }
});

// Delete a comment
commentRouter.delete("/:id", authenticateUser, async (req, res, next) => {
  const commentId = parseInt(req.params.id);

  try {
    // Check if the comment exists and if the logged-in user is the author of the comment
    const comments = await prisma.comment.findFirst({
      where: {
        id: commentId,
        userId: userId,
      },
    });

    if (!comments) {
      return res
        .status(404)
        .send("Comment not found or you are not authorized to delete it.");
    }

    // Delete the comment
    await prisma.comment.delete({ where: { id: commentId } });

    res.send("Comment deleted successfully.");
  } catch (error) {
    console.error("Error deleting comment:", error);
    next(error);
  }
});

module.exports = commentRouter;
