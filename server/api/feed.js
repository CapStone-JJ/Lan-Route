const express = require('express');
const feedRouter = express.Router();
const { authenticateUser } = require("../auth/middleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getUserFeed(userId) {
  try {
    // Query user's posts
    const userPosts = await prisma.post.findMany({
      where: {
        authorId: userId,
      },
    });

    // Query user's friends
    const userFriends = await prisma.friends.findMany({
      where: {
        OR: [
          { userId1: userId },
          { userId2: userId },
        ],
      },
    });

    // Extract friend IDs
    const friendIds = userFriends.map(friend => {
      if (friend.userId1 === userId) {
        return friend.userId2;
      } else {
        return friend.userId1;
      }
    });

    // Query posts of user's friends
    const friendsPosts = await prisma.post.findMany({
      where: {
        authorId: {
          in: friendIds,
        },
      },
    });

    // Combine user's posts and friends' posts
    const feedPosts = [...userPosts, ...friendsPosts];

    // Sort posts by createdAt timestamp in descending order
    feedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return feedPosts;
  } catch (error) {
    console.error('Error fetching user feed:', error);
    throw error;
  }
}

  async function getUserFeedWithTrending(userId) {
    try {
      // Query user's feed
      const userFeed = await getUserFeed(userId);
  
      // Query trending posts (example: posts with most likes)
      const trendingPosts = await prisma.post.findMany({
        orderBy: {
          likes: {
            _count: 'desc',
          },
        },
        take: 10, // Fetch top 10 trending posts
      });

      // Convert user's feed to Set to remove duplicates
      const uniqueUserFeed = new Set(userFeed.map(post => post.id));

      // Filter out trending posts that are already in the user's feed
      const uniqueTrendingPosts = trendingPosts.filter(trendingPost => {
        return !uniqueUserFeed.has(trendingPost.id);
      });  
  
      // Combine user's feed and trending posts
      const feedWithTrending = [...userFeed, ...uniqueTrendingPosts];
  
      // Sort combined feed by createdAt timestamp in descending order
      feedWithTrending.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
      return feedWithTrending;
    } catch (error) {
      console.error('Error fetching user feed with trending posts:', error);
      throw error;
    }
  }

// Define route to fetch user feed with trending posts
feedRouter.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in request object after authentication
    const feedWithTrending = await getUserFeedWithTrending(userId);
    res.json(feedWithTrending);
  } catch (error) {
    console.error('Error fetching user feed with trending posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = feedRouter;