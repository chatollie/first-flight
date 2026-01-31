-- Add config JSONB column to tools table for storing MCP configuration
ALTER TABLE public.tools 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the column purpose
COMMENT ON COLUMN public.tools.config IS 'Stores MCP tool configuration including command, args, and env variables';