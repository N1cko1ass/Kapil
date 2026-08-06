# Kepil — гражданская экоплатформа Каспия

Веб-приложение геймификации экоактивности для Caspian Hackathon 2026. Подробности — в [CLAUDE.md](CLAUDE.md), тех.спецификация и бизнес-план — в [docs/](docs).

## Стек

React + Vite + Tailwind CSS · Leaflet/OpenStreetMap · Supabase (Postgres, Auth, Storage) · Vercel

## Быстрый старт

### 1. Создать проект Supabase

1. Зайдите на [supabase.com](https://supabase.com) → New project.
2. Дождитесь инициализации, затем откройте **SQL Editor**.
3. По очереди выполните файлы из `supabase/migrations/` (сначала `0001_init.sql`, затем `0002_user_profile_trigger.sql`):
   - `0001_init.sql` — создаёт все таблицы, RLS-политики и Storage bucket `report-photos`.
   - `0002_user_profile_trigger.sql` — триггер, который создаёт строку в `public.users` автоматически при регистрации (`auth.users` → `public.users`). Без него профиль не создастся: сразу после `signUp()` (пока email не подтверждён) у клиента ещё нет сессии, и insert от анонимного пользователя не пройдёт RLS.
   - Если у вас установлен [Supabase CLI](https://supabase.com/docs/guides/cli), можно вместо этого выполнить:
     ```bash
     supabase link --project-ref <ваш-project-ref>
     supabase db push
     ```
4. В **Authentication → Providers** убедитесь, что включён **Email** (по умолчанию включён). Для ускорения тестирования на хакатоне рекомендуем отключить подтверждение email, чтобы после регистрации сразу открывалась сессия: **Authentication → Providers → Email → Confirm email → выкл**. Если оставить включённым — приложение покажет «Проверьте почту» и попросит подтвердить письмо перед входом.
5. В **Project Settings → API** скопируйте `Project URL` и `anon public` key.

### 2. Настроить .env

```bash
cp .env.example .env
```

Вставьте в `.env` значения из шага выше:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Установить зависимости и запустить

```bash
npm install
npm run dev
```

Откройте `http://localhost:5173`.

### 4. Проверить, что всё работает

1. На главной должна открыться карта Актау (без авторизации).
2. Зарегистрируйте аккаунт (Регистрация → email/пароль/город) — создастся строка в `auth.users` и `public.users`.
3. Нажмите «+ Создать репорт», разрешите геолокацию или отметьте точку на карте, прикрепите фото, отправьте.
4. Репорт должен появиться на карте и в ленте со статусом «На проверке».

### 5. Деплой на Vercel

1. Импортируйте репозиторий на [vercel.com](https://vercel.com/new).
2. Framework preset — Vite (определится автоматически).
3. В **Environment Variables** добавьте `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
4. Deploy.

## Структура проекта

```
src/
  components/   переиспользуемые UI-компоненты (карта, навбар, карточка репорта)
  context/      AuthContext — сессия и профиль пользователя
  hooks/        хуки для загрузки данных (репорты и т.д.)
  lib/          supabase-клиент, константы (категории, статусы)
  pages/        страницы-роуты
supabase/
  migrations/   SQL-схема и RLS-политики
docs/           тех.спецификация и бизнес-план (.docx)
```

## Статус сборки

- ✅ Этап 1 — инфраструктура (проект, схема БД, RLS, инструкция по деплою)
- ✅ Этап 2 — репорты и карта (форма создания, загрузка фото, публичная карта, лента)
- ⬜ Этап 3 — геймификация (баллы, профиль, рейтинг, значки)
- ⬜ Этап 4 — награды и партнёры
- ⬜ Этап 5 — акции
- ⬜ Этап 6 — AI-слой
- ⬜ Этап 7 — модерация, демо-данные, полировка
