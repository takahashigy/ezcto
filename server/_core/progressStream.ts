/**
 * Server-Sent Events (SSE) progress streaming
 * 
 * Usage:
 *   // Server-side (in Express route):
 *   const stream = createProgressStream(res);
 *   stream.send({ progress: 25, message: "Generating logo..." });
 *   stream.send({ progress: 50, message: "Generating banner..." });
 *   stream.close();
 * 
 *   // Client-side:
 *   const eventSource = new EventSource('/api/progress/123');
 *   eventSource.onmessage = (event) => {
 *     const { progress, message } = JSON.parse(event.data);
 *     console.log(`${progress}%: ${message}`);
 *   };
 */

import type { Response } from "express";

export type ProgressEvent = {
  progress: number; // 0-100
  message: string;
  step?: string;
  error?: string;
  // Extended log fields
  category?: "analysis" | "images" | "website" | "deployment" | "system";
  level?: "info" | "success" | "error" | "warning";
  timestamp?: string;
};

export type ProgressStream = {
  send: (event: ProgressEvent) => void;
  close: () => void;
};

/**
 * Create a Server-Sent Events stream for progress updates
 */
export function createProgressStream(res: Response): ProgressStream {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  
  // Send initial connection message
  res.write(": connected\n\n");
  
  return {
    send(event: ProgressEvent) {
      const data = JSON.stringify(event);
      res.write(`data: ${data}\n\n`);
    },
    
    close() {
      res.write("event: close\ndata: done\n\n");
      res.end();
    },
  };
}

/**
 * In-memory store for progress streams
 * Key: projectId, Value: ProgressStream
 */
const progressStreams = new Map<number, ProgressStream[]>();

/**
 * Register a progress stream for a project
 */
export function registerProgressStream(projectId: number, stream: ProgressStream): void {
  const streams = progressStreams.get(projectId) || [];
  streams.push(stream);
  progressStreams.set(projectId, streams);
}

/**
 * Unregister a progress stream for a project
 */
export function unregisterProgressStream(projectId: number, stream: ProgressStream): void {
  const streams = progressStreams.get(projectId) || [];
  const index = streams.indexOf(stream);
  if (index !== -1) {
    streams.splice(index, 1);
  }
  if (streams.length === 0) {
    progressStreams.delete(projectId);
  }
}

/**
 * Broadcast progress update to all streams for a project
 */
export function broadcastProgress(projectId: number, event: ProgressEvent): void {
  const streams = progressStreams.get(projectId) || [];
  streams.forEach(stream => {
    try {
      stream.send(event);
    } catch (error) {
      console.error(`[Progress] Failed to send to stream:`, error);
    }
  });
}

/**
 * Close all streams for a project
 */
export function closeAllStreams(projectId: number): void {
  const streams = progressStreams.get(projectId) || [];
  streams.forEach(stream => {
    try {
      stream.close();
    } catch (error) {
      console.error(`[Progress] Failed to close stream:`, error);
    }
  });
  progressStreams.delete(projectId);
}
