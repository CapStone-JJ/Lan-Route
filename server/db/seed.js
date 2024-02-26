const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding the database.");
  try {
    // Clear the database.
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.friends.deleteMany({});
    await prisma.widget.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.vote.deleteMany({});

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

    // Create Widgets
    const widgets = [
      {
        type: 'clock',
        configuration: { color: 'red', size: 'medium' },
        userId: user1.id // Assuming user with ID 1 exists
      },
      {
        type: 'weather',
        configuration: { location: 'New York', units: 'metric' },
        userId: user2.id // Assuming user with ID 2 exists
      },
      // Add more seed data as needed
    ];

    // Create widgets
    const createdWidgets = await Promise.all(
      widgets.map(widget =>
        prisma.widget.create({
          data: widget
        })
      )
    );

    const votes = [
      {
        commentId: comment1.id, // Assuming there's a comment with ID 1
        userId: user1.id, // Assuming there's a user with ID 1
        type: 'upvote'
      },
      {
        commentId: comment2.id, // Assuming there's a comment with ID 2
        userId: user2.id, // Assuming there's a user with ID 2
        type: 'downvote'
      },
      // Add more seed data as needed
    ];

    // Insert votes into the database
    const createdVotes = await Promise.all(
      votes.map(vote =>
        prisma.vote.create({
          data: vote
        })
      )
    );

    console.log("Database is seeded.", createdWidgets);
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