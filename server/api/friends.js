const express = require("express");
const friendsRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { authenticateUser } = require("../auth/middleware");

// Get a list of friends for a specific user by user ID
friendsRouter.get("/users/:userId/friends", async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId);

        // Find all friendships where the specified user is either userId1 or userId2
        const friendships = await prisma.friends.findMany({
            where: {
                OR: [
                    { userId1: userId },
                    { userId2: userId }
                ]
            },
            include: {
                // Include user details for each friend
                user1: true,
                user2: true
            }
        });

        // Extract the details of the friends
        const friends = friendships.map(friendship => {
            // Determine which user is the friend based on the user IDs in the friendship
            const friendUser = friendship.userId1 === userId ? friendship.user2 : friendship.user1;
            return {
                id: friendUser.id,
                username: friendUser.username,
                // Include other details of the friend as needed
            };
        });

        res.status(200).json(friends);
    } catch (error) {
        next(error);
    }
});

// Get a list of friends for authenticated user
friendsRouter.get("/", async (req, res, next) => {
    try {
        const userId = req.user.id; // Assuming you have stored the authenticated user's ID in the request object

        // Find all friendships where the user is either userId1 or userId2
        const friendships = await prisma.friends.findMany({
            where: {
                OR: [
                    { userId1: userId },
                    { userId2: userId }
                ]
            },
            include: {
                // Include user details for each friend
                user1: true,
                user2: true
            }
        });

        // Extract the details of the friends
        const friends = friendships.map(friendship => {
            // Determine which user is the friend based on the user IDs in the friendship
            const friendUser = friendship.userId1 === userId ? friendship.user2 : friendship.user1;
            return {
                id: friendUser.id,
                username: friendUser.username,
                // Include other details of the friend as needed
            };
        });

        res.status(200).json(friends);
    } catch (error) {
        next(error);
    }
});

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

// Get a list of pending friend requests for the authenticated user
friendsRouter.get("/requests", authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const requests = await prisma.friendRequest.findMany({
            where: {
                recipientId: userId,
                status: 'PENDING'
            },
            include: {
                sender: true 
            }
        });
        res.json(requests);
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

// Create a friend request and notification
friendsRouter.post("/request", authenticateUser, async (req, res, next) => {
    try {
        const senderId = req.user.id; // The ID of the user sending the request
        const { recipientId } = req.body; // The ID of the user receiving the request

        // Ensure the recipient ID is provided
        if (!recipientId) {
            return res.status(400).send("Recipient ID is required.");
        }

        // Prevent users from sending a friend request to themselves
        if (senderId === recipientId) {
            return res.status(400).send("Cannot send a friend request to yourself.");
        }

        const existingRequest = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId, recipientId, status: 'PENDING' },
                    { senderId: recipientId, recipientId: senderId, status: 'PENDING' }
                ]
            }
        });

        if (existingRequest) {
            return res.status(409).send("Friend request already exists.");
        }

        // Create the friend request with status 'PENDING'
        await prisma.friendRequest.create({
            data: {
                senderId,
                recipientId,
                status: 'PENDING'
            }
        });

        // Create a notification for the recipient of the friend request
        await prisma.notification.create({
            data: {
                type: 'FRIEND_REQUEST',
                recipientId: recipientId,
                triggerById: senderId,
                // Add other fields as necessary
            },
        });

        res.status(201).send({ message: "Friend request sent successfully." });
    } catch (error) {
        next(error);
    }
});

// Accept a friend request
friendsRouter.post("/requests/:requestId/accept", authenticateUser, async (req, res) => {
    const { requestId } = req.params;

    try {
        const request = await prisma.friendRequest.update({
            where: { id: parseInt(requestId) },
            data: { status: 'ACCEPTED' }
        });

        await prisma.friends.create({
            data: {
                userId1: acceptedRequest.senderId,
                userId2: acceptedRequest.recipientId
            }
        });

        res.status(200).json({ message: "Friend request accepted." });
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

// Decline a friend request
friendsRouter.post("/requests/:requestId/decline", authenticateUser, async (req, res) => {
    const { requestId } = req.params;

    try {
        await prisma.friendRequest.delete({
            where: { id: parseInt(requestId) }
        });

        res.status(200).json({ message: "Friend request declined." });
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});



module.exports = friendsRouter;