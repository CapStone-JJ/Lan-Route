const express = require("express");
const votesRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { authenticateUser } = require("../auth/middleware");

// Route for creating a new vote
votesRouter.post('/votes', authenticateUser, async (req, res) => {
    try {
      const { commentId, userId, type } = req.body;
      const vote = await prisma.vote.create({
        data: {
          commentId,
          userId,
          type
        }
      });
      res.json(vote);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create vote' });
    }
  });

  
// Route for getting all votes
votesRouter.get('/votes', async (req, res) => {
    try {
      const votes = await prisma.vote.findMany();
      res.json(votes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch votes' });
    }
  });

  // Route for deleting a vote
  votesRouter.delete('/votes/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.vote.delete({
        where: { id: parseInt(id) }
      });
      res.json({ message: 'Vote deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete vote' });
    }
  });

  module.exports = votesRouter;