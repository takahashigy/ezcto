import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Rocket, Package, FileText, Download, Loader2, Plus, ArrowLeft, Globe, Trash2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { DeploymentPaywall } from "@/components/DeploymentPaywall";
import { PublishModal } from "@/components/PublishModal";
import { GenerationHistorySection } from "@/components/GenerationHistorySection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { playSuccessSound } from "@/utils/notificationSound";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WalletConnectButton } from "@/components/WalletConnectButton";

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [deploymentPaywallOpen, setDeploymentPaywallOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ id: number; name: string; subdomain?: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: number; name: string } | null>(null);

  const previousProjectsRef = useRef<typeof projects>(undefined);

  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 3000, // 每3秒轮询一次，检查项目状态更新
  });

  const utils = trpc.useUtils();
  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully");
      utils.projects.list.invalidate();
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete project", {
        description: error.message,
      });
    },
  });

  const handleDeleteClick = (project: { id: number; name: string }) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate({ id: projectToDelete.id });
    }
  };



  // 监听项目状态变化，显示成功通知
  useEffect(() => {
    if (!projects || !previousProjectsRef.current) {
      previousProjectsRef.current = projects;
      return;
    }

    const previous = previousProjectsRef.current;
    const newlyCompleted = projects.filter(p => {
      const prev = previous.find(prev => prev.id === p.id);
      return prev && prev.status === 'generating' && p.status === 'completed';
    });

    newlyCompleted.forEach(project => {
      playSuccessSound();
      toast.success(
        `🎉 Project "${project.name}" generated successfully!`,
        {
          description: 'All assets are ready. Click "View Details" to explore.',
          duration: 5000,
        }
      );
    });

    previousProjectsRef.current = projects;
  }, [projects]);

  if (authLoading || projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-mono">LOADING SYSTEM...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="border-b-2 border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src="/EZ.png" alt="EZCTO" className="h-10" />
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-mono">
              {user?.email || user?.name}
            </span>
            <Link href="/">
              <Button variant="ghost" className="font-mono font-semibold text-[#2d3e2d] hover:bg-[#2d3e2d]/5">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('nav.home')}
              </Button>
            </Link>
            <WalletConnectButton />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <div className="container py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{t('dashboard.page.title')}</h1>
              <p className="text-muted-foreground font-mono">
                <span className="status-indicator active mr-2"></span>
                {t('dashboard.page.systemOnline')}
              </p>
            </div>
            <Link href="/launch">
              <Button size="lg" className="font-mono font-semibold retro-border bg-gradient-to-r from-[#2d3e2d] to-[#4a5f4a] text-[#e8dcc4] hover:shadow-[0_0_15px_rgba(0,255,65,0.6)] px-6 py-3">
                <Plus className="mr-2 h-5 w-5" />
                {t('dashboard.page.newProject')}
              </Button>
            </Link>
          </div>
          

        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="module-card">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-muted-foreground">{t('dashboard.stats.totalProjects')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{projects?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="module-card">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-muted-foreground">{t('dashboard.stats.completed')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {projects?.filter(p => p.status === 'completed').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="module-card">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-muted-foreground">{t('dashboard.stats.inProgress')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {projects?.filter(p => p.status === 'generating').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generation History */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('dashboard.page.generationHistory')}</h2>
          </div>
          <GenerationHistorySection />
        </div>

        {/* In Progress Projects */}
        {projects && projects.filter(p => p.status === 'generating').length > 0 && (
          <div className="space-y-6 mb-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
                {t('dashboard.page.inProgressProjects')}
              </h2>
            </div>
            <div className="grid gap-6">
              {projects.filter(p => p.status === 'generating').map((project: any) => (
                <Card key={project.id} className="module-card border-accent border-2 bg-accent/5">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                          {project.name}
                          <span className="px-3 py-1 text-xs font-mono font-bold border-2 border-accent bg-accent/10 text-accent">
                            GENERATING
                          </span>
                        </CardTitle>
                        <CardDescription className="text-base">
                          {project.description || t('dashboard.project.noDescription')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground mb-2">
                          {t('dashboard.inProgress.message')}
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-accent h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link href={`/launch/preview?projectId=${project.id}`}>
                        <Button className="font-mono retro-border bg-gradient-to-r from-[#2d3e2d] to-[#4a5f4a] text-[#e8dcc4] hover:shadow-[0_0_15px_rgba(0,255,65,0.6)]">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('dashboard.inProgress.viewProgress')}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Projects List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('dashboard.page.yourProjects')}</h2>
          </div>

          {!projects || projects.length === 0 ? (
            <Card className="module-card text-center py-12">
              <CardContent>
                <Rocket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{t('dashboard.empty.title')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('dashboard.empty.description')}
                </p>
                <Link href="/launch">
                  <Button size="lg" className="font-mono font-semibold retro-border bg-gradient-to-r from-[#2d3e2d] to-[#4a5f4a] text-[#e8dcc4] hover:shadow-[0_0_15px_rgba(0,255,65,0.6)] px-6 py-3">
                    <Plus className="mr-2 h-5 w-5" />
                    {t('dashboard.empty.button')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {projects.map((project: any) => (
                <Card key={project.id} className="module-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{project.name}</CardTitle>
                        <CardDescription className="text-base">
                          {project.description || t('dashboard.project.noDescription')}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 text-xs font-mono font-bold border-2 ${
                          project.status === 'completed' ? 'border-primary bg-primary/10 text-primary' :
                          project.status === 'generating' ? 'border-accent bg-accent/10 text-accent' :
                          project.status === 'failed' ? 'border-destructive bg-destructive/10 text-destructive' :
                          'border-border bg-muted text-muted-foreground'
                        }`}>
                          {project.status.toUpperCase()}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick({ id: project.id, name: project.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">{t('dashboard.project.ticker')}</div>
                        <div className="font-mono font-bold">{project.ticker || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">{t('dashboard.project.created')}</div>
                        <div className="font-mono">{new Date(project.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link href={`/project/${project.id}`}>
                        <Button className="font-mono retro-border">
                          <FileText className="mr-2 h-4 w-4" />
                          {t('dashboard.project.viewDetails')}
                        </Button>
                      </Link>
                      {project.status === 'completed' && (
                        <>
                          {project.deploymentStatus === 'deployed' && project.deploymentUrl ? (
                            <>
                              <Button
                                variant="default"
                                className="font-mono bg-green-600 hover:bg-green-700"
                                onClick={() => window.open(project.deploymentUrl, '_blank')}
                              >
                                <Globe className="mr-2 h-4 w-4" />
                                {t('dashboard.project.viewWebsite')}
                              </Button>
                              <Button
                                variant="outline"
                                className="font-mono"
                                onClick={() => {
                                  setSelectedProject({ 
                                    id: project.id, 
                                    name: project.name,
                                    subdomain: project.subdomain 
                                  });
                                  setIsEditMode(true);
                                  setPublishModalOpen(true);
                                }}
                              >
                                Edit Subdomain
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="default"
                              className="font-mono"
                              onClick={() => {
                                setSelectedProject({ id: project.id, name: project.name });
                                setIsEditMode(false);
                                setPublishModalOpen(true);
                              }}
                            >
                              <Globe className="mr-2 h-4 w-4" />
                              {t('dashboard.project.publish')}
                            </Button>
                          )}
                          <Link href={`/project/${project.id}`}>
                            <Button variant="outline" className="font-mono">
                              <Download className="mr-2 h-4 w-4" />
                              Download Assets
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Publish Modal */}
      {selectedProject && (
        <PublishModal
          open={publishModalOpen}
          onOpenChange={(open) => {
            setPublishModalOpen(open);
            if (!open) {
              setIsEditMode(false);
            }
          }}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          currentSubdomain={selectedProject.subdomain}
          isEdit={isEditMode}
          onPublishSuccess={() => {
            // Refetch projects to update UI
            window.location.reload();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Are you sure you want to delete <strong>{projectToDelete?.name}</strong>?
                </p>
                <p className="mt-4">
                  This will permanently delete:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>The project and all its metadata</li>
                  <li>All generated assets (logo, banner, PFP, poster, website)</li>
                  <li>All generation history records</li>
                </ul>
                <p className="mt-4">
                  <strong className="text-destructive">This action cannot be undone.</strong>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteProjectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProjectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deployment Paywall */}
      {selectedProject && (
        <DeploymentPaywall
          open={deploymentPaywallOpen}
          onOpenChange={setDeploymentPaywallOpen}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}
    </div>
  );
}
