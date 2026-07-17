-- Promote a user to admin (one of the 3 co-founders).
-- Run this in the Supabase SQL editor AFTER the person has signed up once.
-- Non-admins cannot change roles from the app (blocked by RLS + trigger),
-- so promotion must be done here with elevated DB access.

update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and u.email = 'REPLACE_WITH_EMAIL@example.com';

-- Verify:
-- select p.id, u.email, p.role from public.profiles p
-- join auth.users u on u.id = p.id where p.role = 'admin';
