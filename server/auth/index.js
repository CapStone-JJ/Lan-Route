const router = require("express").Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const { authenticateUser, authorizeUser } = require("./middleware");

function generateVerificationToken() {
  const tokenLength = 10;
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < tokenLength; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

// Create a new user
router.post("/register", async (req, res, next) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = generateVerificationToken(); // Implement this function

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
      },
    });

    // Store the verification token in the database
    await prisma.verificationToken.create({
      data: {
        identifier: email, // Use email as the identifier
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Set expiration time (e.g., 24 hours from now)
      },
    });

    // Send response with token and user ID
    res.status(201).send({ message: "New Account Created" });
  } catch (err) {
    // Handle error
    next(err);
  }
});

// Login to an existing user account
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send("Invalid login credentials.");
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    res.send({ token, user });
  } catch (error) {
    next(error);
  }
});

// Get the currently logged in user
router.get("/me", authenticateUser, async (req, res, next) => {
  try {
    // Retrieve the user ID from the request object, assuming it's stored in req.user.id
    const userId = req.user.id;

    // Use the user ID to find the user in the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user data
    return res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update a user
router.put("/:id", authenticateUser, async (req, res, next) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await prisma.user.update({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
      },
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    res.status(201).send({ message: "Account has been updated." });
  } catch (error) {
    next(error);
  }
});

// Delete a user by id
router.delete("/:id", authenticateUser, async (req, res, next) => {
  try {
    const user = await prisma.user.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    res
      .status(200)
      .send({ message: "User account has been deleted successfully!" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
