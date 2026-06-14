# CLAUDE.md

Guidance for working in this repository.

## Проект
FamilyShopList — PWA для семьи: общий список покупок + вишлист.
Полностью бесплатно (Firebase Spark, без карты), один код для Android и iPhone.

## Требования
Все требования к продукту — в [REQUIREMENTS.md](REQUIREMENTS.md).
ВАЖНО: при любом изменении логики приложения СНАЧАЛА обновляй REQUIREMENTS.md,
затем код. Документ — источник истины по фичам.

## Стек
React 19 + TypeScript · Vite · vite-plugin-pwa · Tailwind CSS v3 ·
React Router · Firebase (Firestore + Auth) · react-firebase-hooks.

## Команды
- `npm run dev` — дев-сервер (http://localhost:5173)
- `npm run build` — типчек + продакшен-сборка
- `npm run preview` — предпросмотр сборки

## Структура
- `src/components/` — переиспользуемые компоненты (Layout и т.п.)
- `src/pages/` — экраны (ShoppingListPage, WishlistPage)
- `src/lib/firebase.ts` — инициализация Firebase из VITE_FIREBASE_* (env)
- `src/hooks/` — хуки (useAuthUser и др.)
- `src/types/` — типы данных

## Firebase
Конфиг читается из `.env` (см. `.env.example`). `.env` в .gitignore — не коммитить.
Cloud Functions НЕ используем (план Spark) — логика на клиенте + правила Firestore.

## Git
Локальный репозиторий, без удалёнок. Не пушить и не добавлять remote без явной просьбы.
