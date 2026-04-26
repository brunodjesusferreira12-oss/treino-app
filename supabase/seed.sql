-- Optional manual seed helper.
-- The schema already inserts reference sports and badges.
-- The app automatically calls public.seed_my_default_workouts() on the first
-- authenticated visit. Use this only if you want to seed a specific user after
-- replacing the UUID below with the auth.users.id value.

select public.seed_default_workouts_for_user('00000000-0000-0000-0000-000000000000');
