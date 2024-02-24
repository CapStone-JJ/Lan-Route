const express = require("express");
const tagRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { authenticateUser } = require("../auth/middleware");

// Get all Tags for a post
tagRouter.get('/', async (req, res, next) => {
    try {
        const tag = await prisma.tag.findMany();
        res.json(tag);
    } catch (error) {
        next(error);
    }
});

// Get a tag by id
tagRouter.get("/:id", async (req, res, next) => {
    try {
      const tag = await prisma.tag.findFirst({
        where: {
          id: parseInt(req.params.id),
          // userId: req.user.id,
        },
      });
  
      if (!tag) {
        return res.status(404).send("Tag not found.");
      }
  
      res.send(tag);
    } catch (error) {
      next(error);
    }
  });


// Create a new Tag
tagRouter.post("/", authenticateUser, async (req, res, next) => {
    try {
        const { name } = req.body;
      const tag = await prisma.tag.create({
        data: {
          name,
      },
      });
      res.status(201).send({ message: "Tag has been created." });
    } catch (error) {
      next(error);
    }
  });

// Delete a comment 
tagRouter.delete('/:id', authenticateUser, async (req, res, next) => {
    try {
      const tagId = parseInt(req.params.id);
  
      // Check if the tag exists
      const tag = await prisma.tag.findUnique({
        where: { id: tagId }
      });
  
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
  
      // Delete the tag
      await prisma.tag.delete({
        where: { id: tagId }
      });
  
      res.status(201).send({ message: "Tag has been Deleted." });
    } catch (error) {
      next(error);
    }
  });


module.exports = tagRouter;