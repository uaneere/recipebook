import { Router } from "express";
import { z } from "zod";
import { parseBody, parseQuery } from "../../shared/zodHelpers";
import { CreateProductSchema, ProductListQuerySchema, UpdateProductSchema } from "./productSchemas";
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from "./productsService";

export const productsRouter = Router();

productsRouter.get("/", async (req, res, next) => {
  try {
    const query = parseQuery(req, ProductListQuerySchema);
    const products = await listProducts(query);
    res.json(products);
  } catch (err) {
    next(err);
  }
});

productsRouter.post("/", async (req, res, next) => {
  try {
    const input = parseBody(req, CreateProductSchema);
    const product = await createProduct(input);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = z.string().parse(req.params.id);
    const product = await getProduct(id);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

productsRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = z.string().parse(req.params.id);
    const input = parseBody(req, UpdateProductSchema);
    const product = await updateProduct(id, input);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

productsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = z.string().parse(req.params.id);
    const result = await deleteProduct(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});