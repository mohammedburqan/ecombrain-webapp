-- Fix infinite recursion in RLS policies
-- The issue: Policies were querying public.users table which triggered the same policies again

-- Create a SECURITY DEFINER function to check admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Use SECURITY DEFINER to bypass RLS when checking admin status
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a helper function that uses auth.uid() directly
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage agents" ON public.agents;
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.agent_tasks;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.agent_logs;
DROP POLICY IF EXISTS "Admins can view all events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view all stores" ON public.shopify_stores;
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.store_creation_jobs;

-- Recreate users policies with fixed logic
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_current_user_admin());

-- Recreate agents policies - allow authenticated users to create agents, admins to manage all
CREATE POLICY "Anyone can view active agents" ON public.agents
  FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can create agents" ON public.agents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all agents" ON public.agents
  FOR ALL USING (public.is_current_user_admin());

-- Recreate agent tasks policies
CREATE POLICY "Admins can view all tasks" ON public.agent_tasks
  FOR SELECT USING (public.is_current_user_admin());

-- Recreate agent logs policies
CREATE POLICY "Admins can view all logs" ON public.agent_logs
  FOR SELECT USING (public.is_current_user_admin());

-- Recreate analytics events policies
CREATE POLICY "Admins can view all events" ON public.analytics_events
  FOR SELECT USING (public.is_current_user_admin());

-- Recreate shopify stores policies
CREATE POLICY "Admins can view all stores" ON public.shopify_stores
  FOR SELECT USING (public.is_current_user_admin());

-- Recreate store creation jobs policies
CREATE POLICY "Admins can view all jobs" ON public.store_creation_jobs
  FOR SELECT USING (public.is_current_user_admin());

