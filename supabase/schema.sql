-- =====================================================================
-- Brian iPhones — esquema do banco (Supabase / Postgres)
-- Rodar uma vez no SQL Editor do Supabase (ou via CLI). É idempotente.
--
-- Modelo: cada tabela guarda o registro completo em `data` (jsonb), com as
-- colunas usadas em filtro, ordenação e segurança fora do json.
-- Segurança (RLS):
--   * visitante: lê produtos ativos e a configuração do site; cria pedido,
--     contato e visita só pelas funções abaixo (que validam tudo no servidor)
--   * admin (usuário logado no Supabase Auth): acesso total
-- =====================================================================

create extension if not exists pgcrypto;

-- quem é admin: qualquer usuário autenticado (o cadastro público fica desligado)
create or replace function public.is_admin() returns boolean
language sql stable as $$ select auth.role() = 'authenticated' $$;

-- ---------------------------------------------------------------- tabelas
create table if not exists public.products (
  id text primary key,
  slug text unique not null,
  active boolean not null default true,
  stock integer not null default 0,
  price numeric not null default 0,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id text primary key,
  number integer unique not null default nextval('public.order_number_seq'),
  status text not null default 'aguardando_pagamento',
  customer_email text not null,
  total numeric not null default 0,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_email_idx on public.orders (lower(customer_email));

create table if not exists public.leads (
  id text primary key,
  status text not null default 'novo',
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id text primary key,
  date timestamptz not null,
  data jsonb not null
);

create table if not exists public.expenses (
  id text primary key,
  date timestamptz not null,
  data jsonb not null
);

create table if not exists public.customers (
  email text primary key,
  data jsonb not null
);

create table if not exists public.visits (
  day text primary key,
  views integer not null default 0,
  visitors integer not null default 0,
  paths jsonb not null default '{}'::jsonb
);

-- configurações do site: 'settings' e 'storefront'
create table if not exists public.site_config (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.leads enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;
alter table public.customers enable row level security;
alter table public.visits enable row level security;
alter table public.site_config enable row level security;

do $$
declare t text;
begin
  foreach t in array array['products','orders','leads','sales','expenses','customers','visits','site_config'] loop
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format('create policy admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists public_read_products on public.products;
create policy public_read_products on public.products for select to anon using (active);

drop policy if exists public_read_config on public.site_config;
create policy public_read_config on public.site_config for select to anon using (true);

-- ---------------------------------------------------------------- funções públicas
-- Cria o pedido: preço vem do banco (não do navegador), confere e reserva estoque.
create or replace function public.place_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  it jsonb;
  p record;
  items jsonb := '[]'::jsonb;
  subtotal numeric := 0;
  ship jsonb := payload->'shipping';
  ship_price numeric := coalesce((payload->'shipping'->>'price')::numeric, 0);
  new_id text := replace(gen_random_uuid()::text, '-', '');
  num integer;
  now_ts timestamptz := now();
  rec jsonb;
begin
  if jsonb_array_length(coalesce(payload->'items', '[]'::jsonb)) = 0 then
    raise exception 'Pedido sem itens';
  end if;
  if coalesce(payload->'customer'->>'email', '') = '' then
    raise exception 'E-mail obrigatório';
  end if;

  for it in select * from jsonb_array_elements(payload->'items') loop
    select * into p from products where id = it->>'productId' and active for update;
    if not found then raise exception 'Produto indisponível: %', it->>'productId'; end if;
    if p.stock < (it->>'qty')::int or (it->>'qty')::int < 1 then
      raise exception 'Sem estoque suficiente para %', p.data->>'name';
    end if;
    update products
      set stock = stock - (it->>'qty')::int,
          data = jsonb_set(data, '{stock}', to_jsonb(stock - (it->>'qty')::int)),
          updated_at = now_ts
      where id = p.id;
    items := items || jsonb_build_object(
      'productId', p.id,
      'name', p.data->>'name',
      'detail', (p.data->>'storage') || ' · ' || (p.data->>'color'),
      'price', p.price,
      'qty', (it->>'qty')::int
    );
    subtotal := subtotal + p.price * (it->>'qty')::int;
  end loop;

  num := nextval('order_number_seq');
  rec := jsonb_build_object(
    'id', new_id,
    'number', num::text,
    'createdAt', to_jsonb(now_ts),
    'status', 'aguardando_pagamento',
    'customer', payload->'customer',
    'shipping', ship,
    'payment', payload->>'payment',
    'installments', coalesce((payload->>'installments')::int, 1),
    'items', items,
    'subtotal', subtotal,
    'total', subtotal + ship_price,
    'timeline', jsonb_build_array(jsonb_build_object('at', to_jsonb(now_ts), 'status', 'aguardando_pagamento', 'text', 'Pedido feito no site'))
  );
  insert into orders (id, number, status, customer_email, total, data, created_at)
    values (new_id, num, 'aguardando_pagamento', lower(payload->'customer'->>'email'), subtotal + ship_price, rec, now_ts);
  return rec;
end $$;

-- Página de confirmação: busca pelo id (aleatório, impossível de adivinhar)
create or replace function public.get_order(order_id text) returns jsonb
language sql security definer set search_path = public as $$
  select data from orders where id = order_id
$$;

-- "Meus pedidos": número + e-mail
create or replace function public.lookup_order(order_number text, email text) returns jsonb
language sql security definer set search_path = public as $$
  select data from orders where number::text = regexp_replace(order_number, '\D', '', 'g') and customer_email = lower(trim(email))
$$;

-- Contato pelo site (orçamento, troca, reparo)
create or replace function public.add_lead(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare rec jsonb;
begin
  rec := payload || jsonb_build_object('id', replace(gen_random_uuid()::text, '-', ''), 'createdAt', to_jsonb(now()), 'status', 'novo');
  insert into leads (id, status, data) values (rec->>'id', 'novo', rec);
  return rec;
end $$;

-- Contador de visitas
create or replace function public.track_visit(day_key text, path text, new_visitor boolean) returns void
language sql security definer set search_path = public as $$
  insert into visits (day, views, visitors, paths)
  values (day_key, 1, case when new_visitor then 1 else 0 end, jsonb_build_object(path, 1))
  on conflict (day) do update set
    views = visits.views + 1,
    visitors = visits.visitors + case when new_visitor then 1 else 0 end,
    paths = visits.paths || jsonb_build_object(path, coalesce((visits.paths->>path)::int, 0) + 1)
$$;

revoke all on function public.place_order(jsonb) from public;
revoke all on function public.get_order(text) from public;
revoke all on function public.lookup_order(text, text) from public;
revoke all on function public.add_lead(jsonb) from public;
revoke all on function public.track_visit(text, text, boolean) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.get_order(text) to anon, authenticated;
grant execute on function public.lookup_order(text, text) to anon, authenticated;
grant execute on function public.add_lead(jsonb) to anon, authenticated;
grant execute on function public.track_visit(text, text, boolean) to anon, authenticated;

-- ---------------------------------------------------------------- fotos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "fotos: leitura pública" on storage.objects;
create policy "fotos: leitura pública" on storage.objects for select using (bucket_id = 'products');
drop policy if exists "fotos: admin envia" on storage.objects;
create policy "fotos: admin envia" on storage.objects for insert to authenticated with check (bucket_id = 'products' and public.is_admin());
drop policy if exists "fotos: admin altera" on storage.objects;
create policy "fotos: admin altera" on storage.objects for update to authenticated using (bucket_id = 'products' and public.is_admin());
drop policy if exists "fotos: admin apaga" on storage.objects;
create policy "fotos: admin apaga" on storage.objects for delete to authenticated using (bucket_id = 'products' and public.is_admin());
