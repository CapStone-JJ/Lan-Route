const router  = require('express').Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const protection = require('./middleware');

// Create a new user
router.post("/register", async (req, res, next) => {
  try {
      const { username, password, email, firstName, lastName, seller } = req.body;
      const saltRounds = 10; // Number of salt rounds
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = await prisma.user.create({
          data: {
              firstName,
              lastName,
              username,
              email,
              password: hashedPassword
          }
      });

      // Set user in request object (optional)
      req.user = user;

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

        if (!user) {
            return res.status(401).send("Invalid login credentials.");
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).send("Invalid login credentials.");
        }

        // Create a token with the user id
        const token = jwt.sign({ id: user.id }, process.env.JWT);

        res.send({ token });
    } catch (error) {
        next(error);
    }
});

// Get the currently logged in user
router.get("/me", async (req, res, next) => {
    console.log( req.user.id)
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user?.id,
        },
      });
      res.send(user);
    } catch (error) {
      next(error);
    }
  });

// Update a user
router.put("/:id", require('./middleware'), async (req, res, next) => {
    try {
      const { username, password, email, firstName, lastName, seller, } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const user = await prisma.user.update({
        data: {  
            firstName,
            lastName,
            username,
            email,
            seller,
            password: hashedPassword
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
router.delete("/:id", require('./middleware'), async (req, res, next) => {
    try {
      const user = await prisma.user.delete({
        where: {
          id: parseInt(req.params.id),
        },
      });
  
      if (!user) {
        return res.status(404).send("User not found.");
      }
  
      res.status(200).send({message: "User account has been deleted successfully!"});
    } catch (error) {
      next(error);
    }
  });

module.exports = router;