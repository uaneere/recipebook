CREATE TYPE "ProductCategory" AS ENUM (
  'Frozen',
  'Meat',
  'Vegetables',
  'Greens',
  'Spices',
  'Groats',
  'Canned',
  'Liquid',
  'Sweets'
);

CREATE TYPE "PreparationType" AS ENUM (
  'ReadyToEat',
  'SemiFinished',
  'RequiresCooking'
);

CREATE TYPE "DishCategory" AS ENUM (
  'Dessert',
  'First',
  'Second',
  'Drink',
  'Salad',
  'Soup',
  'Snack'
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "calories" DOUBLE PRECISION NOT NULL,
  "proteins" DOUBLE PRECISION NOT NULL,
  "fats" DOUBLE PRECISION NOT NULL,
  "carbs" DOUBLE PRECISION NOT NULL,
  "compositionText" TEXT,
  "category" "ProductCategory" NOT NULL,
  "preparationType" "PreparationType" NOT NULL,
  "isVegan" BOOLEAN NOT NULL DEFAULT false,
  "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
  "isSugarFree" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Dish" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "calories" DOUBLE PRECISION NOT NULL,
  "proteins" DOUBLE PRECISION NOT NULL,
  "fats" DOUBLE PRECISION NOT NULL,
  "carbs" DOUBLE PRECISION NOT NULL,
  "portionSize" DOUBLE PRECISION NOT NULL,
  "category" "DishCategory" NOT NULL,
  "isVegan" BOOLEAN NOT NULL DEFAULT false,
  "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
  "isSugarFree" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DishIngredient" (
  "dishId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "grams" DOUBLE PRECISION NOT NULL,

  CONSTRAINT "DishIngredient_pkey" PRIMARY KEY ("dishId","productId")
);

ALTER TABLE "DishIngredient" ADD CONSTRAINT "DishIngredient_dishId_fkey" 
  FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DishIngredient" ADD CONSTRAINT "DishIngredient_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Product_name_idx" ON "Product"("name");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_preparationType_idx" ON "Product"("preparationType");

CREATE INDEX "Dish_name_idx" ON "Dish"("name");
CREATE INDEX "Dish_category_idx" ON "Dish"("category");

CREATE INDEX "DishIngredient_productId_idx" ON "DishIngredient"("productId");

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_updated_at BEFORE UPDATE ON "Product"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dish_updated_at BEFORE UPDATE ON "Dish"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();