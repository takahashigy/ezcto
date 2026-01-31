import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { GenerationPreview } from "@/components/GenerationPreview";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function LaunchPreview() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Get projectId from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("projectId");
    if (id) {
      setProjectId(parseInt(id, 10));
    } else {
      toast.error("No project ID provided");
      setLocation("/launch");
    }
  }, [setLocation]);

  const handleComplete = () => {
    setIsCompleted(true);
    toast.success("Generation completed! Redirecting to dashboard...");
    setTimeout(() => {
      setLocation("/dashboard");
    }, 2000);
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/launch">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Launch
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Generation in Progress</h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Instructions */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Your Meme CTO is Being Created</h2>
            <p className="text-muted-foreground">
              This process takes approximately 8-12 minutes. You can watch the progress below.
            </p>
          </div>

          {/* Generation Preview */}
          <GenerationPreview projectId={projectId} onComplete={handleComplete} />

          {/* Completion Actions */}
          {isCompleted && (
            <div className="flex flex-col items-center gap-4 p-6 bg-secondary/50 rounded-lg">
              <p className="text-lg font-medium text-center">
                🎉 Your project is ready!
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setLocation("/dashboard")}>
                  View Dashboard
                </Button>
                <Button variant="outline" onClick={() => setLocation(`/projects/${projectId}`)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Project
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
