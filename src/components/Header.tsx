import { Zap, Settings, Bell, Upload, Database } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">VOX POPULI</h1>
            <p className="text-[10px] text-muted-foreground tracking-wider">MISSION CONTROL</p>
          </div>
        </div>
      </div>
      
      {/* Center - Project Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full border border-border">
          <div className="w-2 h-2 rounded-full bg-status-active status-pulse" />
          <span className="text-xs text-muted-foreground">Project:</span>
          <span className="text-xs font-medium text-foreground">AI Research Sprint</span>
        </div>
      </div>
      
      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-secondary transition-colors">
          <Database className="w-4 h-4" />
          <span>Context Vault</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-secondary transition-colors">
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
