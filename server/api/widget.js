const express = require("express");
const widgetRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { authenticateUser } = require("../auth/middleware");

// Route for getting all widgets
widgetRouter.get('/', async (req, res) => {
    try {
      const widgets = await prisma.widget.findMany();
      res.json(widgets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch widgets' });
    }
  });

  // Route for getting a specific widget by ID
widgetRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const widget = await prisma.widget.findUnique({
          where: { id: parseInt(id) }
      });
      if (!widget) {
          return res.status(404).json({ error: 'Widget not found' });
      }
      res.json(widget);
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch widget details' });
  }
});

// Route for creating a new widget
widgetRouter.post('/', authenticateUser, async (req, res) => {
  try {
    const { type, configuration, userId } = req.body;

    // Convert the type to a string
    const widgetType = String(type);

    const widgets = await prisma.widget.create({
      data: {
        type: widgetType, // Use the converted widgetType
        configuration,
        userId
      }
    });

    res.json(widgets);
  } catch (error) {
    console.error('Error creating widget:', error);
    res.status(500).json({ error: 'Failed to create widget' });
  }
});



// Route for updating a widget
widgetRouter.put('/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { type, configuration, userId } = req.body;
    try {
      const updatedWidget = await prisma.widget.update({
        where: { id: parseInt(id) },
        data: {
          type,
          configuration,
          userId
        }
      });
      res.json(updatedWidget);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update widget' });
    }
  });  

// Route for deleting a widget
widgetRouter.delete('/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.widget.delete({
        where: { id: parseInt(id) }
      });
      res.json({ message: 'Widget deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete widget' });
    }
  });

  module.exports = widgetRouter;