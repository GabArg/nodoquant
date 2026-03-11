-- Create user_profiles table linked to Supabase auth.users
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  email text,
  plan text default 'free'
);

-- Enable RLS
alter table user_profiles enable row level security;

-- Policy: Users can only read their own profile
create policy "Users can view own profile" 
on user_profiles for select 
using (auth.uid() = id);

-- Policy: Users can only update their own profile
create policy "Users can update own profile" 
on user_profiles for update 
using (auth.uid() = id);

-- Function to handle new user signups
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.user_profiles (id, email, plan)
  values (new.id, new.email, 'free');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
