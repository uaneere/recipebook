# Recipe Book

Репозиторий веб-приложения "Книга рецептов":
- `backend`: REST API на Node.js + TypeScript + Express + Prisma
- `frontend`: UI на React + Vite + TypeScript
- `db`: PostgreSQL

## 1) Требования

- Node.js 20+ (рекомендуется LTS)
- npm 10+
- PostgreSQL 15+  
  или Docker (для запуска БД через `docker-compose.yml`)

## 2) Установка

```bash
npm install
```

## 3) Настройка окружения

Создать env для backend:

```bash
cp backend/.env.example backend/.env
```

Проверить `backend/.env` (пример):

```env
DATABASE_URL="postgresql://recipe:recipe@localhost:5432/recipebook?schema=public"
PORT=3001
```

## 4) Поднять PostgreSQL

```bash
docker compose up -d
```

## 5) Миграции и сиды

Из папки `backend`:

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

## 6) Запуск приложения

Из корня репозитория:

```bash
npm run dev
```

По отдельности:

```bash
npm run dev:backend
npm run dev:frontend
```

Ожидаемые адреса:
- frontend: `http://localhost:5173`
- backend health: `http://localhost:3001/api/health`

## 7) Сборка

Из корня:

```bash
npm run build
```

## 8) Тесты

### Все тесты (backend + frontend)

```bash
npm run test
```

### Backend unit

```bash
cd backend
npm run test:unit
```

### Backend integration (без изоляции)
```bash
cd backend
npm run test:api
npm run test:integration
```

### Frontend e2e
В первом терминале:
```bash
NODE_ENV=test npm run dev:backend
```
Во втором терминале:
```bash
npm run test:e2e
```