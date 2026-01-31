import { useState } from "react";
import { FileCode2, FileText, Table, Eye, Code, Quote, ExternalLink, GitCompare, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useArtifacts, type Artifact } from "@/hooks/useArtifacts";

type ViewTab = "preview" | "code" | "diff";

const DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

function ArtifactTypeIcon({ contentType }: { contentType: string }) {
  switch (contentType) {
    case "markdown":
      return <FileText className="w-4 h-4" />;
    case "code":
      return <FileCode2 className="w-4 h-4" />;
    case "table":
      return <Table className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-xl font-bold text-foreground mt-0 mb-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-semibold text-foreground mt-6 mb-3 pb-2 border-b border-border">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-base font-medium text-foreground mt-4 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith('> ')) {
          return (
            <blockquote key={i} className="border-l-2 border-primary pl-4 my-4 italic text-muted-foreground">
              {line.slice(2)}
            </blockquote>
          );
        }
        if (line.startsWith('- **')) {
          const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
          if (match) {
            return (
              <div key={i} className="flex gap-2 my-1">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">{match[1]}:</strong> <span className="text-muted-foreground">{match[2]}</span></span>
              </div>
            );
          }
        }
        if (line.startsWith('- [ ] ')) {
          return (
            <div key={i} className="flex gap-2 my-1 items-center">
              <input type="checkbox" disabled className="rounded border-border" />
              <span className="text-muted-foreground">{line.slice(6)}</span>
            </div>
          );
        }
        if (line.startsWith('- [x] ')) {
          return (
            <div key={i} className="flex gap-2 my-1 items-center">
              <input type="checkbox" checked disabled className="rounded border-border" />
              <span className="text-muted-foreground line-through">{line.slice(6)}</span>
            </div>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2 my-1">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">{line.slice(2)}</span>
            </div>
          );
        }
        if (line.match(/^\d+\. /)) {
          const num = line.match(/^(\d+)\. (.+)/);
          if (num) {
            const text = num[2];
            const parts = text.split(/\*\*(.+?)\*\*/g);
            return (
              <div key={i} className="flex gap-2 my-1">
                <span className="text-primary font-mono text-xs w-4">{num[1]}.</span>
                <span className="text-muted-foreground">
                  {parts.map((part, j) => 
                    j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part
                  )}
                </span>
              </div>
            );
          }
        }
        if (line.startsWith('|')) {
          if (line.match(/^\|[-\s|]+\|$/)) return null;
          
          const cells = line.split('|').filter(c => c.trim());
          const isHeader = i > 0 && lines[i + 1]?.match(/^\|[-\s|]+\|$/);
          
          return (
            <div key={i} className={cn(
              "grid grid-cols-3 gap-2 py-2 px-2 text-sm",
              isHeader ? "bg-muted/50 font-medium text-foreground" : "border-b border-border/50 text-muted-foreground"
            )}>
              {cells.map((cell, j) => (
                <div key={j}>{cell.trim()}</div>
              ))}
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        return <p key={i} className="text-muted-foreground my-2">{line}</p>;
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">No Artifact Selected</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Ask Vox to create a document, and it will appear here in real-time.
      </p>
    </div>
  );
}

export function ArtifactCanvas() {
  const [activeTab, setActiveTab] = useState<ViewTab>("preview");
  const { currentArtifact, isLoading } = useArtifacts(DEFAULT_PROJECT_ID);
  
  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-card border-l border-border">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentArtifact) {
    return (
      <div className="h-full flex flex-col bg-card border-l border-border">
        <div className="panel-header">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm text-muted-foreground">Artifact Canvas</h2>
          </div>
        </div>
        <EmptyState />
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2 min-w-0">
          <ArtifactTypeIcon contentType={currentArtifact.content_type} />
          <h2 className="font-semibold text-sm truncate">{currentArtifact.title}</h2>
        </div>
        <button className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)} className="flex-1 flex flex-col min-h-0">
        <div className="border-b border-border px-4">
          <TabsList className="h-9 bg-transparent p-0 gap-4">
            <TabsTrigger
              value="preview"
              className="h-9 px-0 pb-2 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="h-9 px-0 pb-2 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Code className="w-3.5 h-3.5 mr-1.5" />
              Code
            </TabsTrigger>
            <TabsTrigger
              value="diff"
              className="h-9 px-0 pb-2 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <GitCompare className="w-3.5 h-3.5 mr-1.5" />
              Diff
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Content */}
        <TabsContent value="preview" className="flex-1 overflow-y-auto custom-scrollbar p-4 m-0">
          <MarkdownRenderer content={currentArtifact.content} />
        </TabsContent>

        <TabsContent value="code" className="flex-1 overflow-y-auto custom-scrollbar p-4 m-0">
          <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border border-border">
            {currentArtifact.content}
          </pre>
        </TabsContent>

        <TabsContent value="diff" className="flex-1 overflow-y-auto custom-scrollbar p-4 m-0">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <GitCompare className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Diff view coming soon
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              v{currentArtifact.version}
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Footer */}
      <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Last updated: {new Date(currentArtifact.updated_at).toLocaleTimeString()}</span>
        <span className="font-mono">v{currentArtifact.version} • {currentArtifact.content_type.toUpperCase()}</span>
      </div>
    </div>
  );
}
