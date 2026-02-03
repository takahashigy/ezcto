import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { LiveLogSidebar } from "@/components/LiveLogSidebar";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type ModuleStatus = "pending" | "in_progress" | "completed" | "failed";

interface ModuleProgress {
  name: string;
  status: ModuleStatus;
  description: string;
}

export default function LaunchV2Preview() {
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [isLogSidebarOpen, setIsLogSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<Array<{
    timestamp: string;
    category: "analysis" | "images" | "website" | "deployment" | "system";
    message: string;
    level: "info" | "success" | "error" | "warning";
  }>>([]);

  // Parse projectId from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("projectId");
    if (id) {
      setProjectId(parseInt(id));
    } else {
      toast.error(language === 'zh' ? '未提供项目ID' : 'No project ID provided');
      setLocation("/dashboard");
    }
  }, [setLocation]);

  // Connect to SSE for real-time logs
  useEffect(() => {
    if (!projectId) return;

    const eventSource = new EventSource(`/api/progress/${projectId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newLog = {
          timestamp: new Date().toLocaleTimeString(),
          category: data.category || "system",
          message: data.message,
          level: data.level || "info",
        };
        setLogs((prev) => [...prev, newLog]);
      } catch (error) {
        console.error("Failed to parse SSE data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [projectId]);

  // Poll project status
  const { data: project, refetch } = trpc.projects.getById.useQuery(
    { id: projectId! },
    {
      enabled: !!projectId,
      refetchInterval: 3000, // Poll every 3 seconds
    }
  );

  // Poll generation history for real-time step progress
  const { data: generationHistory } = trpc.generationHistory.getByProjectId.useQuery(
    { projectId: projectId! },
    {
      enabled: !!projectId && project?.status === "generating",
      refetchInterval: 1500, // Poll more frequently for progress updates
    }
  );

  // Retry generation mutation
  const retryGenerationMutation = trpc.launch.trigger.useMutation({
    onSuccess: () => {
      toast.success(language === 'zh' ? '重试已启动！' : 'Retry started!');
      refetch(); // Refresh project status
    },
    onError: (error) => {
      toast.error(`Retry failed: ${error.message}`);
    },
  });

  // Handle retry
  const handleRetry = async () => {
    if (!projectId || !project) return;

    try {
      // Get stored image URL and base64 if exists
      const storedImageUrl = localStorage.getItem(`project_${projectId}_imageUrl`);
      const storedImageBase64 = localStorage.getItem(`project_${projectId}_imageBase64`);
      
      // Check if we have image data
      if (!storedImageUrl && !storedImageBase64) {
        toast.error(
          language === 'zh' 
            ? '图片数据已丢失，请返回创建新项目' 
            : 'Image data lost. Please create a new project.'
        );
        return;
      }
      
      await retryGenerationMutation.mutateAsync({
        projectId: projectId,
        characterImageUrl: storedImageUrl || undefined,
        characterImageBase64: storedImageBase64 || undefined,
      });
    } catch (error) {
      console.error('[LaunchV2Preview] Retry error:', error);
    }
  };

  // Get step status from generation history metadata
  const getStepStatusFromHistory = (stepName: string): ModuleStatus => {
    if (!generationHistory?.metadata) return "pending";
    
    const metadata = generationHistory.metadata as {
      currentStep?: string;
      steps?: Array<{ step: string; status: ModuleStatus }>;
    };
    
    const step = metadata.steps?.find(s => s.step === stepName);
    if (step) {
      return step.status;
    }
    return "pending";
  };

  // Calculate module progress based on real generation history
  const getModuleStatus = (stepName: string): ModuleStatus => {
    // If project is completed, all modules are completed
    if (project?.status === "completed") return "completed";
    
    // If project failed, check which step failed
    if (project?.status === "failed") {
      const historyStatus = getStepStatusFromHistory(stepName);
      if (historyStatus === "failed") return "failed";
      if (historyStatus === "completed") return "completed";
      return "pending";
    }
    
    // If generating, use real-time step status from generation history
    if (project?.status === "generating") {
      return getStepStatusFromHistory(stepName);
    }
    
    return "pending";
  };

  const modules: ModuleProgress[] = [
    {
      name: t('launch.preview.analysis'),
      status: getModuleStatus('analysis'),
      description: t('launch.preview.analysisDesc'),
    },
    {
      name: t('launch.preview.images'),
      status: getModuleStatus('images'),
      description: t('launch.preview.imagesDesc'),
    },
    {
      name: t('launch.preview.website'),
      status: getModuleStatus('website'),
      description: t('launch.preview.websiteDesc'),
    },
    {
      name: t('launch.preview.deployment'),
      status: project?.deploymentUrl ? "completed" : getModuleStatus('deployment'),
      description: t('launch.preview.deploymentDesc'),
    },
  ];

  // Calculate overall progress
  const completedModules = modules.filter((m) => m.status === "completed").length;
  const totalModules = modules.length;
  const progressPercent = (completedModules / totalModules) * 100;

  // Check if all modules are completed
  const isCompleted = completedModules === totalModules;
  const isFailed = project?.status === "failed";

  // Clear localStorage when project is completed or failed
  useEffect(() => {
    if ((isCompleted || isFailed) && projectId) {
      const stored = localStorage.getItem('currentGeneratingProject');
      if (stored) {
        try {
          const { projectId: storedId } = JSON.parse(stored);
          if (storedId === projectId) {
            localStorage.removeItem('currentGeneratingProject');
          }
        } catch (error) {
          console.error('Failed to parse stored project:', error);
        }
      }
    }
  }, [isCompleted, isFailed, projectId]);

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
      {/* Header - Consistent with Home page */}
      <nav className="border-b-2 border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src="/EZ.png" alt="EZCTO" className="h-10" />
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="font-mono font-semibold text-[#2d3e2d] hover:bg-[#2d3e2d]/5">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("launch.preview.backToDashboard")}
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsLogSidebarOpen(true)}
              className="font-mono font-semibold border-2 border-[#2d3e2d]"
            >
              View Logs
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Project Info */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black font-mono text-[#2d3e2d] mb-2">
              {project.name}
            </h1>
            <p className="text-lg font-mono text-[#2d3e2d]/70">
              {project.ticker}
            </p>
          </div>

          {/* Overall Progress */}
          <Card className="retro-border bg-[#f5f0e8] border-4 border-[#2d3e2d] shadow-[8px_8px_0px_0px_rgba(45,62,45,1)] mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-black font-mono text-[#2d3e2d]">
                {isCompleted ? "✅ Generation Complete!" : isFailed ? "❌ Generation Failed" : "🚀 Generating Your Project"}
              </CardTitle>
              <CardDescription className="text-[#2d3e2d]/70 font-mono">
                {isCompleted
                  ? t("launch.preview.redirecting")
                  : isFailed
                  ? t("launch.preview.failedDesc")
                  : `${completedModules} ${t("launch.preview.completedOf")} ${totalModules} ${t("launch.preview.modulesCompleted")}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-6 bg-[#2d3e2d]/10 border-2 border-[#2d3e2d] overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#2d3e2d] to-[#4a5f4a] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm font-mono font-bold text-[#2d3e2d] mt-2 text-right">
                {Math.round(progressPercent)}%
              </p>
            </CardContent>
          </Card>

          {/* Module Progress */}
          <div className="space-y-4">
            {modules.map((module, index) => (
              <Card
                key={module.name}
                className={`retro-border bg-[#f5f0e8] border-4 border-[#2d3e2d] transition-all ${
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
                      <h3 className="text-xl font-black font-mono text-[#2d3e2d] mb-1">
                        {index + 1}. {module.name}
                      </h3>
                      <p className="text-sm font-mono text-[#2d3e2d]/70">
                        {module.description}
                      </p>
                      {module.status === "in_progress" && (
                        <p className="text-sm font-mono text-[#2d3e2d] font-bold mt-2">
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
            <Card className="retro-border bg-[#f5f0e8] border-4 border-[#2d3e2d] shadow-[8px_8px_0px_0px_rgba(45,62,45,1)] mt-8">
              <CardHeader>
                <CardTitle className="text-2xl font-black font-mono text-[#2d3e2d]">🌐 {t("launch.preview.websiteLive")}</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={project.deploymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-lg font-mono font-semibold text-[#2d3e2d] hover:underline break-all"
                >
                  {project.deploymentUrl}
                  <ExternalLink className="h-5 w-5 flex-shrink-0" />
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
                t("launch.preview.viewDetails")
              </Button>
              {project.deploymentUrl && (
                <Button
                  size="lg"
                  asChild
                  variant="outline"
                  className="border-4 border-[#2d3e2d] shadow-[4px_4px_0px_0px_rgba(45,62,45,1)]"
                >
                  <a href={project.deploymentUrl} target="_blank" rel="noopener noreferrer">
                    t("launch.preview.visitWebsite")
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          )}

          {isFailed && (
            <Card className="retro-border bg-[#f5f0e8] border-4 border-[#2d3e2d] shadow-[8px_8px_0px_0px_rgba(45,62,45,1)] mt-8">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <p className="text-lg font-mono text-[#2d3e2d]">
                    {language === 'zh' ? '生成失败，但不用担心！' : 'Generation failed, but don\'t worry!'}
                  </p>
                  <p className="text-sm font-mono text-[#2d3e2d]/70">
                    {language === 'zh' ? '你可以直接重试，无需重新创建项目或支付。' : 'You can retry directly without recreating the project or paying again.'}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      size="lg"
                      onClick={handleRetry}
                      disabled={retryGenerationMutation.isPending}
                      className="bg-[#2d3e2d] hover:bg-[#2d3e2d]/90 text-[#e8dcc4] font-bold font-mono border-4 border-[#2d3e2d] shadow-[4px_4px_0px_0px_rgba(45,62,45,1)]"
                    >
                      {retryGenerationMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {language === 'zh' ? '重试中...' : 'Retrying...'}
                        </>
                      ) : (
                        <>
                          🔄 {language === 'zh' ? '重试生成' : 'Retry Generation'}
                        </>
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setLocation("/launch-v2")}
                      className="font-bold font-mono border-4 border-[#2d3e2d] shadow-[4px_4px_0px_0px_rgba(45,62,45,1)]"
                    >
                      {language === 'zh' ? '创建新项目' : 'Create New Project'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Live Log Sidebar */}
      <LiveLogSidebar
        logs={logs}
        isOpen={isLogSidebarOpen}
        onToggle={() => setIsLogSidebarOpen(!isLogSidebarOpen)}
      />
    </div>
  );
}
