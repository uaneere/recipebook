import { PrismaClient } from "./generated/prisma/client";
import { Request } from "express";

const databaseUrl = process.env.NODE_ENV === "test" && process.env.DATABASE_URL_TEST 
  ? process.env.DATABASE_URL_TEST 
  : process.env.DATABASE_URL;

export const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

declare global {
  namespace Express {
    interface Request {
      tx?: PrismaClient;
    }
  }
}

export const getPrisma = (req?: Request) => {
  if (req?.tx && process.env.NODE_ENV === "test") {
    return req.tx;
  }
  return prisma;
};