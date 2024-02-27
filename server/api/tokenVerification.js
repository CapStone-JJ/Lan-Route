const express = require("express");
const tokenVerificationRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

tokenVerificationRouter.get('/verify/:identifier/:token', async (req, res, next) => {
    try {
        const { identifier, token } = req.params;

        // Query the database to find the token
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                identifier,
                token,
                expires: {
                    gte: new Date(), // Check if the token has not expired
                },
            },
        });

        if (verificationToken) {
            // Mark the user's email as verified in the database
            await prisma.user.update({
                where: {
                    email: identifier,
                },
                data: {
                    emailVerified: true,
                },
            });

            // Optionally, you can delete the verification token from the database after successful verification
            await prisma.verificationToken.delete({
                where: {
                    id: verificationToken.id,
                },
            });
            
        } else {
            // Token is invalid or has expired
            res.status(404).json({ error: 'Token not found or has expired' });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = tokenVerificationRouter;
