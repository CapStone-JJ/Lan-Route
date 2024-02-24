const app = require("./server");
require("dotenv").config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});