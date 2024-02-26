const express = require('express');
const apiRouter = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { JWT_SECRET } = process.env;

// Set `req.user` if possible
apiRouter.use(async (req, res, next) => {
    const prefix = 'Bearer ';
    const auth = req.header('Authorization');
  
    if (!auth) {
      next();
    } else if (auth.startsWith(prefix)) {
      const token = auth.slice(prefix.length);
  
      try {
        const { id } = jwt.verify(token, JWT_SECRET);
  
        if (id) {
          const user = await prisma.user.findUnique({
            where: {
              id: parseInt(id),
            },
          });
  
          if (!user) {
            throw new Error("User not found");
          }
  
          req.user = user;
          next();
        } else {
          next({
            name: 'AuthorizationHeaderError',
            message: 'Authorization token malformed',
          });
        }
      } catch (error) {
        next(error);
      }
    } else {
      next({
        name: 'AuthorizationHeaderError',
        message: `Authorization token must start with ${prefix}`,
      });
    }
  });
  
  apiRouter.use((req, res, next) => {
    if (req.user) {
      console.log('User is set:', req.user);
    }
  
    next();
  });

const commentRouter = require('./comments');
apiRouter.use('/comments', commentRouter);

const postsRouter = require('./posts');
apiRouter.use('/posts', postsRouter);

const tagRouter = require('./tags');
apiRouter.use('/tags', tagRouter);

const likeRouter = require('./likes');
apiRouter.use('/likes', likeRouter);

const friendsRouter = require('./friends');
apiRouter.use('/friends', friendsRouter);

const widgetRouter = require('./widget');
apiRouter.use('/widget', widgetRouter);

const votesRouter = require('./votes');
apiRouter.use('/votes', votesRouter);

module.exports = apiRouter;