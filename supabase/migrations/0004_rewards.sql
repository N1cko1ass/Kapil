-- Этап 4: обмен баллов на награду.
--
-- Списание баллов и генерация promo_code сделаны одной атомарной SECURITY DEFINER
-- функцией вместо client-side "update points, потом insert redemption": иначе клиент
-- мог бы сам решать, сколько баллов списать (RLS "users update self" разрешает
-- редактировать свою строку без проверки конкретных колонок), и/или гонка при двойном
-- клике позволила бы обменять одни и те же баллы дважды.

create or replace function public.redeem_reward(p_reward_id uuid)
returns table (redemption_id uuid, promo_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost int;
  v_active bool;
  v_points int;
  v_code text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Требуется авторизация';
  end if;

  select points_cost, active into v_cost, v_active from rewards where id = p_reward_id;
  if v_cost is null then
    raise exception 'Награда не найдена';
  end if;
  if not v_active then
    raise exception 'Награда сейчас недоступна';
  end if;

  select points_total into v_points from users where id = auth.uid();
  if v_points < v_cost then
    raise exception 'Недостаточно баллов';
  end if;

  v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  update users set points_total = points_total - v_cost where id = auth.uid();

  insert into redemptions (user_id, reward_id, promo_code, status)
  values (auth.uid(), p_reward_id, v_code, 'issued')
  returning id into v_id;

  return query select v_id, v_code;
end;
$$;

revoke execute on function public.redeem_reward(uuid) from public;
grant execute on function public.redeem_reward(uuid) to authenticated;
