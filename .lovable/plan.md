
# Dynamic Task Console Refactor

## Summary

This refactor transforms the center pane from a traditional chat bubble interface into a **Dynamic Task Console** - a project management-style interface where Vox generates actionable tasks rather than conversational messages.

---

## What's Changing

| Current State | New State |
|---------------|-----------|
| Chat bubbles (user/orchestrator) | Task Cards with status badges |
| Messages table stores conversations | Tasks table stores actionable items |
| Plan steps embedded in messages | Top-level "Current Sprint" progress tracker |
| Text responses from Vox | JSON task lists rendered as interactive cards |
| No assignment concept | Assignee: Human or Vox |

---

## UI Structure

```text
+------------------------------------------+
|  Task Console                 [Vox Online]|
+------------------------------------------+
|                                          |
|  CURRENT SPRINT                          |
|  [=====>              ] 2/5 tasks done   |
|  [Search] [Analyze] [Draft] [Review] [>] |
|                                          |
+------------------------------------------+
|                                          |
|  TASK FEED                               |
|                                          |
|  +------------------------------------+  |
|  | [In Progress]  [Vox icon]          |  |
|  | Research AI agent frameworks       |  |
|  | Searching for latest information...|  |
|  | [glow effect on border]            |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | [Blocked]  [Human icon] (highlight)|  |
|  | Confirm pricing strategy           |  |
|  | Waiting for your decision          |  |
|  | [Complete] [Assign to Vox] [Delete]|  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | [Pending]  [Vox icon]              |  |
|  | Write summary document             |  |
|  | Will begin after research complete |  |
|  | [Complete] [Assign to Vox] [Delete]|  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
|                                          |
|  [Add a task or tell Vox what to do...] |
|                                  [Send]  |
+------------------------------------------+
```

---

## Implementation Steps

### Step 1: Database Schema Migration

**Create a new `tasks` table:**

```sql
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
  parent_task_id UUID REFERENCES tasks(id),  -- For subtasks
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
```

---

### Step 2: Create useTasks Hook

**New file: `src/hooks/useTasks.ts`**

- Fetch tasks from DB ordered by `order_index`
- Subscribe to realtime updates (status changes)
- Provide CRUD operations:
  - `addTask(title, description, assignee)`
  - `updateTaskStatus(id, status)`
  - `updateTaskAssignee(id, assignee)`
  - `deleteTask(id)`
  - `addLocalTask()` for optimistic UI

---

### Step 3: Create TaskCard Component

**New file: `src/components/TaskCard.tsx`**

Features:
- Status Badge: Colored pills (Pending=gray, In Progress=cyan, Completed=green, Blocked=amber)
- Assignee Icon: User icon (human) or Bot/Zap icon (Vox)
- Title and description display
- Action buttons:
  - Checkbox to mark complete
  - Robot button to assign to Vox
  - Trash button to delete
- Glow effect when status is "In Progress"
- Highlight border (amber) when assignee is "human" and status is "blocked"

---

### Step 4: Create SprintProgress Component

**New file: `src/components/SprintProgress.tsx`**

- Horizontal progress bar showing completed/total tasks
- Row of mini task chips showing abbreviated titles
- Clicking a chip scrolls to that task in the feed
- "In Progress" task chip gets a pulse animation

---

### Step 5: Create TaskConsole Component

**New file: `src/components/TaskConsole.tsx`**

Replaces CommandStream.tsx with:

**Layout:**
- Header with "Task Console" title and Vox status
- SprintProgress component (top section)
- Scrollable TaskFeed (middle section)
- Command input (bottom section) - textarea for adding tasks or talking to Vox

**Behavior:**
- Input can be a direct task (starts with "Task:" or similar) or a command to Vox
- When Vox responds, parse JSON task list and create tasks in DB
- Tasks appear in feed via realtime subscription

---

### Step 6: Update Orchestrator Edge Function

**Modify system prompt to output tasks:**

```typescript
const VOX_SYSTEM_PROMPT = `You are Vox, the AI supervisor for Vox Populi.

## Response Format

When given a complex request, break it into tasks:
\`\`\`json
{"tasks": [
  {"title": "Research AI frameworks", "description": "Search for latest options", "assignee": "vox"},
  {"title": "Confirm pricing tier", "description": "Need human decision on freemium vs paid", "assignee": "human"},
  {"title": "Write summary", "description": "Compile findings into document", "assignee": "vox"}
]}
\`\`\`

## Task Assignment Rules
- Assign to "vox" for research, writing, coding, searching
- Assign to "human" for decisions, approvals, confirmations, external actions
- Human-assigned tasks should be marked as "blocked" until actioned

## Guidelines
1. Be task-oriented, not conversational
2. Break complex requests into 3-7 discrete tasks
3. Order tasks by dependency (blocked tasks after their dependencies)
4. Include brief descriptions for context
`;
```

---

### Step 7: Update Index.tsx

Replace `<CommandStream />` with `<TaskConsole />`.

---

## File Changes Summary

| Action | File |
|--------|------|
| **Migrate** | Database: Create tasks table with enums |
| **Create** | `src/hooks/useTasks.ts` |
| **Create** | `src/components/TaskCard.tsx` |
| **Create** | `src/components/SprintProgress.tsx` |
| **Create** | `src/components/TaskConsole.tsx` |
| **Modify** | `supabase/functions/orchestrator/index.ts` (task-based prompt) |
| **Modify** | `src/pages/Index.tsx` (swap CommandStream for TaskConsole) |
| **Keep** | `src/components/CommandStream.tsx` (preserve for reference/future use) |

---

## Technical Notes

### Aesthetics
- Keep "Obsidian" dark theme (slate-950 background)
- Use shadcn/ui Card and Badge components
- "In Progress" tasks get a cyan glow border (existing `glow-border` class)
- "Blocked" human tasks get amber/yellow highlight border
- Status badges use existing color variables:
  - Pending: `muted-foreground`
  - In Progress: `primary` (cyan)
  - Completed: `status-active` (green)
  - Blocked: `status-idle` (amber)

### Realtime Updates
- When Vox completes a background task (e.g., search finishes), it updates task status in DB
- UI receives realtime event and flips card to "Completed" with animation
- Sprint progress bar updates automatically

### Parsing Logic
- Input detection: If user types "Task: ..." create task directly
- Otherwise, send to Vox orchestrator
- Parse `{"tasks": [...]}` JSON from Vox response
- Insert tasks to DB, which triggers realtime updates to UI
