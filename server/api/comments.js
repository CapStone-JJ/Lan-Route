const express = require("express");
const commentRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticateUser } = require("../auth/middleware");

// Get all comments for a post
commentRouter.get("/post/:postId", async (req, res, next) => {
  const { postId } = req.params;
  console.log("Post ID:", postId);
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(postId) },
      include: { user: true }, // Include user information
    });
    res.json(comments);
  } catch (error) {
    next(error);
  }
});

// Create a new comment
commentRouter.post("/", authenticateUser, async (req, res, next) => {
  const { text, postId } = req.body;
  const parsedPostId = parseInt(postId, 10);

  // Ensure that the user is authenticated
  if (!req.user) {
    return res.status(403).send("Unauthorized");
  }

  // Extract userId from the verified JWT payload
  const userId = req.user.id; // Adjust based on how your token payload is structured

  try {
    // Create a new comment with the author set to the retrieved user
    const newComment = await prisma.comment.create({
      data: {
        text,
        postId: parsedPostId,
        userId: userId,
      },
    });

    // Find the post to get the authorId
    const post = await prisma.post.findUnique({
      where: {
        // Convert id from string to integer
        id: parsedPostId,
      },
    });

    if (!post) {
      return res.status(404).send("Post not found.");
    }

    // Create a notification for the post's author
    await prisma.notification.create({
      data: {
        type: "COMMENT",
        recipientId: post.authorId,
        triggerById: userId,
        postId: parsedPostId,
        commentId: newComment.id,
      },
    });

    res.status(201)
      .send({ message: "Comment added successfully, notification sent." });
  } catch (error) {
    console.error("Error creating comment:", error);
    next(error);
  }
});

// Delete a comment
commentRouter.delete("/:id", authenticateUser, async (req, res, next) => {
  const commentId = parseInt(req.params.id);
  // Corrected: Extract userId from req.user
  const userId = req.user.id;

  try {
    // Check if the comment exists and if the logged-in user is the author of the comment
    const comment = await prisma.comment.findUnique({
      where: {
        id: commentId,
      },
    });

    // Check if comment exists and if the user is authorized to delete it
    if (!comment || comment.userId !== userId) {
      return res.status(404).json({
        message: "Comment not found or you are not authorized to delete it.",
      });
    }

    // Delete the comment
    await prisma.comment.delete({ where: { id: commentId } });

    res.json({ message: "Comment deleted successfully." });
  } catch (error) {
    console.error("Error deleting comment:", error);
    next(error);
  }
});

module.exports = commentRouter;
