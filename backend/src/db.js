const { PrismaClient } = require("@prisma/client");

// Reuse a single client across hot reloads in dev, and across the app in prod.
const prisma = global.__commonsPrisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__commonsPrisma = prisma;

module.exports = prisma;
