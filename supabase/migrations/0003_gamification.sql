-- Этап 3: начисление баллов, уровни, значки.
--
-- Веса — раздел 4 тех.спецификации. Формула: points_awarded = base_weight × ai_confidence,
-- где ai_confidence появится в Этапе 6 (AI-классификация); пока это поле пустое, множитель = 1.
-- Уровень — простая формула (100 баллов = 1 уровень), в спеке формула не задана явно.
--
-- Модерации (Этап 7) ещё нет как полноценной панели, поэтому баллы начисляются при любом
-- переходе reports.status -> 'verified' (сейчас это делает точечная кнопка на карточке
-- репорта для moderator/admin, см. ReportDetail.jsx — временная заглушка до Этапа 7).

create or replace function public.points_for_category(p_category text)
returns int
language sql
immutable
as $$
  select case p_category
    when 'litter' then 10
    when 'oil' then 30
    when 'wildlife' then 40
    else 0
  end;
$$;

-- BEFORE UPDATE: вычисляет баллы репорта при подтверждении/отклонении
create or replace function public.report_before_update_points()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'verified' and old.status is distinct from 'verified' then
    new.points_awarded := round(points_for_category(new.category) * coalesce(new.ai_confidence, 1));
    new.verified_at := coalesce(new.verified_at, now());
    new.verified_by := coalesce(new.verified_by, auth.uid());
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    new.points_awarded := 0;
    new.verified_at := coalesce(new.verified_at, now());
    new.verified_by := coalesce(new.verified_by, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists reports_before_update_points on reports;
create trigger reports_before_update_points
  before update on reports
  for each row execute function report_before_update_points();

-- Проверка и начисление значков (простые критерии по числу подтверждённых репортов / баллам)
create or replace function public.award_badges(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report_count int;
  v_points_total int;
  b record;
begin
  select count(*) into v_report_count from reports where user_id = p_user_id and status = 'verified';
  select points_total into v_points_total from users where id = p_user_id;

  for b in select * from badges loop
    if not exists (select 1 from user_badges where user_id = p_user_id and badge_id = b.id) then
      if (b.criteria ->> 'type' = 'report_count' and v_report_count >= (b.criteria ->> 'threshold')::int)
         or (b.criteria ->> 'type' = 'points_total' and v_points_total >= (b.criteria ->> 'threshold')::int)
      then
        insert into user_badges (user_id, badge_id) values (p_user_id, b.id);
      end if;
    end if;
  end loop;
end;
$$;

-- AFTER UPDATE: применяет дельту баллов к users/teams (security definer — модератор
-- по умолчанию не имеет права редактировать points_total чужого пользователя через RLS)
create or replace function public.report_after_update_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta int;
  v_team_id uuid;
  v_new_total int;
begin
  v_delta := coalesce(new.points_awarded, 0) * (case when new.status = 'verified' then 1 else 0 end)
           - coalesce(old.points_awarded, 0) * (case when old.status = 'verified' then 1 else 0 end);

  if v_delta <> 0 then
    update users
    set points_total = points_total + v_delta
    where id = new.user_id
    returning points_total, team_id into v_new_total, v_team_id;

    update users set level = floor(v_new_total / 100.0) + 1 where id = new.user_id;

    if v_team_id is not null then
      update teams set points_total = points_total + v_delta where id = v_team_id;
    end if;
  end if;

  if new.status = 'verified' and old.status is distinct from 'verified' then
    perform award_badges(new.user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists reports_after_update_points on reports;
create trigger reports_after_update_points
  after update on reports
  for each row execute function report_after_update_points();

-- Демо-набор значков с простыми критериями
insert into badges (name, description, icon, criteria) values
  ('Первый репорт', 'Отправлен и подтверждён первый репорт', '🌱', '{"type":"report_count","threshold":1}'),
  ('Активный житель', '10 подтверждённых репортов', '📸', '{"type":"report_count","threshold":10}'),
  ('Хранитель побережья', '25 подтверждённых репортов', '🛡️', '{"type":"report_count","threshold":25}'),
  ('Легенда Каспия', '500 баллов', '🏆', '{"type":"points_total","threshold":500}');
