-- Create projects table
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null
);

-- Enable RLS
alter table projects enable row level security;

-- Policy: Users can only see their own projects
create policy "Users can view own projects"
on projects for select
using (auth.uid() = user_id);

-- Policy: Users can only insert their own projects
create policy "Users can insert own projects"
on projects for insert
with check (auth.uid() = user_id);

-- Policy: Users can only update their own projects
create policy "Users can update own projects"
on projects for update
using (auth.uid() = user_id);

-- Policy: Users can only delete their own projects
create policy "Users can delete own projects"
on projects for delete
using (auth.uid() = user_id);
