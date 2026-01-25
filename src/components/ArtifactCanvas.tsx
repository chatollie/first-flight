import { useState } from "react";
import { FileCode2, FileText, Table, Eye, Code, Quote, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type ArtifactType = "markdown" | "code" | "table";
type ViewMode = "preview" | "source";

interface Artifact {
  id: string;
  title: string;
  type: ArtifactType;
  content: string;
  citations?: string[];
  lastUpdated: Date;
}

const mockArtifact: Artifact = {
  id: "1",
  title: "AI Orchestration Technical Brief",
  type: "markdown",
  content: `# AI Agent Orchestration Patterns

## Executive Summary

Modern AI systems are moving from single-model inference to **multi-agent orchestration**. This shift enables complex task decomposition and specialized processing.

## Key Findings

### 1. State Management Paradigms

- **Shared Memory**: Agents read/write to a unified state store
- **Message Passing**: Event-driven communication between agents
- **Hierarchical Control**: Supervisor agents delegate to specialists

### 2. Orchestration Frameworks

| Framework | Language | Key Feature |
|-----------|----------|-------------|
| LangGraph | Python/JS | Cyclical graphs |
| CrewAI | Python | Role-based agents |
| AutoGen | Python | Multi-agent chat |

### 3. Critical Success Factors

1. **Context Preservation**: Maintaining state across agent handoffs
2. **Tool Integration**: MCP for dynamic capability discovery
3. **Human-in-the-Loop**: Approval gates for high-stakes operations

## Recommendations

> Focus on building a robust shared memory layer before scaling agent count. Context density is more valuable than agent diversity.
`,
  citations: [
    "LangChain Documentation - Agent Architectures",
    "Anthropic Research - Tool Use Patterns",
    "OpenAI Cookbook - Multi-Agent Systems",
  ],
  lastUpdated: new Date(),
};

function ArtifactTypeIcon({ type }: { type: ArtifactType }) {
  switch (type) {
    case "markdown":
      return <FileText className="w-4 h-4" />;
    case "code":
      return <FileCode2 className="w-4 h-4" />;
    case "table":
      return <Table className="w-4 h-4" />;
  }
}

function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown rendering - in production, use a proper markdown library
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
            // Parse bold text
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
          // Skip table header separator
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

export function ArtifactCanvas() {
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const artifact = mockArtifact;
  
  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2 min-w-0">
          <ArtifactTypeIcon type={artifact.type} />
          <h2 className="font-semibold text-sm truncate">{artifact.title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("preview")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "preview" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("source")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "source" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {viewMode === "preview" ? (
          <MarkdownRenderer content={artifact.content} />
        ) : (
          <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
            {artifact.content}
          </pre>
        )}
      </div>
      
      {/* Evidence Bar */}
      {artifact.citations && artifact.citations.length > 0 && (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <Quote className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Evidence Sources</span>
          </div>
          <div className="space-y-1">
            {artifact.citations.map((citation, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer group"
              >
                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-mono">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{citation}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Last updated: {artifact.lastUpdated.toLocaleTimeString()}</span>
        <span className="font-mono">{artifact.type.toUpperCase()}</span>
      </div>
    </div>
  );
}
