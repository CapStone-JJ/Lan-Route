const express = require("express");
const postsRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { authenticateUser } = require("../auth/middleware");

// Get all posts
postsRouter.get("/", async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { username: true } },
        Post_tag: { include: { tag: true } }, // Include the name of the tags
      },
    });
    res.send(posts);
  } catch (error) {
    next(error);
  }
});

// Get posts by id
postsRouter.get("/:id", async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        Post_tag: { include: { tag: true } },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    res.send(post);
  } catch (error) {
    next(error);
  }
});

postsRouter.get("/user/:userId", async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId);
        const posts = await prisma.post.findMany({
            where: {
                authorId: userId
            },
            include: {
                author: { select: { username: true } },
                Post_tag: { include: { tag: true } } // Include the name of the tags
            }
        });
        res.send(posts);
    } catch (error) {
        next(error);
    }
});

postsRouter.post("/", authenticateUser, async (req, res, next) => {
    const { content, published, tags } = req.body;
    try {
      const token = req.headers.authorization.split(" ")[1]; // Extract the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
      const userId = decoded.id; // Extract the userId from the decoded token
  
      // Retrieve the user data based on the user ID obtained from the token
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
  
      if (!user) {
        // Handle the case where the user is not found
        return res.status(404).send("User not found.");
      }
  
      // Create the post along with its associated tags
      const createdPost = await prisma.post.create({
        data: {
          content,
          published,
          author: { connect: { id: userId } },
          // Create the tags and associate them with the post
          Post_tag: {
            create: tags.map((tag) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tag },
                  create: { name: tag },
                },
              },
            })),
          },
        },
        include: {
          Post_tag: {
            include: {
              tag: true, // Include associated tags in the response
            },
          },
        },
      });
  
      res.status(201).send(createdPost);
    } catch (error) {
      console.error("Error creating post:", error);
      next(error);
    }
  });
  

// Edit a post
postsRouter.put("/:id", authenticateUser, async (req, res, next) => {
  const postId = parseInt(req.params.id);
  const { title, content, published } = req.body;
  try {
    const token = req.headers.authorization.split(" ")[1]; // Extract the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    const userId = decoded.id; // Extract the userId from the decoded token

    // Check if the post exists and if the logged-in user is the author of the post
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        author: {
          id: userId,
        },
      },
    });

    if (!post) {
      return res
        .status(404)
        .send("Post not found or you are not authorized to edit it.");
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        published,
      },
    });

    res.send(updatedPost);
  } catch (error) {
    console.error("Error editing post:", error);
    next(error);
  }
});

// Delete a post
postsRouter.delete("/:id", authenticateUser, async (req, res, next) => {
  const postId = parseInt(req.params.id);
  try {
    // Extract user ID from the decoded token
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (post.authorId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post." });
    }

    // Delete comments associated with the post
    await prisma.comment.deleteMany({
      where: { postId: postId },
    });

    // Optionally, handle other dependencies like likes

    // Now, delete the post
    await prisma.post.delete({
      where: { id: postId },
    });

    // Return success message
    res.status(200).json({ message: "Post deleted successfully." });
  } catch (error) {
    console.error("Error deleting post:", error);
    next(error);
  }
});

module.exports = postsRouter;
