-- Профиль public.users создаётся автоматически триггером на auth.users,
-- а не клиентским insert() после signUp(). Это нужно, потому что сразу после
-- signUp() (пока email не подтверждён) у клиента ещё нет сессии/JWT — insert
-- от имени anon не проходит RLS-политику "users insert self" (auth.uid() = id
-- в этот момент равен null). Триггер выполняется на стороне БД как superuser
-- и RLS не подвержен.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, city, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'city',
    'citizen'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
