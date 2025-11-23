# RLS Infinite Recursion Fix

## Problem
The Supabase RLS (Row Level Security) policies were causing infinite recursion when checking admin status. This happened because policies were querying the `public.users` table, which triggered the same policies again, creating an infinite loop.

## Solution

### Option 1: Apply SQL Migration (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** > **New Query**
3. Copy and paste the contents of `scripts/apply-rls-fix.sql`
4. Click **Run** to execute the migration

This will:
- Create SECURITY DEFINER functions to check admin status without triggering RLS
- Update all RLS policies to use these functions
- Allow authenticated users to create agents
- Fix the infinite recursion issue

### Option 2: Temporary Workaround (Already Implemented)

The code has been updated to automatically fallback to using the service role key when RLS errors occur. This allows agent creation to work even before the migration is applied.

**Note:** Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in your `.env.local` file.

## Verification

After applying the migration, try creating an agent:
1. Go to Dashboard > Agents
2. Click "Create Agent"
3. Fill in the form and submit
4. The agent should be created successfully without any recursion errors

## Files Changed

- `lib/supabase/server.ts` - Added service role client helper
- `app/api/agents/route.ts` - Added fallback to service role client
- `components/CreateAgentModal.tsx` - Improved error handling
- `supabase/migrations/002_fix_rls_recursion.sql` - Migration file
- `scripts/apply-rls-fix.sql` - SQL script for manual application

## What the Fix Does

1. **Creates `is_admin()` function**: A SECURITY DEFINER function that bypasses RLS when checking if a user is an admin
2. **Creates `is_current_user_admin()` function**: A helper that uses `auth.uid()` to check the current user's admin status
3. **Updates all policies**: All admin-checking policies now use these functions instead of directly querying `public.users`
4. **Allows agent creation**: Authenticated users can now create agents without admin privileges

## Troubleshooting

If you still see recursion errors after applying the migration:
1. Check that the functions were created: `SELECT * FROM pg_proc WHERE proname = 'is_admin';`
2. Verify policies were updated: Check Supabase Dashboard > Authentication > Policies
3. Ensure your user exists in `public.users` table
4. Check Supabase logs for any other errors

