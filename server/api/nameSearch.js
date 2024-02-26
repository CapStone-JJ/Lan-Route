const express = require('express');
const nameSearchRouter = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

nameSearchRouter.get('/:search', async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        username: {
                            contains: req.params.search, // Search by username
                        },
                    },
                    {
                        firstName: {
                            contains: req.params.search, // Search by first name
                        },
                    },
                    {
                        lastName: {
                            contains: req.params.search, // Search by last name
                        },
                    },
                ],
            },
        });

        res.json(users);
    } catch (error) {
        next(error);
    }
});

module.exports = nameSearchRouter;
