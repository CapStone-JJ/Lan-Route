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

router.post("/register", async (req, res, next) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = generateVerificationToken();

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
        identifier: email,
        token: verificationToken,
        expires: new Date(Date.now() + (24 * 60 * 60 * 1000)), // Set expiration time (e.g., 24 hours from now)
      },
    });

    res.status(201).send({ user, message: "New Account Created" });
  } catch (err) {
    // Handle error
    next(err);
  }
});

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

router.get("/me", authenticateUser, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:username", async (req, res, next) => {
  try {
    const username = req.params.username;

    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        createdAt: true,
        admin: true,
        image: true,
        location: true,
        viewedProfile: true,
        impressions: true,
        emailVerified: true,
        post: true,
        comments: true,
        bio: true,
        widgets: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", authenticateUser, async (req, res, next) => {
  try {
    const { username, password, email, firstName, lastName, location, bio, image } = req.body.body;

    // Check if the password is provided
    if (!password) {
      return res.status(400).send("Password is required.");
    }

    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        firstName,
        lastName,
        username,
        location,
        bio,
        email,
        password: hashedPassword,
        image,
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
    // Send success response
    res.status(201).send({ user, message: "Account has been updated." });
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
})

  
// Delete a user by id
router.delete("/:id", authenticateUser, async (req, res, next) => {
  try {
      const userId = parseInt(req.params.id); // Parse the userId from request params
      const user = await prisma.user.delete({
          where: {
              id: userId // Pass the userId to the delete method
          }
      });

    res.status(200)
      .send({ message: "User account has been deleted successfully!" });
  } catch (error) {
    next(error);
  }
});
module.exports = router;