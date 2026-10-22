-- LEGEND Trading Tracker cloud database setup
-- Run this entire script in Supabase Dashboard > SQL Editor.
-- Row Level Security ensures a signed-in user can access only their own rows.

create table if not exists public.legend_trades (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  stage text not null check (stage in ('challenge','funded')),
  account_size integer not null check (account_size in (6000,15000,50000,100000)),
  pair text not null,
  setup text default '',
  outcome text not null check (outcome in ('TP','SL','BE')),
  rules_followed text not null check (rules_followed in ('yes','no')),
  psychology integer not null check (psychology between 1 and 10),
  lesson text default '',
  risk_amount numeric not null,
  risk_percent numeric not null,
  cycle integer not null,
  created_at_ms bigint not null
);
create table if not exists public.legend_payouts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount numeric not null check (amount > 0),
  account_size integer not null check (account_size in (6000,15000,50000,100000))
);
create table if not exists public.legend_account_stages (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_size integer not null check (account_size in (6000,15000,50000,100000)),
  stage text not null check (stage in ('planned','challenge','funded','passed')),
  primary key (id, user_id)
);

alter table public.legend_trades enable row level security;
alter table public.legend_payouts enable row level security;
alter table public.legend_account_stages enable row level security;

drop policy if exists "Users manage their own trades" on public.legend_trades;
create policy "Users manage their own trades" on public.legend_trades
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their own payouts" on public.legend_payouts;
create policy "Users manage their own payouts" on public.legend_payouts
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their own account stages" on public.legend_account_stages;
create policy "Users manage their own account stages" on public.legend_account_stages
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.legend_trades to authenticated;
grant select, insert, update, delete on public.legend_payouts to authenticated;
grant select, insert, update, delete on public.legend_account_stages to authenticated;
