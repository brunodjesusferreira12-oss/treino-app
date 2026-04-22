-- Optional manual seed helper.
-- The app calls public.seed_my_default_workouts() automatically on the first
-- authenticated access. Use this only if you want to seed a specific user from
-- the Supabase SQL Editor after replacing the UUID below with auth.users.id.

select public.seed_default_workouts_for_user('00000000-0000-0000-0000-000000000000');
