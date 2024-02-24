const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding the database.");
  try {
    // Clear the database.
    await prisma.comment.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.friends.deleteMany({});
    await prisma.widget.deleteMany({});
    await prisma.user.deleteMany({});

    // Create users
    const user1 = await prisma.user.create({
      data: {
        username: "user1",
        firstName: "John",
        lastName: "Doe",
        email: "user1@example.com",
        password: "password1",
        location: "New York",
      },
    });

    const user2 = await prisma.user.create({
      data: {
        username: "user2",
        firstName: "Jane",
        lastName: "Doe",
        email: "user2@example.com",
        password: "password2",
        location: "Los Angeles",
      },
    });    

    // Create posts
    const post1 = await prisma.post.create({
      data: {
        content: "This is the content of the first post.",
        published: true,
        authorId: user1.id,
      },
    });

    const post2 = await prisma.post.create({
      data: {
        content: "This is the content of the second post.",
        published: true,
        authorId: user2.id,
      },
    });

    // Create tags
    const tag1 = await prisma.tag.create({
      data: {
        name: "Technology",
        Post_tag: {
          create: [{ postId: post1.id }, { postId: post2.id }],
        },
      },
    });

    const tag2 = await prisma.tag.create({
      data: {
        name: "Travel",
        Post_tag: {
          create: [{ postId: post2.id }],
        },
      },
    });

    // Create comments
    const comment1 = await prisma.comment.create({
      data: {
        text: "Great post!",
        postId: post1.id,
        userId: user2.id,
      },
    });

    const comment2 = await prisma.comment.create({
      data: {
        text: "Interesting topic!",
        postId: post2.id,
        userId: user1.id,
      },
    });

    console.log("Database is seeded.");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;