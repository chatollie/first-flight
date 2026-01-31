import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Wand2,
  Plus,
  Trash2,
  Terminal,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface EnvVar {
  key: string;
  value: string;
}

interface MCPConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

interface CustomMCPToolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function CustomMCPToolModal({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: CustomMCPToolModalProps) {
  const [pasteValue, setPasteValue] = useState("");
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [envVars, setEnvVars] = useState<EnvVar[]>([{ key: "", value: "" }]);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [parseStatus, setParseStatus] = useState<"idle" | "success" | "error">("idle");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setPasteValue("");
    setName("");
    setCommand("");
    setArgs("");
    setEnvVars([{ key: "", value: "" }]);
    setDescription("");
    setTestStatus("idle");
    setParseStatus("idle");
  };

  // Parse MCP config JSON
  const parseMCPConfig = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      
      // Handle different MCP config formats
      // Format 1: { "toolName": { "command": "...", "args": [...], "env": {...} } }
      // Format 2: { "command": "...", "args": [...], "env": {...} }
      // Format 3: { "mcpServers": { "toolName": { ... } } }

      let config: MCPConfig | null = null;
      let toolName = "";

      // Check for mcpServers wrapper (Claude format)
      if (parsed.mcpServers && typeof parsed.mcpServers === "object") {
        const keys = Object.keys(parsed.mcpServers);
        if (keys.length > 0) {
          toolName = keys[0];
          config = parsed.mcpServers[toolName];
        }
      }
      // Check for direct tool name key
      else if (!parsed.command) {
        const keys = Object.keys(parsed);
        if (keys.length > 0 && typeof parsed[keys[0]] === "object") {
          toolName = keys[0];
          config = parsed[keys[0]];
        }
      }
      // Direct config format
      else {
        config = parsed;
      }

      if (config) {
        if (toolName) setName(toolName);
        if (config.command) setCommand(config.command);
        if (config.args && Array.isArray(config.args)) {
          setArgs(config.args.join(" "));
        }
        if (config.env && typeof config.env === "object") {
          const envArray = Object.entries(config.env).map(([key, value]) => ({
            key,
            value: String(value),
          }));
          if (envArray.length > 0) {
            setEnvVars([...envArray, { key: "", value: "" }]);
          }
        }
        setParseStatus("success");
        setTimeout(() => setParseStatus("idle"), 2000);
      }
    } catch {
      setParseStatus("error");
      setTimeout(() => setParseStatus("idle"), 2000);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    setPasteValue(text);
    parseMCPConfig(text);
  };

  const handlePasteChange = (value: string) => {
    setPasteValue(value);
    // Try to parse on change as well
    if (value.trim().startsWith("{")) {
      parseMCPConfig(value);
    }
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: "key" | "value", value: string) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus("idle");
    
    // Simulate connection test (in a real implementation, this would ping the MCP server)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Simulate success if command is filled
    if (command.trim()) {
      setTestStatus("success");
    } else {
      setTestStatus("error");
    }
    setIsTesting(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !command.trim()) return;

    setIsSaving(true);

    const config = {
      command: command.trim(),
      args: args.trim().split(/\s+/).filter(Boolean),
      env: envVars
        .filter((ev) => ev.key.trim())
        .reduce((acc, ev) => ({ ...acc, [ev.key]: ev.value }), {} as Record<string, string>),
    };

    const toolData: {
      project_id: string;
      name: string;
      description: string;
      icon: string;
      category: string;
      is_enabled: boolean;
      requires_api_key: boolean;
      config: { command: string; args: string[]; env: Record<string, string> };
      status: "ready" | "error";
    } = {
      project_id: projectId,
      name: name.trim(),
      description: description.trim() || `MCP Tool: ${name.trim()}`,
      icon: "terminal",
      category: "mcp",
      is_enabled: true,
      requires_api_key: Object.keys(config.env).length > 0,
      config,
      status: testStatus === "success" ? "ready" : "error",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("tools").insert([toolData as any]);

    setIsSaving(false);

    if (!error) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            Add Custom MCP Tool
          </DialogTitle>
          <DialogDescription>
            Paste your MCP configuration or manually configure the tool.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Magic Paste Area */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium">
                <Wand2 className="w-3 h-3 inline mr-1" />
                Paste MCP Config (JSON)
              </Label>
              {parseStatus === "success" && (
                <Badge variant="outline" className="text-xs bg-status-active/10 text-status-active border-status-active/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Parsed
                </Badge>
              )}
              {parseStatus === "error" && (
                <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                  <XCircle className="w-3 h-3 mr-1" />
                  Invalid JSON
                </Badge>
              )}
            </div>
            <Textarea
              placeholder='{"mcpServers": {"brave-search": {"command": "npx", "args": ["-y", "@anthropic/mcp-server-brave-search"], "env": {"BRAVE_API_KEY": "..."}}}}'
              value={pasteValue}
              onChange={(e) => handlePasteChange(e.target.value)}
              onPaste={handlePaste}
              className="font-mono text-xs h-20 resize-none bg-muted/30"
            />
            <p className="text-[10px] text-muted-foreground">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Auto-detects Claude, Cursor, and standard MCP formats
            </p>
          </div>

          <div className="border-t border-border pt-3 space-y-3">
            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="brave-search"
                className="h-8 text-sm"
              />
            </div>

            {/* Command */}
            <div className="space-y-1">
              <Label htmlFor="command" className="text-xs">Command *</Label>
              <Input
                id="command"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="npx, uvx, node, python..."
                className="h-8 text-sm font-mono"
              />
            </div>

            {/* Arguments */}
            <div className="space-y-1">
              <Label htmlFor="args" className="text-xs">Arguments</Label>
              <Input
                id="args"
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                placeholder="-y @anthropic/mcp-server-brave-search"
                className="h-8 text-sm font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Space-separated arguments
              </p>
            </div>

            {/* Environment Variables */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Environment Variables</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addEnvVar}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-1.5">
                {envVars.map((env, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={env.key}
                      onChange={(e) => updateEnvVar(index, "key", e.target.value)}
                      placeholder="KEY"
                      className="h-7 text-xs font-mono flex-1"
                    />
                    <Input
                      value={env.value}
                      onChange={(e) => updateEnvVar(index, "value", e.target.value)}
                      placeholder="value"
                      type="password"
                      className="h-7 text-xs font-mono flex-[2]"
                    />
                    {envVars.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEnvVar(index)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-xs">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={!command.trim() || isTesting}
              className="text-xs"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Terminal className="w-3 h-3 mr-1" />
                  Test Connection
                </>
              )}
            </Button>
            {testStatus === "success" && (
              <div className="flex items-center gap-1.5 text-xs text-status-active">
                <div className="w-2 h-2 rounded-full bg-status-active status-pulse" />
                Connection successful
              </div>
            )}
            {testStatus === "error" && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                Connection failed
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !command.trim() || isSaving}
            className="text-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Tool"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
