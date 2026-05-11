import { prisma } from "../src/db";

type NutritionProduct = { calories: number; proteins: number; fats: number; carbs: number };
type NutritionIngredient = { product: NutritionProduct; grams: number };

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function calculateNutritionForPortion(ingredients: NutritionIngredient[], portionSize: number) {
  const totalPer100g = ingredients.reduce(
    (acc, ing) => {
      const k = ing.grams / 100;
      acc.calories += ing.product.calories * k;
      acc.proteins += ing.product.proteins * k;
      acc.fats += ing.product.fats * k;
      acc.carbs += ing.product.carbs * k;
      return acc;
    },
    { calories: 0, proteins: 0, fats: 0, carbs: 0 }
  );

  const factor = portionSize / 100;
  return {
    calories: round2(totalPer100g.calories * factor),
    proteins: round2(totalPer100g.proteins * factor),
    fats: round2(totalPer100g.fats * factor),
    carbs: round2(totalPer100g.carbs * factor)
  };
}

async function main() {
  const beet = await prisma.product.findUnique({ where: { id: "seed_beet" } });
  const potato = await prisma.product.findUnique({ where: { id: "seed_potato" } });
  const water = await prisma.product.findUnique({ where: { id: "seed_water" } });
  const meat = await prisma.product.findUnique({ where: { id: "seed_meat" } });

  if (!beet || !potato || !water || !meat) {
    throw new Error("Products not found. Run migrations first.");
  }

  const borschNutrition = calculateNutritionForPortion([
    { product: beet, grams: 120 },
    { product: potato, grams: 180 },
    { product: water, grams: 300 },
    { product: meat, grams: 150 }
  ], 450);

  const veganBorschNutrition = calculateNutritionForPortion([
    { product: beet, grams: 120 },
    { product: potato, grams: 180 },
    { product: water, grams: 320 }
  ], 450);

  const potatoSoupNutrition = calculateNutritionForPortion([
    { product: potato, grams: 200 },
    { product: water, grams: 500 }
  ], 700);

  await prisma.dish.update({
    where: { id: "seed_borsch" },
    data: {
      calories: borschNutrition.calories,
      proteins: borschNutrition.proteins,
      fats: borschNutrition.fats,
      carbs: borschNutrition.carbs
    }
  });

  await prisma.dish.update({
    where: { id: "seed_borsch_vegan" },
    data: {
      calories: veganBorschNutrition.calories,
      proteins: veganBorschNutrition.proteins,
      fats: veganBorschNutrition.fats,
      carbs: veganBorschNutrition.carbs
    }
  });

  await prisma.dish.update({
    where: { id: "seed_potato_pohlebka" },
    data: {
      calories: potatoSoupNutrition.calories,
      proteins: potatoSoupNutrition.proteins,
      fats: potatoSoupNutrition.fats,
      carbs: potatoSoupNutrition.carbs
    }
  });

  console.log("Seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    throw err;
  });