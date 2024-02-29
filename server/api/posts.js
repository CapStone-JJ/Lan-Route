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
      const posts = await prisma.post.findMany();
      res.send(posts);
    } catch (error) {
      next(error);
    }
  });

// Get posts by id
postsRouter.get("/:id", async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id);
      const posts = await prisma.post.findUnique({
        where: {
          id: postId
        },
    });
  
    if (!posts) {
        return res.status(404).send("Post not found.");
    }
  
    res.send(posts);
    } catch (error) {
    next(error);
    }
});

// Create a new post
postsRouter.post("/", authenticateUser, async (req, res, next) => {
    const { title, content, published } = req.body;
    
    try {
        const token = req.headers.authorization.split(" ")[1]; // Extract the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
        const userId = decoded.id;
  
        // Retrieve the user data based on the user ID obtained from the token
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
  
        if (!user) {
            // Handle the case where the user is not found
            return res.status(404).send("User not found.");
        }
  
        // Create a new post with the author set to the retrieved user
        const posts = await prisma.post.create({
            data: {
                content,
                published, 
                author: { connect: { id: userId } }
            },
        });
  
        res.status(201).send(posts);
    } catch (error) {
        console.error('Error creating post:', error);
        next(error);
    }
  });

// Delete a post 
postsRouter.delete("/:id", authenticateUser, async (req, res, next) => {
    const postId = parseInt(req.params.id);
  
    try {
        const token = req.headers.authorization.split(" ")[1]; // Extract the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
        const userId = decoded.id;
  
        // Check if the post exists and if the logged-in user is the author of the post
        const posts = await prisma.post.findFirst({
            where: {
                id: postId,
                author: {
                    id: userId
                }
            }
        });
  
        if (!posts) {
            return res.status(404).send("Post not found or you are not authorized to delete it.");
        }
  
        // Delete the post
        await prisma.post.delete({ where: { id: postId } });
  
        res.send("Post deleted successfully.");
    } catch (error) {
        console.error('Error deleting post:', error);
        next(error);
    }
  });


module.exports = postsRouter;