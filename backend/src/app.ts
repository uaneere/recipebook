import cors from "cors";
import express, { type Request, type Response } from "express";
import { productsRouter } from "./modules/products/productsRouter";
import { dishesRouter } from "./modules/dishes/dishesRouter";
import { errorMiddleware } from "./shared/errorMiddleware";
import { uploadRouter } from "./modules/upload/uploadRouter";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.use("/api/products", productsRouter);
  app.use("/api/dishes", dishesRouter);

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.use(errorMiddleware);
  app.use("/api", uploadRouter);
  return app;
}