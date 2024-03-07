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
                Post_tag: { include: { tag: true } } // Include the name of the tags
            }
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
                        username: true
                    }
                },
                Post_tag: { include: { tag: true } }
            }
        });

        if (!post) {
            return res.status(404).send("Post not found.");
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

// Create a new post with associated tags
postsRouter.post("/", authenticateUser, async (req, res, next) => {
    const { content, published, tags } = req.body;
    try {
        const token = req.headers.authorization.split(" ")[1]; // Extract the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
        const userId = decoded.id; // Extract the userId from the decoded token

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

        // Create the post
        const createdPost = await prisma.post.create({
            data: {
                content,
                published,
                author: { connect: { id: userId } },
            },
        });

        // Create or connect tags
        const tagPromises = tags.map(async tagName => {
            const existingTag = await prisma.tag.findUnique({
                where: { name: tagName }
            });

            if (existingTag) {
                // Tag already exists, just connect it to the post
                return prisma.post_tag.create({
                    data: {
                        post: { connect: { id: createdPost.id } },
                        tag: { connect: { id: existingTag.id } }
                    }
                });
            } else {
                // Tag doesn't exist, create it and connect it to the post
                const newTag = await prisma.tag.create({
                    data: { name: tagName }
                });
                return prisma.post_tag.create({
                    data: {
                        post: { connect: { id: createdPost.id } },
                        tag: { connect: { id: newTag.id } }
                    }
                });
            }
        });

        // Wait for all tag promises to resolve
        await Promise.all(tagPromises);

        res.status(201).send(createdPost);
    } catch (error) {
        console.error('Error creating post:', error);
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
                    id: userId
                }
            }
        });

        if (!post) {
            return res.status(404).send("Post not found or you are not authorized to edit it.");
        }

        // Update the post
        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: {
                title,
                content,
                published
            }
        });

        res.send(updatedPost);
    } catch (error) {
        console.error('Error editing post:', error);
        next(error);
    }
});

// Delete a post 
postsRouter.delete("/:id", authenticateUser, async (req, res, next) => {
    const postId = parseInt(req.params.id);
    try {
        // Extract user ID from the decoded token
        const userId = req.user.id;

        // Find the post and check if the user is authorized to delete it
        const post = await prisma.post.findFirst({
            where: {
                id: postId,
                authorId: userId // Ensure that the logged-in user is the author of the post
            }
        });

        // If the post is not found or the user is not authorized, return 404
        if (!post) {
            return res.status(404).send("Post not found or you are not authorized to delete it.");
        }

        // Delete related likes first
        await prisma.like.deleteMany({
            where: {
                postId: postId
            }
        });

        // Then delete the post
        await prisma.post.delete({ where: { id: postId } });

        // Return success message
        res.status(200).json({ message: "Post deleted successfully." });
    } catch (error) {
        console.error('Error deleting post:', error);
        next(error);
    }
});




module.exports = postsRouter;