
# Vox Populi Refactor: Single Supervisor + MCP Tools Model

## Summary

This refactor pivots from the current "multi-agent personas" architecture to a cleaner **single supervisor (Vox) + MCP Tools** model. The left pane becomes a Tool Registry instead of an Agent Roster, and the Artifact Canvas gains tabbed views (Preview/Code/Diff).

---

## What's Changing

| Current State | New State |
|---------------|-----------|
| Agent Roster (Atlas, Nova, Echo, Sentinel personas) | Tool Registry (Filesystem, Brave Search, GitHub, Memory Vault) |
| Agents table in DB with tokens tracking | Tools table with enable/disable state + API key config |
| Plan steps assigned to agents | Tool Call blocks in chat stream |
| Static mock artifact | Real-time synced artifacts with tabs |

---

## Implementation Steps

### Step 1: Database Schema Migration

**Replace the `agents` table with a `tools` table:**

```sql
-- New tools table
CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,           -- Lucide icon name
  category TEXT DEFAULT 'general',
  is_enabled BOOLEAN DEFAULT true,
  requires_api_key BOOLEAN DEFAULT false,
  api_key_env_name TEXT,        -- e.g., 'BRAVE_API_KEY'
  status TEXT DEFAULT 'ready',  -- ready, executing, error
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add tool_calls_json to messages for tracking tool invocations
ALTER TABLE messages ADD COLUMN tool_calls JSONB;

-- Enable realtime for artifacts
ALTER PUBLICATION supabase_realtime ADD TABLE artifacts;
```

**Seed initial tools:**
- Filesystem (HardDrive icon) - Active
- Brave Search (Globe icon) - Active  
- GitHub (Github icon) - Inactive
- Memory Vault (Database icon) - Active

---

### Step 2: Tool Registry Component (Left Pane)

**Replace `AgentRoster.tsx` with `ToolRegistry.tsx`:**

```text
+---------------------------+
|  Tool Registry            |
+---------------------------+
| [Search tools...]         |
+---------------------------+
| +---------------------+   |
| | [HardDrive] Filesystem  |
| | Read/write local files  |
| | [Toggle: ON]  [Gear]    |
| | Status: Ready (green)   |
| +---------------------+   |
|                           |
| +---------------------+   |
| | [Globe] Brave Search    |
| | Web search capability   |
| | [Toggle: ON]  [Gear]    |
| | Status: Ready (green)   |
| +---------------------+   |
|                           |
| ... more tools ...        |
+---------------------------+
| [+ Add Tool]              |
+---------------------------+
```

**Features:**
- Toggle switch to enable/disable each tool
- Status dot: Green (Ready), Yellow (Executing), Red (Error)
- Gear icon on hover opens configuration dialog (for API keys)
- Search filter for tools

---

### Step 3: Command Stream Enhancements

**Update the chat to show Tool Call blocks instead of agent assignments:**

```text
+---------------------------------------+
| USER: Search for AI agent frameworks  |
+---------------------------------------+

+---------------------------------------+
| VOX:                                  |
| I'll search for that information.     |
|                                       |
| +--------------------------------+    |
| | [Globe] Using Brave Search...  |    |
| | Query: "AI agent frameworks"   |    |
| | Status: Executing...           |    |
| +--------------------------------+    |
|                                       |
| Found 5 relevant results. Let me      |
| compile this into a document.         |
|                                       |
| +--------------------------------+    |
| | [HardDrive] Writing artifact   |    |
| | File: research-notes.md        |    |
| | [Approve] [Reject]             |  <-- HITL gate
| +--------------------------------+    |
+---------------------------------------+
```

**New message types:**
- `tool_call`: Shows tool invocation with parameters
- Add HITL approval buttons for "write" operations

---

### Step 4: Artifact Canvas with Tabs

**Enhance the right pane with tabbed interface:**

```text
+----------------------------------------+
| [Research Notes]              [X]      |
+----------------------------------------+
| [Preview] [Code] [Diff]                |
+----------------------------------------+
|                                        |
|  # AI Agent Frameworks                 |
|                                        |
|  ## Overview                           |
|  Modern frameworks include...          |
|                                        |
|  | Framework | Language |              |
|  |-----------|----------|              |
|  | LangGraph | Python   |              |
|                                        |
+----------------------------------------+
| Last updated: 2:34 PM | v1.2           |
+----------------------------------------+
```

**Features:**
- **Preview tab**: Rendered Markdown (current behavior)
- **Code tab**: Syntax-highlighted raw content
- **Diff tab**: Show changes from previous version (future)
- Real-time updates via Supabase subscription to `artifacts` table

---

### Step 5: Orchestrator Edge Function Update

**Update system prompt to use tool-calling paradigm:**

```typescript
const VOX_SYSTEM_PROMPT = `You are Vox, a single AI supervisor for the Vox Populi workstation.

You have access to these MCP tools:
- filesystem: Read and write local files
- brave_search: Search the web for information
- github: Interact with GitHub repositories
- memory_vault: Store and retrieve persistent context

When you need to use a tool, respond with a tool_call block:
{"tool_call": {"tool": "brave_search", "params": {"query": "..."}}}

For write operations (filesystem write, github commit), pause and request approval:
{"tool_call": {"tool": "filesystem", "action": "write", "requires_approval": true, ...}}

Generate checklists for complex tasks using markdown checkboxes.`;
```

---

### Step 6: New Hooks

**Create `useTools.ts`:**
- Fetch tools from DB
- Toggle enable/disable
- Update tool status (ready/executing/error)
- Save API key configuration

**Create `useArtifacts.ts`:**
- Real-time subscription to artifacts table
- CRUD operations for artifacts
- Version tracking

---

## File Changes Summary

| Action | File |
|--------|------|
| **Delete** | `src/hooks/useAgents.ts` |
| **Delete** | `src/components/AgentRoster.tsx` |
| **Create** | `src/hooks/useTools.ts` |
| **Create** | `src/hooks/useArtifacts.ts` |
| **Create** | `src/components/ToolRegistry.tsx` |
| **Create** | `src/components/ToolCard.tsx` |
| **Create** | `src/components/ToolConfigDialog.tsx` |
| **Create** | `src/components/ToolCallBlock.tsx` |
| **Create** | `src/components/ApprovalGate.tsx` |
| **Modify** | `src/components/ArtifactCanvas.tsx` (add tabs) |
| **Modify** | `src/components/CommandStream.tsx` (tool calls, HITL) |
| **Modify** | `src/pages/Index.tsx` (swap AgentRoster for ToolRegistry) |
| **Modify** | `supabase/functions/orchestrator/index.ts` (new prompt) |
| **Migrate** | Database: Add tools table, modify messages |

---

## Technical Notes

- The `agents` table can be dropped after migration, or kept for backward compatibility
- Tool status updates will use Supabase realtime for live UI feedback
- HITL approval gates will emit events that the orchestrator waits for before continuing
- Artifact versioning uses the existing `version` column with increment on update
- The theme (Obsidian/Cyberpunk dark mode) remains unchanged
