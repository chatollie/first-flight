import { useState } from "react";
import { Search, Wrench, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTools, type Tool } from "@/hooks/useTools";
import { ToolCard } from "@/components/ToolCard";
import { ToolConfigDialog } from "@/components/ToolConfigDialog";
import { CustomMCPToolModal } from "@/components/CustomMCPToolModal";

const DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

export function ToolRegistry() {
  const [searchQuery, setSearchQuery] = useState("");
  const [configTool, setConfigTool] = useState<Tool | null>(null);
  const [showMCPModal, setShowMCPModal] = useState(false);
  const { tools, isLoading, error, toggleTool } = useTools(DEFAULT_PROJECT_ID);

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enabledCount = tools.filter((t) => t.is_enabled).length;

  const handleToggle = (toolId: string, isEnabled: boolean) => {
    toggleTool(toolId, isEnabled);
  };

  const handleConfigure = (tool: Tool) => {
    setConfigTool(tool);
  };

  const handleSaveConfig = (toolId: string, apiKey: string) => {
    // In a real implementation, this would save to Supabase secrets
    console.log("Saving API key for tool:", toolId);
    setConfigTool(null);
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary status-pulse" />
          <h2 className="font-semibold text-sm">Tool Registry</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {enabledCount} enabled
        </span>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-input border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Tool List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive text-sm">
            Failed to load tools
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wrench className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground text-sm">No tools found</p>
          </div>
        ) : (
          filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onToggle={handleToggle}
              onConfigure={handleConfigure}
            />
          ))
        )}
      </div>

      {/* Add Tool Button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => setShowMCPModal(true)}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add MCP Tool</span>
        </button>
      </div>

      {/* Config Dialog */}
      <ToolConfigDialog
        tool={configTool}
        open={configTool !== null}
        onOpenChange={(open) => !open && setConfigTool(null)}
        onSave={handleSaveConfig}
      />

      {/* Custom MCP Tool Modal */}
      <CustomMCPToolModal
        open={showMCPModal}
        onOpenChange={setShowMCPModal}
        projectId={DEFAULT_PROJECT_ID}
      />
    </div>
  );
}
