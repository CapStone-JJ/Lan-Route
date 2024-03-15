const express = require('express');
const postSearchRouter = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

postSearchRouter.get('/:search', async (req, res, next) => {
    try {
        console.log('Received search term:', req.params.search);

        const posts = await prisma.post.findMany({
            where: {
                OR: [
                    {
                        content: {
                            contains: req.params.search, // Search by post content
                        },
                    },
                ],
            },
            include: {
                Post_tag: {
                    include: {
                        tag: true
                    }
                },
            },
        });

        res.json(posts);
    } catch (error) {
        console.error('Error in postSearchRouter:', error);
        next(error);
    }
});

module.exports = postSearchRouter;

