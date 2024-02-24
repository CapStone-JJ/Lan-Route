// Import necessary modules
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const cors = require("cors");

// Import middleware
const protection = require("./auth/middleware");

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

// Middleware for JWT token authentication
app.use(protection);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).send(err.message || "Internal server error.");
});

// Define backend routes
app.use("/api", require("./api"));
app.use("/auth", require("./auth/index"));
// app.use("/comment", require("./api/comment"));
// app.use("/posts", require("./api/posts"));
// app.use("/tags", require("./api/tags"));

// Default to 404 if no other route matched
app.use((req, res) => {
    res.status(404).send("Not found.");
});

// Export Express app
module.exports = app;
