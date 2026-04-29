import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI only loads .env by default — explicitly load .env.local so it picks up Supabase URLs
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
