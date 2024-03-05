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
        const tags = await prisma.tag.findMany();
        res.json(tags);
    } catch (error) {
        next(error);
    }
});

// Get a tag by id
tagRouter.get("/:id", async (req, res, next) => {
    try {
      const tags= await prisma.tag.findFirst({
        where: {
          id: parseInt(req.params.id),
          // userId: req.user.id,
        },
      });
  
      if (!tags) {
        return res.status(404).send("Tag not found.");
      }
  
      res.send(tags);
    } catch (error) {
      next(error);
    }
  });


  tagRouter.post("/", authenticateUser, async (req, res, next) => {
    try {
        const { name } = req.body.variables;
        
        // Check if the tag already exists
        const existingTag = await prisma.tag.findUnique({
            where: {
                name: name,
            },
        });

        if (existingTag) {
            // Tag already exists, send an appropriate response
            return res.status(400).json({ message: 'Tag already exists.' });
        }

        // Create the tag if it doesn't exist
        const createdTag = await prisma.tag.create({
            data: {
                name,
            },
        });

        res.status(201).send({ message: "Tag has been created.", tag: createdTag });
    } catch (error) {
        next(error);
    }
});

// Delete a comment 
tagRouter.delete('/:id', authenticateUser, async (req, res, next) => {
    try {
      const tagId = parseInt(req.params.id);
  
      // Check if the tag exists
      const tags = await prisma.tag.findUnique({
        where: { id: tagId }
      });
  
      if (!tags) {
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