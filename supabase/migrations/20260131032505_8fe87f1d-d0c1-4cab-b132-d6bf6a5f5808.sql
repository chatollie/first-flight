-- Task status enum
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked');

-- Assignee type enum
CREATE TYPE assignee_type AS ENUM ('human', 'vox');

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  conversation_id UUID REFERENCES conversations(id),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  assignee assignee_type NOT NULL DEFAULT 'vox',
  order_index INTEGER NOT NULL DEFAULT 0,
  parent_task_id UUID REFERENCES tasks(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policy
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Updated_at trigger
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();