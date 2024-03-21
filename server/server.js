// Import necessary modules
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require("dotenv").config();
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const upload = require("./multerConfig");

// Create Express app
const app = express();

// Logging middleware
app.use(morgan("dev"));

// CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file-serving middleware
app.use(express.static(path.join(__dirname, "..", "client/dist")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  try {
    if (token) {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } else {
      req.user = null;
    }
  } catch (error) {
    console.error("JWT verification error:", error);
    // req.user = null;
  }
  next();
});


// Backend Routes
app.use("/auth", require("./auth"));
// Protect API routes with JWT verification middleware
app.use(
  "/api",
  (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).send("Unauthorized");
    }
    next();
  },
  require("./api")
);
// Serves the HTML file that Vite builds
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client/dist/index.html"));
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).send(err.message || "Internal server error.");
});
// Default to 404 if no other route matched
app.use((req, res) => {
  res.status(404).send("Not found.");
});

module.exports = app;
