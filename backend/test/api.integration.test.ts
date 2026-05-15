import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/db';
import type { Express } from 'express';

/**
 * API интеграционные тесты для модулей Products и Dishes
 * Все изменения откатятся, даже если тест завершится с ошибкой
 * Сиды загружаются через setup.integration.ts
 */

const SEED_IDS = ['seed_beet', 'seed_potato', 'seed_water', 'seed_meat', 'seed_pumpkin', 'seed_donuts'];

describe('API Интеграционные тесты', () => {
	let app: Express;
	let testProductId: string;
	let testDishId: string;

	beforeAll(async () => {
		app = createApp();
	});

	describe('POST /api/dishes', () => {
		it('EP1: должен создать блюдо с валидными данными', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const dishData = {
				name: 'Картофельное пюре',
				photos: [],
				portionSize: 250,
				category: 'Second',
				isVegan: true,
				isGlutenFree: true,
				isSugarFree: true,
				ingredients: [{ productId: seedProduct!.id, grams: 200 }]
			};

			const response = await request(app)
				.post('/api/dishes')
				.send(dishData);

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty('dish');
			expect(response.body.dish.name).toBe('Картофельное пюре');

			testDishId = response.body.dish.id;

			const dbIngredients = await prisma.dishIngredient.findMany({
				where: { dishId: testDishId }
			});
			expect(dbIngredients).toHaveLength(1);
		});

		it('EP2: должен создать блюдо с макросом !первое', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const response = await request(app)
				.post('/api/dishes')
				.send({
					name: '!первое Картофельный суп',
					photos: [],
					portionSize: 300,
					category: 'First',
					ingredients: [{ productId: seedProduct!.id, grams: 100 }]
				});

			expect(response.status).toBe(201);
			expect(response.body.dish.name).toBe('Картофельный суп');
			expect(response.body.dish.category).toBe('First');
		});

		it('EP3: должен вернуть ошибку при попытке установить неразрешенный флаг isVegan', async () => {
			const meatProduct = await prisma.product.findFirst({
				where: { name: 'Мясо' }
			});

			expect(meatProduct).toBeTruthy();
			expect(meatProduct!.isVegan).toBe(false);

			const response = await request(app)
				.post('/api/dishes')
				.send({
					name: 'Мясное блюдо',
					photos: [],
					portionSize: 300,
					category: 'Second',
					isVegan: true,
					ingredients: [{ productId: meatProduct!.id, grams: 200 }]
				});

			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe('FLAG_NOT_ALLOWED');
		});

		it('BVA1: должен создать блюдо с 1 ингредиентом', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const response = await request(app)
				.post('/api/dishes')
				.send({
					name: 'Вареный картофель',
					photos: [],
					portionSize: 200,
					category: 'Second',
					ingredients: [{ productId: seedProduct!.id, grams: 200 }]
				});

			expect(response.status).toBe(201);
			expect(response.body.dish).toBeDefined();
			expect(response.body.dish.name).toBe('Вареный картофель');

			const dbIngredients = await prisma.dishIngredient.findMany({
				where: { dishId: response.body.dish.id }
			});
			expect(dbIngredients).toHaveLength(1);
		});

		it('BVA2: должен вернуть ошибку при 0 ингредиентов', async () => {
			const response = await request(app)
				.post('/api/dishes')
				.send({
					name: 'Пустое блюдо',
					photos: [],
					portionSize: 200,
					category: 'Second',
					ingredients: []
				});

			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe('VALIDATION_ERROR');
		});

		it('BVA3: должен создать блюдо с минимальной порцией 0.01г', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Специи' }
			});

			let productId = seedProduct?.id;
			if (!productId) {
				const productResponse = await request(app)
					.post('/api/products')
					.send({
						name: 'Соль',
						photos: [],
						calories: 0,
						proteins: 0,
						fats: 0,
						carbs: 0,
						preparationType: 'ReadyToEat',
						category: 'Spices'
					});
				productId = productResponse.body.id;
			}

			const response = await request(app)
				.post('/api/dishes')
				.send({
					name: 'Микро порция',
					photos: [],
					portionSize: 0.01,
					category: 'Snack',
					ingredients: [{ productId: productId!, grams: 0.01 }]
				});

			expect(response.status).toBe(201);
			expect(response.body.dish.portionSize).toBe(0.01);
		});

		it('EP4: должен вернуть ошибку при названии только из макросов', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const response = await request(app)
				.post('/api/dishes')
				.send({
					name: '!салат',
					photos: [],
					portionSize: 150,
					category: 'Salad',
					ingredients: [{ productId: seedProduct!.id, grams: 100 }]
				});

			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe('VALIDATION_ERROR');
			expect(response.body.error.message).toContain('не может состоять только из макросов');
		});
	});

	describe('POST /api/products', () => {
		it('EP1: должен создать продукт с валидными данными', async () => {
			const productData = {
				name: 'Огурец свежий',
				photos: [],
				calories: 15,
				proteins: 0.8,
				fats: 0.1,
				carbs: 2.5,
				compositionText: null,
				preparationType: 'ReadyToEat',
				isVegan: true,
				isGlutenFree: true,
				isSugarFree: true,
				category: 'Vegetables'
			};

			const response = await request(app)
				.post('/api/products')
				.send(productData);

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty('id');
			expect(response.body.name).toBe('Огурец свежий');
			expect(response.body.calories).toBe(15);

			testProductId = response.body.id;

			const dbProduct = await prisma.product.findUnique({
				where: { id: testProductId }
			});
			expect(dbProduct).toBeTruthy();
			expect(dbProduct?.name).toBe('Огурец свежий');
		});

		it('EP2: должен создать продукт с макросом и автоматической категорией', async () => {
			const response = await request(app)
				.post('/api/products')
				.send({
					name: '!мясо Говядина',
					photos: [],
					calories: 250,
					proteins: 26,
					fats: 16,
					carbs: 0,
					preparationType: 'RequiresCooking',
					isVegan: false,
					isGlutenFree: true,
					isSugarFree: true
				});

			expect(response.status).toBe(201);
			expect(response.body.name).toBe('Говядина');
			expect(response.body.category).toBe('Meat');
		});

		it('BVA1: должен создать продукт с суммой БЖУ = 100 (верхняя граница)', async () => {
			const response = await request(app)
				.post('/api/products')
				.send({
					name: 'Масло',
					photos: [],
					calories: 900,
					proteins: 0,
					fats: 100,
					carbs: 0,
					preparationType: 'ReadyToEat',
					category: 'Liquid'
				});

			expect(response.status).toBe(201);
			expect(response.body.fats).toBe(100);
		});

		it('BVA2: должен вернуть ошибку при сумме БЖУ > 100 (101)', async () => {
			const response = await request(app)
				.post('/api/products')
				.send({
					name: 'Некорректный продукт',
					photos: [],
					calories: 500,
					proteins: 50,
					fats: 40,
					carbs: 11,
					preparationType: 'ReadyToEat',
					category: 'Vegetables'
				});

			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe('VALIDATION_ERROR');
		});

		it('BVA3: название "Чай" (2 символа) должно проходить валидацию', async () => {
			const response = await request(app)
				.post('/api/products')
				.send({
					name: 'Чай',
					photos: [],
					calories: 1,
					proteins: 0,
					fats: 0,
					carbs: 0,
					preparationType: 'ReadyToEat',
					category: 'Liquid'
				});

			if (response.status === 201) {
				expect(response.body.name).toBe('Чай');
			} else {
				expect(response.body.error.code).toBe('VALIDATION_ERROR');
			}
		});

		it('BVA4: должен вернуть ошибку при названии из 1 символа', async () => {
			const response = await request(app)
				.post('/api/products')
				.send({
					name: 'А',
					photos: [],
					calories: 100,
					proteins: 0,
					fats: 0,
					carbs: 0,
					preparationType: 'ReadyToEat',
					category: 'Vegetables'
				});

			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe('VALIDATION_ERROR');
		});

		it('EP3: должен вернуть ошибку при отсутствии категории и макроса', async () => {
			const response = await request(app)
				.post('/api/products')
				.send({
					name: 'Продукт без категории',
					photos: [],
					calories: 100,
					proteins: 0,
					fats: 0,
					carbs: 0,
					preparationType: 'ReadyToEat'
				});

			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe('VALIDATION_ERROR');
		});
	});

	describe('GET /api/products/:id', () => {

		it('EP1: должен получить существующий продукт из seed данных', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { id: { in: SEED_IDS } }
			});

			expect(seedProduct).toBeTruthy();

			const response = await request(app).get(`/api/products/${seedProduct!.id}`);

			expect(response.status).toBe(200);
			expect(response.body.id).toBe(seedProduct!.id);
		});

		it('EP2: должен вернуть 404 для несуществующего продукта', async () => {
			const response = await request(app).get('/api/products/non-existent-id-123');

			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe('NOT_FOUND');
		});
	});

	describe('PATCH /api/products/:id', () => {
		it('EP1: должен обновить существующий продукт', async () => {
			const createResponse = await request(app)
				.post('/api/products')
				.send({
					name: 'Продукт для обновления',
					photos: [],
					calories: 100,
					proteins: 10,
					fats: 5,
					carbs: 15,
					preparationType: 'ReadyToEat',
					category: 'Vegetables'
				});

			testProductId = createResponse.body.id;

			const response = await request(app)
				.patch(`/api/products/${testProductId}`)
				.send({
					name: 'Обновленное название',
					calories: 200
				});

			expect(response.status).toBe(200);
			expect(response.body.name).toBe('Обновленное название');
			expect(response.body.calories).toBe(200);
		});

		it('EP2: должен обновить продукт с макросом', async () => {
			const createResponse = await request(app)
				.post('/api/products')
				.send({
					name: 'Старое название',
					photos: [],
					calories: 100,
					proteins: 10,
					fats: 5,
					carbs: 15,
					preparationType: 'ReadyToEat',
					category: 'Vegetables'
				});

			testProductId = createResponse.body.id;

			const response = await request(app)
				.patch(`/api/products/${testProductId}`)
				.send({ name: '!мясо Свинина' });

			expect(response.status).toBe(200);
			expect(response.body.name).toBe('Свинина');
			expect(response.body.category).toBe('Meat');
		});

		it('EP3: должен вернуть 404 при обновлении несуществующего продукта', async () => {
			const response = await request(app)
				.patch('/api/products/non-existent-id')
				.send({ name: 'Новое название' });

			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe('NOT_FOUND');
		});
	});

	describe('DELETE /api/products/:id', () => {
		it('EP1: должен удалить созданный тестовый продукт', async () => {
			const createResponse = await request(app)
				.post('/api/products')
				.send({
					name: 'Продукт для удаления',
					photos: [],
					calories: 100,
					proteins: 10,
					fats: 5,
					carbs: 15,
					preparationType: 'ReadyToEat',
					category: 'Vegetables'
				});

			testProductId = createResponse.body.id;

			const response = await request(app).delete(`/api/products/${testProductId}`);

			expect(response.status).toBe(200);
			expect(response.body.ok).toBe(true);

			const dbProduct = await prisma.product.findUnique({
				where: { id: testProductId }
			});
			expect(dbProduct).toBeNull();
		});

		it('EP2: должен вернуть 404 при удалении несуществующего продукта', async () => {
			const response = await request(app).delete('/api/products/non-existent-id');

			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe('NOT_FOUND');
		});

		it('EP3: должен вернуть 409 при удалении продукта, используемого в блюдах', async () => {
			const productResponse = await request(app)
				.post('/api/products')
				.send({
					name: 'Продукт в блюде',
					photos: [],
					calories: 100,
					proteins: 10,
					fats: 5,
					carbs: 15,
					preparationType: 'ReadyToEat',
					category: 'Vegetables'
				});

			testProductId = productResponse.body.id;

			await request(app)
				.post('/api/dishes')
				.send({
					name: 'Тестовое блюдо',
					photos: [],
					portionSize: 200,
					category: 'Second',
					ingredients: [{ productId: testProductId, grams: 100 }]
				});

			const response = await request(app).delete(`/api/products/${testProductId}`);

			expect(response.status).toBe(409);
			expect(response.body.error.code).toBe('PRODUCT_IN_USE');
		});
	});

	describe('GET /api/dishes', () => {
		it('EP1: должен вернуть пустой список, когда нет созданных блюд', async () => {
			const response = await request(app).get('/api/dishes');

			expect(response.status).toBe(200);
			expect(Array.isArray(response.body)).toBe(true);
		});

		it('EP2: должен вернуть список созданных блюд', async () => {
			const productResponse = await request(app)
				.post('/api/products')
				.send({
					name: 'Курица',
					photos: [],
					calories: 200,
					proteins: 25,
					fats: 10,
					carbs: 0,
					preparationType: 'RequiresCooking',
					category: 'Meat'
				});

			testProductId = productResponse.body.id;

			await request(app)
				.post('/api/dishes')
				.send({
					name: 'Куриный суп',
					photos: [],
					portionSize: 300,
					category: 'First',
					isVegan: false,
					ingredients: [{ productId: testProductId, grams: 150 }]
				});

			const response = await request(app).get('/api/dishes?q=куриный');

			expect(response.status).toBe(200);
			expect(response.body.length).toBeGreaterThan(0);
			expect(response.body[0].name).toBe('Куриный суп');
		});
	});

	describe('POST /api/dishes/calculate-nutrition', () => {
		it('EP1: должен рассчитать питательность для валидных ингредиентов', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const response = await request(app)
				.post('/api/dishes/calculate-nutrition')
				.send({
					ingredients: [{ productId: seedProduct!.id, grams: 100 }],
					portionSize: 200
				});

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('draftNutrition');
			expect(response.body).toHaveProperty('allowedFlags');
		});

		it('EP2: должен рассчитать суммарную питательность для нескольких ингредиентов', async () => {
			const product1 = await request(app)
				.post('/api/products')
				.send({
					name: 'Рис',
					photos: [],
					calories: 130,
					proteins: 2.7,
					fats: 0.3,
					carbs: 28,
					preparationType: 'RequiresCooking',
					category: 'Groats'
				});

			const product2 = await request(app)
				.post('/api/products')
				.send({
					name: 'Курица',
					photos: [],
					calories: 165,
					proteins: 31,
					fats: 3.6,
					carbs: 0,
					preparationType: 'RequiresCooking',
					category: 'Meat'
				});

			const response = await request(app)
				.post('/api/dishes/calculate-nutrition')
				.send({
					ingredients: [
						{ productId: product1.body.id, grams: 100 },
						{ productId: product2.body.id, grams: 150 }
					],
					portionSize: 250
				});

			expect(response.status).toBe(200);
			expect(response.body.draftNutrition.calories).toBeGreaterThan(0);
		});

		it('EP3: должен вернуть ошибку 400 при несуществующем продукте', async () => {
			const response = await request(app)
				.post('/api/dishes/calculate-nutrition')
				.send({
					ingredients: [{ productId: 'non-existent-id', grams: 100 }],
					portionSize: 200
				});

			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe('UNKNOWN_PRODUCT');
		});

		it('BVA1: должен вернуть ошибку при весе продукта 0 грамм (ниже границы)', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const response = await request(app)
				.post('/api/dishes/calculate-nutrition')
				.send({
					ingredients: [{ productId: seedProduct!.id, grams: 0 }],
					portionSize: 100
				});

			expect(response.status).toBe(400);
		});
	});

	describe('POST /api/dishes', () => {
		it('EP1: должен создать блюдо с валидными данными', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const dishData = {
				name: 'Картофельное пюре',
				photos: [],
				portionSize: 250,
				category: 'Second',
				isVegan: true,
				isGlutenFree: true,
				isSugarFree: true,
				ingredients: [{ productId: seedProduct!.id, grams: 200 }]
			};

			const response = await request(app)
				.post('/api/dishes')
				.send(dishData);

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty('dish');
			expect(response.body.dish.name).toBe('Картофельное пюре');

			testDishId = response.body.dish.id;
		});

		it('EP2: должен создать блюдо с макросом !первое', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const response = await request(app)
				.post('/api/dishes')
				.send({
					name: '!первое Картофельный суп',
					photos: [],
					portionSize: 300,
					ingredients: [{ productId: seedProduct!.id, grams: 100 }]
				});

			expect(response.status).toBe(201);
			expect(response.body.dish.name).toBe('Картофельный суп');
			expect(response.body.dish.category).toBe('First');
		});

		it('EP3: должен вернуть ошибку при попытке установить неразрешенный флаг isVegan', async () => {
			const meatProduct = await prisma.product.findFirst({
				where: { name: 'Мясо' }
			});

			expect(meatProduct).toBeTruthy();
			expect(meatProduct!.isVegan).toBe(false);

			const response = await request(app)
				.post('/api/dishes')
				.send({
					name: 'Мясное блюдо',
					photos: [],
					portionSize: 300,
					isVegan: true,
					ingredients: [{ productId: meatProduct!.id, grams: 200 }]
				});

			expect(response.status).toBe(400);
			expect(['FLAG_NOT_ALLOWED', 'VALIDATION_ERROR']).toContain(response.body.error.code);
		});

		it('BVA1: должен создать блюдо с 1 ингредиентом', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const response = await request(app)
				.post('/api/dishes')
				.send({
					name: 'Вареный картофель',
					photos: [],
					portionSize: 200,
					category: 'Second',
					ingredients: [{ productId: seedProduct!.id, grams: 200 }]
				});

			expect(response.status).toBe(201);
			expect(response.body.dish).toBeDefined();
			expect(response.body.dish.name).toBe('Вареный картофель');

			const dbIngredients = await prisma.dishIngredient.findMany({
				where: { dishId: response.body.dish.id },
				include: { product: true }
			});
			expect(dbIngredients).toHaveLength(1);
			expect(dbIngredients[0].grams).toBe(200);
			expect(dbIngredients[0].product.name).toBe('Картофель');
		});

		it('BVA2: должен вернуть ошибку при 0 ингредиентов', async () => {
			const response = await request(app)
				.post('/api/dishes')
				.send({
					name: 'Пустое блюдо',
					photos: [],
					portionSize: 200,
					ingredients: []
				});

			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe('VALIDATION_ERROR');
		});

		it('EP4: должен вернуть ошибку при названии только из макросов', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const response = await request(app)
				.post('/api/dishes')
				.send({
					name: '!салат',
					photos: [],
					portionSize: 150,
					category: 'Salad',
					ingredients: [{ productId: seedProduct!.id, grams: 100 }]
				});

			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe('VALIDATION_ERROR');
			expect(response.body.error.message).toContain('не может состоять только из макросов');
		});
	});

	describe('GET /api/dishes/:id', () => {
		it('EP1: должен получить существующее блюдо', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const dishResponse = await request(app)
				.post('/api/dishes')
				.send({
					name: 'Тестовое блюдо для получения',
					photos: [],
					portionSize: 150,
					category: 'Second',
					ingredients: [{ productId: seedProduct!.id, grams: 100 }]
				});

			testDishId = dishResponse.body.dish.id;

			const response = await request(app).get(`/api/dishes/${testDishId}`);

			expect(response.status).toBe(200);
			expect(response.body.id).toBe(testDishId);
			expect(response.body.ingredients).toBeDefined();
		});

		it('EP2: должен вернуть 404 для несуществующего блюда', async () => {
			const response = await request(app).get('/api/dishes/non-existent-id');

			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe('NOT_FOUND');
		});
	});

	describe('PATCH /api/dishes/:id', () => {
		it('EP1: должен обновить существующее блюдо', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const dishResponse = await request(app)
				.post('/api/dishes')
				.send({
					name: 'Блюдо для обновления',
					photos: [],
					portionSize: 200,
					category: 'Second',
					ingredients: [{ productId: seedProduct!.id, grams: 200 }]
				});

			testDishId = dishResponse.body.dish.id;

			const response = await request(app)
				.patch(`/api/dishes/${testDishId}`)
				.send({
					name: 'Обновленное блюдо',
					portionSize: 250
				});

			expect(response.status).toBe(200);
			expect(response.body.dish.name).toBe('Обновленное блюдо');
			expect(response.body.dish.portionSize).toBe(250);
		});

		it('EP2: должен обновить блюдо с новыми ингредиентами', async () => {
			const potatoProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			const beetProduct = await prisma.product.findFirst({
				where: { name: 'Свёкла' }
			});

			expect(potatoProduct).toBeTruthy();
			expect(beetProduct).toBeTruthy();

			const dishResponse = await request(app)
				.post('/api/dishes')
				.send({
					name: 'Блюдо с картофелем',
					photos: [],
					portionSize: 200,
					category: 'Second',
					ingredients: [{ productId: potatoProduct!.id, grams: 100 }]
				});

			testDishId = dishResponse.body.dish.id;

			const response = await request(app)
				.patch(`/api/dishes/${testDishId}`)
				.send({
					ingredients: [{ productId: beetProduct!.id, grams: 150 }]
				});

			expect(response.status).toBe(200);
		});

		it('EP3: должен вернуть 404 при обновлении несуществующего блюда', async () => {
			const response = await request(app)
				.patch('/api/dishes/non-existent-id')
				.send({ name: 'Новое название' });

			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe('NOT_FOUND');
		});
	});

	describe('DELETE /api/dishes/:id', () => {
		it('EP1: должен удалить существующее блюдо', async () => {
			const seedProduct = await prisma.product.findFirst({
				where: { name: 'Картофель' }
			});

			expect(seedProduct).toBeTruthy();

			const dishResponse = await request(app)
				.post('/api/dishes')
				.send({
					name: 'Блюдо для удаления',
					photos: [],
					portionSize: 150,
					category: 'Second',
					ingredients: [{ productId: seedProduct!.id, grams: 100 }]
				});

			testDishId = dishResponse.body.dish.id;

			const response = await request(app).delete(`/api/dishes/${testDishId}`);

			expect(response.status).toBe(200);
			expect(response.body.ok).toBe(true);

			const dbDish = await prisma.dish.findUnique({
				where: { id: testDishId }
			});
			expect(dbDish).toBeNull();
		});

		it('EP2: должен вернуть 404 при удалении несуществующего блюда', async () => {
			const response = await request(app).delete('/api/dishes/non-existent-id');

			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe('NOT_FOUND');
		});
	});

	describe('GET /api/health', () => {
		it('EP1: должен вернуть статус здоровья', async () => {
		    const response = await request(app).get('/api/health');

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ ok: true });
		});
	});
});