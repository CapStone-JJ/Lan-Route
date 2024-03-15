const express = require("express");
const likeRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticateUser } = require("../auth/middleware");

// Get all likes for a post
likeRouter.get("/:postId", async (req, res, next) => {
  try {
    const { postId } = req.params;
    const likes = await prisma.like.findMany({
      where: {
        postId: parseInt(postId),
      },
    });
    res.json(likes);
  } catch (error) {
    next(error);
  }
});

// Create a new like
likeRouter.post("/", authenticateUser, async (req, res, next) => {
  try {
    const { userId, postId } = req.body;
    const newLike = await prisma.like.create({
      data: {
        userId: userId,
        postId: postId,
      },
    });

    // Find the post to get the authorId
    const post = await prisma.post.findUnique({
      where: {
          id: postId,
      },
  });

  // Create a notification for the post's author
  await prisma.notification.create({
      data: {
          type: 'LIKE',
          recipientId: post.authorId,
          triggerById: userId,
          postId: postId,
      },
  });

  res.status(201).send({ message: "Like added successfully, notification sent." });
  } catch (error) {
    next(error);
  }
});

// Delete a like
likeRouter.delete("/", authenticateUser, async (req, res, next) => {
  const { userId, postId } = req.query;
  try {
    const deletedLike = await prisma.like.deleteMany({
      where: {
        AND: [{ userId: parseInt(userId) }, { postId: parseInt(postId) }],
      },
    });

    if (deletedLike.count === 0) {
      return res
        .status(404)
        .json({ message: "Like not found or already deleted" });
    }

    res.json({ message: "Like deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = likeRouter;
