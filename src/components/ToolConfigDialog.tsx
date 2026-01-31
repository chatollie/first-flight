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
import { Key, AlertCircle } from "lucide-react";
import type { Tool } from "@/hooks/useTools";

interface ToolConfigDialogProps {
  tool: Tool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (toolId: string, apiKey: string) => void;
}

export function ToolConfigDialog({
  tool,
  open,
  onOpenChange,
  onSave,
}: ToolConfigDialogProps) {
  if (!tool) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const apiKey = formData.get("apiKey") as string;
    if (apiKey && onSave) {
      onSave(tool.id, apiKey);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            Configure {tool.name}
          </DialogTitle>
          <DialogDescription>
            Enter your API key to enable this tool. Keys are stored securely.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {tool.api_key_env_name || "API Key"}
              </Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder="Enter your API key..."
                className="font-mono"
              />
            </div>

            <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border border-border">
              <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                API keys are encrypted and stored securely. They are only used
                server-side and never exposed to the client.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Configuration</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
