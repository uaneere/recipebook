import { Router } from "express";
import { z } from "zod";
import { parseBody, parseQuery } from "../../shared/zodHelpers";
import { CalculateNutritionSchema, CreateDishSchema, DishListQuerySchema, UpdateDishSchema } from "./dishSchemas";
import {
  calculateDishNutrition,
  createDish,
  deleteDish,
  getDish,
  listDishes,
  updateDish
} from "./dishesService";

export const dishesRouter = Router();

dishesRouter.get("/", async (req, res, next) => {
  try {
    const query = parseQuery(req, DishListQuerySchema);
    const dishes = await listDishes(query, req);
    res.json(dishes);
  } catch (err) {
    next(err);
  }
});

dishesRouter.post("/calculate-nutrition", async (req, res, next) => {
  try {
    const input = parseBody(req, CalculateNutritionSchema);
    const result = await calculateDishNutrition(input.ingredients, input.portionSize, req);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

dishesRouter.post("/", async (req, res, next) => {
  try {
    const input = parseBody(req, CreateDishSchema);
    const result = await createDish(input, req);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

dishesRouter.get("/:id", async (req, res, next) => {
  try {
    const id = z.string().parse(req.params.id);
    const dish = await getDish(id, req);
    res.json(dish);
  } catch (err) {
    next(err);
  }
});

dishesRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = z.string().parse(req.params.id);
    const input = parseBody(req, UpdateDishSchema);
    const result = await updateDish(id, input, req);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

dishesRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = z.string().parse(req.params.id);
    const result = await deleteDish(id, req);
    res.json(result);
  } catch (err) {
    next(err);
  }
});