-- Create enum for agent status
CREATE TYPE public.agent_status AS ENUM ('active', 'idle', 'working', 'error');

-- Create enum for message role
CREATE TYPE public.message_role AS ENUM ('user', 'orchestrator', 'system', 'agent');

-- Create enum for plan step status
CREATE TYPE public.plan_step_status AS ENUM ('pending', 'in-progress', 'completed');

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agents table
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  status agent_status NOT NULL DEFAULT 'idle',
  tokens_used INTEGER NOT NULL DEFAULT 0,
  system_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Plan steps table (for execution plans)
CREATE TABLE public.plan_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  status plan_step_status NOT NULL DEFAULT 'pending',
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Artifacts table
CREATE TABLE public.artifacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'markdown',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (public access) since we don't have auth yet
-- These will be updated when we add authentication
CREATE POLICY "Allow all access to projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to agents" ON public.agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to conversations" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to plan_steps" ON public.plan_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to artifacts" ON public.artifacts FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plan_steps_updated_at BEFORE UPDATE ON public.plan_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON public.artifacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default project and agents
INSERT INTO public.projects (id, name, description) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'AI Research Sprint', 'Multi-agent research and synthesis project');

INSERT INTO public.agents (project_id, name, role, avatar, status, system_prompt) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Atlas', 'Deep Researcher', '🔍', 'active', 'You are Atlas, a deep research specialist. Your role is to conduct thorough research on topics, find relevant sources, and compile comprehensive information.'),
  ('00000000-0000-0000-0000-000000000001', 'Nova', 'Code Architect', '⚡', 'idle', 'You are Nova, a code architect. Your role is to design and implement code solutions, review architecture decisions, and ensure code quality.'),
  ('00000000-0000-0000-0000-000000000001', 'Echo', 'Writer & Editor', '✍️', 'idle', 'You are Echo, a writer and editor. Your role is to synthesize information into clear, well-structured documents and refine content for clarity.'),
  ('00000000-0000-0000-0000-000000000001', 'Sentinel', 'QA & Reviewer', '🛡️', 'idle', 'You are Sentinel, a QA specialist and reviewer. Your role is to review work for accuracy, identify issues, and ensure quality standards are met.');

-- Insert default conversation
INSERT INTO public.conversations (id, project_id, title) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Main Command Stream');