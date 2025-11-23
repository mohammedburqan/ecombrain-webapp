-- Script to create an admin user
-- Run this in Supabase SQL Editor after creating your account

-- First, find your user ID from auth.users table
-- Then update the users table to set role to 'admin'

-- Example (replace 'your-user-email@example.com' with your actual email):
UPDATE public.users
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-user-email@example.com'
);

-- Or if you know your user ID:
-- UPDATE public.users SET role = 'admin' WHERE id = 'your-user-id-here';

-- Verify the update:
SELECT id, email, role FROM public.users WHERE role = 'admin';


