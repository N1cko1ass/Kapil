-- Kepil MVP — начальная схема БД
-- Соответствует разделу 3 тех.спецификации (docs/Kepil_tech_spec.docx).
--
-- Два отклонения от точного текста спецификации, оба минимальны и не вводят новых
-- сущностей — только колонки, необходимые, чтобы уже описанные в спеке экраны/эндпоинты
-- (раздел 6 API, GET /reports?city=; раздел 5 экранов, «Кабинет партнёра») были реализуемы:
--   1) reports.city         — нужен для фильтра GET /reports?city=
--   2) partners.owner_user_id — связывает партнёра с его аккаунтом (role='partner') для RLS
--      в «Кабинете партнёра».
-- Если это нежелательно — сообщите, уберём/переделаем перед следующим этапом.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 3.2 teams
-- ---------------------------------------------------------------------------
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  points_total int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.1 users (профиль поверх auth.users)
-- ---------------------------------------------------------------------------
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  city text,
  team_id uuid references teams (id) on delete set null,
  role text not null default 'citizen'
    check (role in ('citizen', 'volunteer_raider', 'partner', 'moderator', 'admin')),
  points_total int not null default 0,
  level int not null default 1,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.3 reports
-- ---------------------------------------------------------------------------
create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  category text not null check (category in ('litter', 'oil', 'wildlife')),
  subcategory text,
  photo_url text,
  lat float8 not null,
  lng float8 not null,
  city text,
  description text,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'verified', 'rejected')),
  ai_confidence float4,
  ai_label text,
  points_awarded int not null default 0,
  verified_by uuid references users (id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_status_idx on reports (status);
create index reports_category_idx on reports (category);
create index reports_city_idx on reports (city);

-- ---------------------------------------------------------------------------
-- 3.4 events (акции/уборки)
-- ---------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('official', 'user')),
  creator_id uuid not null references users (id),
  city text,
  lat float8,
  lng float8,
  date_time timestamptz not null,
  description text,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.5 event_participants
-- ---------------------------------------------------------------------------
create table event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  before_photo_url text,
  after_photo_url text,
  ai_estimated_volume float4,
  points_awarded int not null default 0,
  status text not null default 'joined' check (status in ('joined', 'confirmed')),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 3.6 partners / rewards / redemptions
-- ---------------------------------------------------------------------------
create table partners (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references users (id),
  name text not null,
  city text,
  contact text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table rewards (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners (id) on delete cascade,
  title text not null,
  description text,
  points_cost int not null,
  city text,
  active bool not null default true,
  created_at timestamptz not null default now()
);

create table redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  reward_id uuid not null references rewards (id),
  promo_code text not null,
  status text not null default 'issued' check (status in ('issued', 'used')),
  redeemed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.7 volunteer_raiders
-- Платформа НЕ присваивает статус «понятого» — только готовность и контакт.
-- ---------------------------------------------------------------------------
create table volunteer_raiders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  phone text not null,
  region text,
  availability bool not null default false,
  verified bool not null default false,
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- ---------------------------------------------------------------------------
-- 3.8 badges / user_badges
-- ---------------------------------------------------------------------------
create table badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  criteria jsonb
);

create table user_badges (
  user_id uuid not null references users (id) on delete cascade,
  badge_id uuid not null references badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table teams enable row level security;
alter table users enable row level security;
alter table reports enable row level security;
alter table events enable row level security;
alter table event_participants enable row level security;
alter table partners enable row level security;
alter table rewards enable row level security;
alter table redemptions enable row level security;
alter table volunteer_raiders enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;

-- helper: роль текущего пользователя
create or replace function current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from users where id = auth.uid();
$$;

create or replace function is_moderator_or_admin()
returns boolean
language sql
stable
as $$
  select current_user_role() in ('moderator', 'admin');
$$;

-- teams: публичный каталог для рейтинга; изменения — только admin
create policy "teams select all" on teams for select using (true);
create policy "teams admin write" on teams for all
  using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- users: публичный каталог (для рейтинга/профилей) на select; каждый правит только себя
create policy "users select all" on users for select using (true);
create policy "users insert self" on users for insert with check (auth.uid() = id);
create policy "users update self" on users for update using (auth.uid() = id);
create policy "users admin update" on users for update using (current_user_role() = 'admin');

-- reports: карта публична для всех статусов; создаёт — владелец; подтверждает — модератор/admin
create policy "reports select all" on reports for select using (true);
create policy "reports insert own" on reports for insert with check (auth.uid() = user_id);
create policy "reports update own pending" on reports for update
  using (auth.uid() = user_id and status = 'pending_review');
create policy "reports moderate" on reports for update using (is_moderator_or_admin());

-- events: список публичен; официальные создаёт только admin, пользовательские — любой citizen+
create policy "events select all" on events for select using (true);
create policy "events insert user" on events for insert
  with check (
    auth.uid() = creator_id
    and (type = 'user' or current_user_role() = 'admin')
  );
create policy "events update own or admin" on events for update
  using (auth.uid() = creator_id or current_user_role() = 'admin');

-- event_participants: участник видит/создаёт свою запись, остальные видят публично для акции
create policy "event_participants select all" on event_participants for select using (true);
create policy "event_participants insert own" on event_participants for insert
  with check (auth.uid() = user_id);
create policy "event_participants update own" on event_participants for update
  using (auth.uid() = user_id);
create policy "event_participants confirm" on event_participants for update
  using (is_moderator_or_admin());

-- partners: каталог публичен; управляет только владелец-партнёр или admin
create policy "partners select all" on partners for select using (true);
create policy "partners owner write" on partners for all
  using (owner_user_id = auth.uid() or current_user_role() = 'admin')
  with check (owner_user_id = auth.uid() or current_user_role() = 'admin');

-- rewards: активные — публичный каталог; CRUD — владелец связанного партнёра или admin
create policy "rewards select all" on rewards for select using (true);
create policy "rewards partner write" on rewards for all
  using (
    current_user_role() = 'admin'
    or exists (select 1 from partners p where p.id = partner_id and p.owner_user_id = auth.uid())
  )
  with check (
    current_user_role() = 'admin'
    or exists (select 1 from partners p where p.id = partner_id and p.owner_user_id = auth.uid())
  );

-- redemptions: видит владелец редемпшена, партнёр награды и admin
create policy "redemptions select own" on redemptions for select
  using (
    auth.uid() = user_id
    or current_user_role() = 'admin'
    or exists (
      select 1 from rewards r join partners p on p.id = r.partner_id
      where r.id = reward_id and p.owner_user_id = auth.uid()
    )
  );
create policy "redemptions insert own" on redemptions for insert with check (auth.uid() = user_id);
create policy "redemptions partner update" on redemptions for update
  using (
    current_user_role() = 'admin'
    or exists (
      select 1 from rewards r join partners p on p.id = r.partner_id
      where r.id = reward_id and p.owner_user_id = auth.uid()
    )
  );

-- volunteer_raiders: приватно — видит сам волонтёр и модератор/admin (координация рейдов)
create policy "volunteer_raiders select own or staff" on volunteer_raiders for select
  using (auth.uid() = user_id or is_moderator_or_admin());
create policy "volunteer_raiders insert own" on volunteer_raiders for insert
  with check (auth.uid() = user_id);
create policy "volunteer_raiders update own or staff" on volunteer_raiders for update
  using (auth.uid() = user_id or is_moderator_or_admin());

-- badges: публичный каталог; изменяет только admin
create policy "badges select all" on badges for select using (true);
create policy "badges admin write" on badges for all
  using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- user_badges: публично видно (для профиля/рейтинга); начисляет только admin/сервис
create policy "user_badges select all" on user_badges for select using (true);
create policy "user_badges admin write" on user_badges for all
  using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Storage: bucket для фото репортов (публичное чтение, запись — авторизованным)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

create policy "report-photos public read" on storage.objects for select
  using (bucket_id = 'report-photos');
create policy "report-photos authenticated upload" on storage.objects for insert
  with check (bucket_id = 'report-photos' and auth.role() = 'authenticated');
