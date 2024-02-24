const express = require("express");
const friendsRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { authenticateUser } = require("../auth/middleware");

// Create a friendship between two users
friendsRouter.post("/", authenticateUser, async (req, res, next) => {
    try {
        const { userId1, userId2 } = req.body;

        // Check if both user IDs are provided
        if (!userId1 || !userId2) {
            return res.status(400).send("Both user IDs are required.");
        }

        // Check if the friendship already exists
        const existingFriendship = await prisma.friends.findFirst({
            where: {
                OR: [
                    { userId1: parseInt(userId1), userId2: parseInt(userId2) },
                    { userId1: parseInt(userId2), userId2: parseInt(userId1) }
                ]
            }
        });

        if (existingFriendship) {
            return res.status(409).send("Friendship already exists.");
        }

        // Create the friendship
        const friendship = await prisma.friends.create({
            data: {
                userId1: parseInt(userId1),
                userId2: parseInt(userId2)
            }
        });

        res.status(201).send({ message: "Friendship created successfully." });
    } catch (error) {
        next(error);
    }
});

// Delete a friendship by ID
friendsRouter.delete("/:id", authenticateUser, async (req, res, next) => {
    try {
        const friendshipId = parseInt(req.params.id);

        // Check if the friendship exists
        const friendship = await prisma.friends.findUnique({
            where: { id: friendshipId  }
        });

        if (!friendship) {
            return res.status(404).send("Friendship not found.");
        }

        // Delete the friendship
        await prisma.friends.delete({
            where: { id: friendshipId }
        });

        res.status(200).send({ message: "Friendship deleted successfully." });
    } catch (error) {
        next(error);
    }
});

module.exports = friendsRouter;