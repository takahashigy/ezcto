import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";

type ModuleStatus = "pending" | "in_progress" | "completed" | "failed";

interface ModuleProgress {
  name: string;
  status: ModuleStatus;
  description: string;
}

export default function LaunchV2Preview() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [projectId, setProjectId] = useState<number | null>(null);

  // Parse projectId from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("projectId");
    if (id) {
      setProjectId(parseInt(id));
    } else {
      toast.error("No project ID provided");
      setLocation("/dashboard");
    }
  }, [setLocation]);

  // Poll project status
  const { data: project, refetch } = trpc.projects.getById.useQuery(
    { id: projectId! },
    {
      enabled: !!projectId,
      refetchInterval: 3000, // Poll every 3 seconds
    }
  );

  // Calculate module progress based on project status
  // Since we don't have real-time module tracking yet, we'll simulate progress
  const getModuleStatus = (index: number): ModuleStatus => {
    if (project?.status === "completed") return "completed";
    if (project?.status === "failed") return index === 0 ? "failed" : "pending";
    if (project?.status === "generating") {
      // Simulate progressive completion
      if (project.deploymentUrl) {
        return "completed"; // All modules completed
      }
      // For now, show first module as in_progress, others as pending
      return index === 0 ? "in_progress" : "pending";
    }
    return "pending";
  };

  const modules: ModuleProgress[] = [
    {
      name: "Analysis",
      status: getModuleStatus(0),
      description: "AI analyzing your project and determining design style",
    },
    {
      name: "Images",
      status: getModuleStatus(1),
      description: "Generating 6 unique images (logo, banner, PFP, poster, website, character)",
    },
    {
      name: "Website",
      status: getModuleStatus(2),
      description: "Creating complete website with your branding",
    },
    {
      name: "Deployment",
      status: project?.deploymentUrl ? "completed" : getModuleStatus(3),
      description: "Deploying to public URL",
    },
  ];

  // Calculate overall progress
  const completedModules = modules.filter((m) => m.status === "completed").length;
  const totalModules = modules.length;
  const progressPercent = (completedModules / totalModules) * 100;

  // Check if all modules are completed
  const isCompleted = completedModules === totalModules;
  const isFailed = project?.status === "failed";

  // Redirect to project details when completed
  useEffect(() => {
    if (isCompleted && projectId) {
      toast.success("🎉 Project generation completed!");
      setTimeout(() => {
        setLocation(`/project/${projectId}`);
      }, 2000);
    }
  }, [isCompleted, projectId, setLocation]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8dcc4]">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please login to view this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8dcc4]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2d3e2d]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8dcc4]">
      {/* Header */}
      <header className="border-b-4 border-[#2d3e2d] bg-[#e8dcc4] sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Sparkles className="h-6 w-6 text-[#2d3e2d]" />
              <span className="font-bold text-xl text-[#2d3e2d]">EZCTO</span>
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-[#2d3e2d]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Project Info */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-[#2d3e2d] mb-2">
              {project.name}
            </h1>
            <p className="text-lg text-[#2d3e2d]/70">
              {project.ticker}
            </p>
          </div>

          {/* Overall Progress */}
          <Card className="border-4 border-[#2d3e2d] shadow-[8px_8px_0px_0px_rgba(45,62,45,1)] mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-[#2d3e2d]">
                {isCompleted ? "✅ Generation Complete!" : isFailed ? "❌ Generation Failed" : "🚀 Generating Your Project"}
              </CardTitle>
              <CardDescription className="text-[#2d3e2d]/70">
                {isCompleted
                  ? "Your project is ready! Redirecting to project details..."
                  : isFailed
                  ? "Something went wrong. Please try again."
                  : `${completedModules} of ${totalModules} modules completed`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercent} className="h-4" />
              <p className="text-sm text-[#2d3e2d]/60 mt-2 text-right">
                {Math.round(progressPercent)}%
              </p>
            </CardContent>
          </Card>

          {/* Module Progress */}
          <div className="space-y-4">
            {modules.map((module, index) => (
              <Card
                key={module.name}
                className={`border-4 border-[#2d3e2d] transition-all ${
                  module.status === "in_progress"
                    ? "shadow-[8px_8px_0px_0px_rgba(45,62,45,1)] scale-105"
                    : "shadow-[4px_4px_0px_0px_rgba(45,62,45,1)]"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {module.status === "completed" && (
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      )}
                      {module.status === "in_progress" && (
                        <Loader2 className="h-8 w-8 animate-spin text-[#2d3e2d]" />
                      )}
                      {module.status === "failed" && (
                        <XCircle className="h-8 w-8 text-red-600" />
                      )}
                      {module.status === "pending" && (
                        <div className="h-8 w-8 rounded-full border-4 border-[#2d3e2d]/20" />
                      )}
                    </div>

                    {/* Module Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[#2d3e2d] mb-1">
                        {index + 1}. {module.name}
                      </h3>
                      <p className="text-sm text-[#2d3e2d]/70">
                        {module.description}
                      </p>
                      {module.status === "in_progress" && (
                        <p className="text-sm text-[#2d3e2d] font-semibold mt-2">
                          ⏳ In progress...
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Deployment URL */}
          {project.deploymentUrl && (
            <Card className="border-4 border-[#2d3e2d] shadow-[8px_8px_0px_0px_rgba(45,62,45,1)] mt-8">
              <CardHeader>
                <CardTitle className="text-2xl text-[#2d3e2d]">🌐 Your Website is Live!</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={project.deploymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-lg text-[#2d3e2d] hover:underline"
                >
                  {project.deploymentUrl}
                  <ExternalLink className="h-5 w-5" />
                </a>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {isCompleted && (
            <div className="mt-8 flex justify-center gap-4">
              <Button
                size="lg"
                onClick={() => setLocation(`/project/${projectId}`)}
                className="bg-[#2d3e2d] hover:bg-[#2d3e2d]/90 text-[#e8dcc4] font-bold border-4 border-[#2d3e2d] shadow-[4px_4px_0px_0px_rgba(45,62,45,1)]"
              >
                View Project Details
              </Button>
              {project.deploymentUrl && (
                <Button
                  size="lg"
                  asChild
                  variant="outline"
                  className="border-4 border-[#2d3e2d] shadow-[4px_4px_0px_0px_rgba(45,62,45,1)]"
                >
                  <a href={project.deploymentUrl} target="_blank" rel="noopener noreferrer">
                    Visit Website
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          )}

          {isFailed && (
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                onClick={() => setLocation("/launch-v2")}
                className="bg-[#2d3e2d] hover:bg-[#2d3e2d]/90 text-[#e8dcc4] font-bold border-4 border-[#2d3e2d] shadow-[4px_4px_0px_0px_rgba(45,62,45,1)]"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
