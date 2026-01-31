-- Create tool_status enum
CREATE TYPE public.tool_status AS ENUM ('ready', 'executing', 'error');

-- Create tools table
CREATE TABLE public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_enabled BOOLEAN DEFAULT true,
  requires_api_key BOOLEAN DEFAULT false,
  api_key_env_name TEXT,
  status tool_status DEFAULT 'ready',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on tools
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tools (allow all for now, will scope by user later)
CREATE POLICY "Allow all access to tools"
  ON public.tools
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add tool_calls JSONB column to messages
ALTER TABLE public.messages ADD COLUMN tool_calls JSONB;

-- Enable realtime for artifacts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.artifacts;

-- Enable realtime for tools table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tools;

-- Create trigger for updated_at on tools
CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON public.tools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial tools (using a known project ID)
INSERT INTO public.tools (project_id, name, description, icon, category, is_enabled, requires_api_key, api_key_env_name, status)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Filesystem', 'Read and write local files', 'HardDrive', 'system', true, false, NULL, 'ready'),
  ('00000000-0000-0000-0000-000000000001', 'Brave Search', 'Search the web for information', 'Globe', 'search', true, true, 'BRAVE_API_KEY', 'ready'),
  ('00000000-0000-0000-0000-000000000001', 'GitHub', 'Interact with GitHub repositories', 'Github', 'integration', false, true, 'GITHUB_TOKEN', 'ready'),
  ('00000000-0000-0000-0000-000000000001', 'Memory Vault', 'Store and retrieve persistent context', 'Database', 'memory', true, false, NULL, 'ready');