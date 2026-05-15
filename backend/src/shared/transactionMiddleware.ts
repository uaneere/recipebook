import { Request, Response, NextFunction } from "express";
import { prisma } from "../db";

const transactionStore = new Map<string, any>();

export const transactionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const txId = req.headers["x-transaction-id"] as string;
  
  if (txId && process.env.NODE_ENV === "test") {
    try {
      const tx = await prisma.$transaction(async (prismaTx) => {
        transactionStore.set(txId, prismaTx);
        (req as any).tx = prismaTx;
        
        next();
        
        return new Promise(() => {});
      });
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
};

export async function rollbackTransaction(txId: string) {
  const tx = transactionStore.get(txId);
  if (tx) {
    await tx.$rollback();
    transactionStore.delete(txId);
  }
}