-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  subscription_tier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'market_intelligence',
    'copywriting',
    'video_generation',
    'market_gap',
    'shopify_store_creation',
    'niche_selection',
    'color_scheme',
    'product_management',
    'shopify_deployment'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent tasks table
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent logs table
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent metrics table
CREATE TABLE IF NOT EXISTS public.agent_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collaboration sessions table
CREATE TABLE IF NOT EXISTS public.collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_name TEXT NOT NULL,
  agents_involved TEXT[] NOT NULL DEFAULT '{}',
  workflow_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shopify stores table
CREATE TABLE IF NOT EXISTS public.shopify_stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  shopify_domain TEXT NOT NULL,
  access_token TEXT NOT NULL, -- In production, encrypt this
  status TEXT NOT NULL DEFAULT 'creating' CHECK (status IN ('creating', 'active', 'suspended')),
  store_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Store creation jobs table
CREATE TABLE IF NOT EXISTS public.store_creation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.shopify_stores(id) ON DELETE SET NULL,
  niche_data JSONB,
  color_scheme JSONB,
  products_data JSONB,
  deployment_status TEXT NOT NULL DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'deploying', 'live', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Niche recommendations table
CREATE TABLE IF NOT EXISTS public.niche_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  niche_name TEXT NOT NULL,
  market_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  competition_score NUMERIC NOT NULL CHECK (competition_score >= 0 AND competition_score <= 10),
  opportunity_score NUMERIC NOT NULL CHECK (opportunity_score >= 0 AND opportunity_score <= 10),
  recommended_colors TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON public.agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_id ON public.agent_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON public.agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id ON public.agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON public.agent_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON public.agent_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_timestamp ON public.agent_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_shopify_stores_user_id ON public.shopify_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_store_creation_jobs_user_id ON public.store_creation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_niche_recommendations_user_id ON public.niche_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_creation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niche_recommendations ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Agents policies
CREATE POLICY "Anyone can view active agents" ON public.agents
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage agents" ON public.agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Agent tasks policies
CREATE POLICY "Users can view own tasks" ON public.agent_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON public.agent_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tasks" ON public.agent_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Agent logs policies
CREATE POLICY "Users can view logs for own tasks" ON public.agent_logs
  FOR SELECT USING (
    task_id IS NULL OR EXISTS (
      SELECT 1 FROM public.agent_tasks
      WHERE id = agent_logs.task_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all logs" ON public.agent_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Agent metrics policies
CREATE POLICY "Anyone can view metrics" ON public.agent_metrics
  FOR SELECT USING (true);

-- Collaboration sessions policies
CREATE POLICY "Users can view own sessions" ON public.collaboration_sessions
  FOR SELECT USING (true); -- Simplified for now

CREATE POLICY "Users can create sessions" ON public.collaboration_sessions
  FOR INSERT WITH CHECK (true);

-- Analytics events policies
CREATE POLICY "Users can view own events" ON public.analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all events" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Shopify stores policies
CREATE POLICY "Users can view own stores" ON public.shopify_stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stores" ON public.shopify_stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stores" ON public.shopify_stores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all stores" ON public.shopify_stores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Store creation jobs policies
CREATE POLICY "Users can view own jobs" ON public.store_creation_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs" ON public.store_creation_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all jobs" ON public.store_creation_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Niche recommendations policies
CREATE POLICY "Users can view own recommendations" ON public.niche_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recommendations" ON public.niche_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for agents table
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for shopify_stores table
CREATE TRIGGER update_shopify_stores_updated_at
  BEFORE UPDATE ON public.shopify_stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

