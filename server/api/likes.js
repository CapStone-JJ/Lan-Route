const express = require("express");
const likeRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticateUser } = require("../auth/middleware");

// Get all likes for a post
likeRouter.get('/:postId', async (req, res, next) => {
    try {
        const { postId } = req.params;
        const likes = await prisma.like.findMany({
            where: {
                postId: parseInt(postId)
            }
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
        const likes = await prisma.like.create({
            data: {
                user: { connect: { id: userId } },
                postId: { connect: { id: postId }}
            }
        });
        res.status(201).send({ message: "Like has been created." });
    } catch (error) {
        next(error);
    }
});

// Delete a like
likeRouter.delete('/:id', authenticateUser, async (req, res, next) => {
    try {
        const likeId = parseInt(req.params.id);

        // Check if the like exists
        const likes = await prisma.like.findUnique({
            where: { id: likeId }
        });

        if (!likes) {
            return res.status(404).json({ error: 'Like not found' });
        }

        // Delete the like
        await prisma.like.delete({
            where: { id: likeId }
        });

        res.status(201).send({ message: "Like has been Deleted." });
    } catch (error) {
        next(error);
    }
});

module.exports = likeRouter;
