create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  full_name text,
  phone text,
  role text not null default 'operator' check (role in ('administrator', 'manager', 'operator')),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid() and active = true limit 1;
$$;

revoke all on function public.current_company_id() from public;
grant execute on function public.current_company_id() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
begin
  insert into public.companies (name)
  values (coalesce(nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''), 'Minha empresa'))
  returning id into new_company_id;

  insert into public.profiles (id, company_id, full_name, phone, role)
  values (
    new.id,
    new_company_id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    'administrator'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sku text,
  name text not null check (length(trim(name)) > 0),
  category text,
  size text,
  color text,
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, sku)
);

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  table_number integer not null check (table_number > 0),
  status text not null default 'free' check (status in ('free', 'occupied', 'payment')),
  customer_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, table_number)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  customer_name text,
  status text not null default 'pending' check (status in ('pending', 'in_preparation', 'ready', 'delivered', 'cancelled')),
  total numeric(12,2) not null default 0 check (total >= 0),
  idempotency_key text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, idempotency_key)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  destination text check (destination in ('kitchen', 'bar')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_name text,
  source text not null default 'store' check (source in ('restaurant', 'store')),
  status text not null default 'completed' check (status in ('pending', 'completed', 'cancelled', 'refunded')),
  total numeric(12,2) not null check (total >= 0),
  idempotency_key text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, idempotency_key)
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sale_id uuid references public.sales(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  method text not null check (method in ('PIX', 'Card', 'Cash')),
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'completed' check (status in ('pending', 'completed', 'cancelled', 'refunded')),
  idempotency_key text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (company_id, idempotency_key),
  check (sale_id is not null or order_id is not null or table_id is not null)
);

create table if not exists public.exchanges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete restrict,
  returned_product_id uuid references public.products(id) on delete set null,
  replacement_product_id uuid references public.products(id) on delete set null,
  returned_product_name text not null,
  replacement_product_name text not null,
  quantity integer not null check (quantity > 0),
  difference numeric(12,2) not null,
  status text not null default 'completed' check (status in ('completed', 'cancelled')),
  idempotency_key text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (company_id, idempotency_key)
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null check (type in ('receipt', 'refund', 'adjustment')),
  origin text not null check (origin in ('sale', 'payment', 'exchange', 'manual')),
  reference_id uuid,
  method text check (method in ('PIX', 'Card', 'Cash')),
  amount numeric(12,2) not null check (amount <> 0),
  description text,
  idempotency_key text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (company_id, idempotency_key)
);

create index if not exists products_company_idx on public.products(company_id);
create index if not exists tables_company_idx on public.restaurant_tables(company_id);
create index if not exists orders_company_status_idx on public.orders(company_id, status);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists sales_company_created_idx on public.sales(company_id, created_at desc);
create index if not exists sale_items_sale_idx on public.sale_items(sale_id);
create index if not exists payments_company_created_idx on public.payments(company_id, created_at desc);
create index if not exists exchanges_company_created_idx on public.exchanges(company_id, created_at desc);
create index if not exists cash_movements_company_created_idx on public.cash_movements(company_id, created_at desc);

create trigger companies_set_updated_at before update on public.companies for each row execute procedure public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute procedure public.set_updated_at();
create trigger tables_set_updated_at before update on public.restaurant_tables for each row execute procedure public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute procedure public.set_updated_at();
create trigger sales_set_updated_at before update on public.sales for each row execute procedure public.set_updated_at();

do $$
declare
  table_name text;
begin
  foreach table_name in array array['companies', 'profiles', 'products', 'restaurant_tables', 'orders', 'order_items', 'sales', 'sale_items', 'payments', 'exchanges', 'cash_movements'] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

create policy companies_select on public.companies for select to authenticated using (id = public.current_company_id());
create policy companies_update on public.companies for update to authenticated using (id = public.current_company_id()) with check (id = public.current_company_id());

create policy profiles_select on public.profiles for select to authenticated using (company_id = public.current_company_id());
create policy profiles_update on public.profiles for update to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

create policy products_access on public.products for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy tables_access on public.restaurant_tables for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy orders_access on public.orders for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy order_items_access on public.order_items for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy sales_access on public.sales for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy sale_items_access on public.sale_items for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy payments_access on public.payments for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy exchanges_access on public.exchanges for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy cash_movements_access on public.cash_movements for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
