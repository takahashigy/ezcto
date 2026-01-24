import { useEffect, useState, useRef } from "react";

export type ProgressEvent = {
  progress: number; // 0-100
  message: string;
  step?: string;
  error?: string;
};

export function useProgress(projectId: number | null) {
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    // Create EventSource connection
    const eventSource = new EventSource(`/api/progress/${projectId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[Progress] Connected to progress stream");
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);
        console.log("[Progress]", data);
        setProgress(data);
      } catch (error) {
        console.error("[Progress] Failed to parse event:", error);
      }
    };

    eventSource.addEventListener("close", () => {
      console.log("[Progress] Stream closed");
      setIsConnected(false);
      eventSource.close();
    });

    eventSource.onerror = (error) => {
      console.error("[Progress] Connection error:", error);
      setIsConnected(false);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [projectId]);

  return {
    progress,
    isConnected,
  };
}
