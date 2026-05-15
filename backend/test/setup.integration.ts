import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://recipe:recipe@127.0.0.1:5432/recipebook?schema=public';
}

import { prisma } from '../src/db';

let isSetupComplete = false;
let transactionActive = false;

beforeAll(async () => {
  if (isSetupComplete) {
    console.log('Сетап уже выполнен, пропускаем...');
    return;
  }

  console.log('Настройка реальной БД для тестов...');
  
  const backendDir = process.cwd();
  
  try {
    console.log('Применяем миграции...');
    const migrateOutput = execSync('npx prisma migrate deploy', {
      cwd: backendDir,
      stdio: 'pipe'
    });
    console.log(migrateOutput.toString().trim());
    console.log('Миграции применены');
    
    const productCount = await prisma.product.count();
    console.log(`Продуктов в БД: ${productCount}`);
    
    if (productCount === 0) {
      console.log('Запускаем сиды...');
      const seedOutput = execSync('npx tsx prisma/seed.ts', {
        cwd: backendDir,
        stdio: 'pipe'
      });
      console.log(seedOutput.toString().trim());
      
      const finalProductCount = await prisma.product.count();
      console.log(`Продуктов в БД: ${finalProductCount}`);
    }
    
    isSetupComplete = true;
    console.log('БД готова для тестов');
    
  } catch (error: any) {
    console.error('Ошибка при настройке БД:', error.message);
    if (error.stdout) console.log('stdout:', error.stdout.toString());
    if (error.stderr) console.log('stderr:', error.stderr.toString());
    throw error;
  }
}, 60000);

beforeEach(async () => {
  try {
    await prisma.$executeRaw`BEGIN;`;
    transactionActive = true;
  } catch (e) {
    console.error('Ошибка при начале транзакции:', e);
    transactionActive = false;
    throw e;
  }
});

afterEach(async () => {
  if (!transactionActive) {
    console.warn('Транзакция не активна, пропускаем ROLLBACK');
    return;
  }
  
  try {
    await prisma.$executeRaw`ROLLBACK;`;
    transactionActive = false;
  } catch (e) {
    console.warn('Ошибка при откате транзакции:', e);
    transactionActive = false;
  }
});

afterAll(async () => {
  console.log('Завершение работы');
  await prisma.$disconnect();
});