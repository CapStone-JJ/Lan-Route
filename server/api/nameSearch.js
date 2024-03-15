const express = require('express');
const nameSearchRouter = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

nameSearchRouter.get('/:search', async (req, res, next) => {
    try {
        console.log('Received search term:', req.params.search);

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
        console.error('Error in nameSearchRouter:', error);
        next(error);
    }
});

module.exports = nameSearchRouter;

