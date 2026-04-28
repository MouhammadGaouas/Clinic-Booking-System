import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

// If your Prisma file is located elsewhere, you can change the path
import { Prisma } from "@/generated/prisma/client";

export const auth = betterAuth({
  database: prismaAdapter(Prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()], // make sure this is the last plugin in the array
});
