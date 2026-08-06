-- Этап 5: акции (уборки) — начисление баллов за участие и организацию.
-- Веса — раздел 4 тех.спецификации:
--   Участие в акции (подтверждено фото до/после) — 25
--   Организация своей акции (после проведения и подтверждения) — 50

-- ---------------------------------------------------------------------------
-- Закрываем дыру из 0001: политика "event_participants update own" разрешала
-- участнику самому выставить status='confirmed' и начислить себе баллы без
-- модерации. Теперь участник может редактировать свою запись (например,
-- прикрепить фото до/после), только пока статус остаётся 'joined'; перевести
-- в 'confirmed' может только модератор/admin (политика "event_participants
-- confirm" уже существует).
-- ---------------------------------------------------------------------------
drop policy if exists "event_participants update own" on event_participants;
create policy "event_participants update own" on event_participants for update
  using (auth.uid() = user_id and status = 'joined')
  with check (auth.uid() = user_id and status = 'joined');

-- BEFORE UPDATE: баллы за подтверждённое участие
create or replace function public.event_participant_before_update_points()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    new.points_awarded := 25;
  end if;
  return new;
end;
$$;

drop trigger if exists event_participants_before_update_points on event_participants;
create trigger event_participants_before_update_points
  before update on event_participants
  for each row execute function event_participant_before_update_points();

-- AFTER UPDATE: перенос баллов участника в users/teams (security definer —
-- модератор не имеет прав редактировать points_total чужого пользователя)
create or replace function public.event_participant_after_update_points()
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
  v_delta := coalesce(new.points_awarded, 0) * (case when new.status = 'confirmed' then 1 else 0 end)
           - coalesce(old.points_awarded, 0) * (case when old.status = 'confirmed' then 1 else 0 end);

  if v_delta <> 0 then
    update users set points_total = points_total + v_delta
    where id = new.user_id
    returning points_total, team_id into v_new_total, v_team_id;

    update users set level = floor(v_new_total / 100.0) + 1 where id = new.user_id;

    if v_team_id is not null then
      update teams set points_total = points_total + v_delta where id = v_team_id;
    end if;
  end if;

  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    perform award_badges(new.user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists event_participants_after_update_points on event_participants;
create trigger event_participants_after_update_points
  after update on event_participants
  for each row execute function event_participant_after_update_points();

-- Бонус организатору: 50 баллов, когда акция помечена завершённой
-- (creator или admin — см. политику "events update own or admin" в 0001).
create or replace function public.event_after_update_organizer_bonus()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_new_total int;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update users set points_total = points_total + 50
    where id = new.creator_id
    returning points_total, team_id into v_new_total, v_team_id;

    update users set level = floor(v_new_total / 100.0) + 1 where id = new.creator_id;

    if v_team_id is not null then
      update teams set points_total = points_total + 50 where id = v_team_id;
    end if;

    perform award_badges(new.creator_id);
  end if;

  return new;
end;
$$;

drop trigger if exists events_after_update_organizer_bonus on events;
create trigger events_after_update_organizer_bonus
  after update on events
  for each row execute function event_after_update_organizer_bonus();

-- Storage: фото "до/после" для акций
insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

create policy "event-photos public read" on storage.objects for select
  using (bucket_id = 'event-photos');
create policy "event-photos authenticated upload" on storage.objects for insert
  with check (bucket_id = 'event-photos' and auth.role() = 'authenticated');
