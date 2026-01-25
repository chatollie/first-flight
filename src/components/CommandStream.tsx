import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Zap, CheckCircle2, Circle, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages, type Message, type PlanStep } from "@/hooks/useMessages";
import { useOrchestrator } from "@/hooks/useOrchestrator";

function PlanStepper({ steps }: { steps: PlanStep[] }) {
  return (
    <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Execution Plan</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={step.id || index} className="flex items-start gap-3">
            <div className="pt-0.5">
              {step.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-status-active" />
              ) : step.status === "in-progress" ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className={cn(
                "text-sm",
                step.status === "completed" && "text-muted-foreground line-through",
                step.status === "in-progress" && "text-foreground",
                step.status === "pending" && "text-muted-foreground"
              )}>
                {step.label}
              </p>
              {step.agent && (
                <span className="text-xs text-primary">@{step.agent}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  
  return (
    <div className={cn(
      "animate-fade-in",
      isUser && "flex justify-end"
    )}>
      <div className={cn(
        "max-w-[85%] rounded-lg p-3",
        isUser && "bg-primary text-primary-foreground",
        message.role === "orchestrator" && "bg-secondary border border-border",
        isSystem && "bg-muted/30 border border-dashed border-border"
      )}>
        {isSystem && (
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">System</span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {message.plan && message.plan.length > 0 && <PlanStepper steps={message.plan} />}
        <p className={cn(
          "text-xs mt-2",
          isUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export function CommandStream() {
  const [input, setInput] = useState("");
  const { messages, isLoading: messagesLoading, addMessage, addLocalMessage, updateLocalMessage } = useMessages();
  const { sendMessage, isLoading: orchestratorLoading } = useOrchestrator();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingContentRef = useRef<string>("");
  const streamingPlanRef = useRef<PlanStep[]>([]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || orchestratorLoading) return;
    
    const userContent = input.trim();
    setInput("");
    
    // Add user message locally immediately
    const userMsgId = `local-user-${Date.now()}`;
    addLocalMessage({
      id: userMsgId,
      role: "user",
      content: userContent,
      timestamp: new Date(),
    });

    // Save user message to DB
    await addMessage("user", userContent);

    // Create streaming orchestrator message
    const streamMsgId = `local-orch-${Date.now()}`;
    streamingContentRef.current = "";
    streamingPlanRef.current = [];
    
    addLocalMessage({
      id: streamMsgId,
      role: "orchestrator",
      content: "",
      timestamp: new Date(),
    });

    // Build conversation history for context (exclude the just-added messages)
    const conversationHistory = messages
      .filter(m => m.role === "user" || m.role === "orchestrator")
      .map(m => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      }));

    try {
      await sendMessage(
        userContent,
        conversationHistory,
        {
          onDelta: (chunk) => {
            streamingContentRef.current += chunk;
            updateLocalMessage(streamMsgId, {
              content: streamingContentRef.current,
            });
          },
          onPlan: (plan) => {
            streamingPlanRef.current = plan.map((p, i) => ({
              ...p,
              id: `plan-${i}`,
            }));
            updateLocalMessage(streamMsgId, { 
              plan: streamingPlanRef.current,
            });
          },
          onDone: async () => {
            // Save to DB with plan
            if (streamingContentRef.current) {
              await addMessage(
                "orchestrator", 
                streamingContentRef.current,
                streamingPlanRef.current.map(p => ({
                  label: p.label,
                  agent: p.agent || "",
                  status: p.status,
                }))
              );
            }
          },
        }
      );
    } catch (error) {
      // Update message to show error
      updateLocalMessage(streamMsgId, {
        content: "I encountered an error processing your request. Please try again.",
      });
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="panel-header border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Command Stream</h2>
        </div>
        <span className={cn(
          "text-xs px-2 py-1 rounded-full border",
          orchestratorLoading 
            ? "bg-status-active/10 text-status-active border-status-active/20"
            : "bg-primary/10 text-primary border-primary/20"
        )}>
          {orchestratorLoading ? "Processing..." : "Orchestrator Online"}
        </span>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 grid-bg">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Zap className="w-12 h-12 text-primary/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Ready for Commands</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Enter a task and the orchestrator will coordinate your agent team to complete it.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your command..."
            disabled={orchestratorLoading}
            className="w-full pl-4 pr-12 py-3 text-sm bg-input border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={orchestratorLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {orchestratorLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
