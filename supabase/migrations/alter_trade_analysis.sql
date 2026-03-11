-- 1. Add nullable user_id and project_id to trade_analysis
alter table trade_analysis 
add column if not exists user_id uuid references auth.users(id) on delete cascade,
add column if not exists project_id uuid references projects(id) on delete set null;

-- 2. Enable RLS
alter table trade_analysis enable row level security;

-- 3. Policy: Select/Update/Delete ONLY for owner (if user_id is set)
create policy "Owner can view own analysis" 
on trade_analysis for select 
using (auth.uid() = user_id);

create policy "Owner can update own analysis" 
on trade_analysis for update 
using (auth.uid() = user_id);

create policy "Owner can delete own analysis" 
on trade_analysis for delete 
using (auth.uid() = user_id);

-- 4. Policy: Insert allowed if anonymous (user_id IS NULL) OR owner (user_id = auth.uid())
create policy "Anyone can insert anonymous or own analysis" 
on trade_analysis for insert 
with check (
  user_id is null or auth.uid() = user_id
);
