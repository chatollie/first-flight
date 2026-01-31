import { Header } from "@/components/Header";
import { ToolRegistry } from "@/components/ToolRegistry";
import { TaskConsole } from "@/components/TaskConsole";
import { ArtifactCanvas } from "@/components/ArtifactCanvas";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const Index = () => {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Pane A: Tool Registry */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <ToolRegistry />
          </ResizablePanel>
          
          <ResizableHandle className="w-px bg-border hover:bg-primary/50 transition-colors" />
          
          {/* Pane B: Task Console */}
          <ResizablePanel defaultSize={45} minSize={30}>
            <TaskConsole />
          </ResizablePanel>
          
          <ResizableHandle className="w-px bg-border hover:bg-primary/50 transition-colors" />
          
          {/* Pane C: Artifact Canvas */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <ArtifactCanvas />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
