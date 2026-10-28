-- FinAdvisor XAI Supabase Migration: Profiles and Goals with Row Level Security (RLS)
-- Enables strict per-user isolation: users can only read and write their own rows.

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text not null default 'Investor',
  age integer not null default 29 check (age >= 18 and age <= 100),
  occupation text not null default 'Professional',
  dependents integer not null default 0 check (dependents >= 0),
  monthly_income numeric not null default 95000 check (monthly_income > 0),
  monthly_expenses numeric not null default 46000 check (monthly_expenses >= 0),
  monthly_emi numeric not null default 12000 check (monthly_emi >= 0),
  current_savings numeric not null default 320000 check (current_savings >= 0),
  existing_investments numeric not null default 450000 check (existing_investments >= 0),
  monthly_investment numeric not null default 20000 check (monthly_investment >= 0),
  horizon_years integer not null default 15 check (horizon_years >= 1 and horizon_years <= 60),
  risk_tolerance integer not null default 7 check (risk_tolerance >= 1 and risk_tolerance <= 10),
  income_stability integer not null default 8 check (income_stability >= 1 and income_stability <= 10),
  goals jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policies: Users can view, insert, and update only their own profile
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Auto create profile on auth signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    name,
    age,
    occupation,
    monthly_income,
    monthly_expenses,
    monthly_emi,
    current_savings,
    existing_investments,
    monthly_investment,
    horizon_years,
    risk_tolerance,
    income_stability
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    29,
    'Software Engineer',
    95000,
    46000,
    12000,
    320000,
    450000,
    20000,
    15,
    7,
    8
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
