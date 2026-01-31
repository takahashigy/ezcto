import { useState, useEffect, useRef } from "react";
import { X, Terminal, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LogEntry {
  timestamp: string;
  category: "analysis" | "images" | "website" | "deployment" | "system";
  message: string;
  level: "info" | "success" | "error" | "warning";
}

interface LiveLogSidebarProps {
  logs: LogEntry[];
  isOpen: boolean;
  onToggle: () => void;
}

export function LiveLogSidebar({ logs, isOpen, onToggle }: LiveLogSidebarProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "analysis":
        return "text-blue-400";
      case "images":
        return "text-purple-400";
      case "website":
        return "text-green-400";
      case "deployment":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "warning":
        return "⚠";
      default:
        return "•";
    }
  };

  return (
    <>
      {/* Toggle Button - Fixed position */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          className="fixed right-4 top-24 z-50 retro-button font-mono font-semibold shadow-lg"
          size="sm"
        >
          <Terminal className="mr-2 h-4 w-4" />
          View Logs
          <ChevronLeft className="ml-2 h-4 w-4" />
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-[#1a1a1a] border-l-4 border-primary shadow-2xl transform transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-primary bg-[#0f0f0f]">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="font-mono font-bold text-primary text-lg">LIVE LOGS</span>
          </div>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Log Container */}
        <div
          ref={logContainerRef}
          className="h-[calc(100vh-120px)] overflow-y-auto p-4 space-y-2 font-mono text-sm"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            const isAtBottom =
              target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
            setAutoScroll(isAtBottom);
          }}
        >
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Waiting for logs...</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="p-3 rounded border border-primary/20 bg-[#0f0f0f]/50 hover:bg-[#0f0f0f] transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold text-xs mt-0.5">
                    {getLevelIcon(log.level)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase ${getCategoryColor(log.category)}`}>
                        [{log.category}]
                      </span>
                      <span className="text-xs text-gray-500">{log.timestamp}</span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed break-words">
                      {log.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t-2 border-primary bg-[#0f0f0f] flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono">
            {logs.length} log{logs.length !== 1 ? "s" : ""}
          </span>
          <Button
            onClick={() => setAutoScroll(!autoScroll)}
            variant="ghost"
            size="sm"
            className={`text-xs font-mono ${autoScroll ? "text-primary" : "text-gray-500"}`}
          >
            {autoScroll ? "Auto-scroll: ON" : "Auto-scroll: OFF"}
          </Button>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
        />
      )}
    </>
  );
}
