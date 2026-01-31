import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Rocket, Package, FileText, Download, Loader2, Plus, ArrowLeft, Globe } from "lucide-react";
import { getLoginUrl } from "@/const";
import { DeploymentPaywall } from "@/components/DeploymentPaywall";
import { PublishModal } from "@/components/PublishModal";
import { GenerationHistorySection } from "@/components/GenerationHistorySection";
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

  const previousProjectsRef = useRef<typeof projects>(undefined);

  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 3000, // 每3秒轮询一次，检查项目状态更新
  });



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
              <Button variant="ghost" className="font-mono">
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
              <Button size="lg" className="font-mono retro-border">
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
                  <Button size="lg" className="font-mono retro-border">
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
                      <div>
                        <CardTitle className="text-2xl mb-2">{project.name}</CardTitle>
                        <CardDescription className="text-base">
                          {project.description || t('dashboard.project.noDescription')}
                        </CardDescription>
                      </div>
                      <div className={`px-3 py-1 text-xs font-mono font-bold border-2 ${
                        project.status === 'completed' ? 'border-primary bg-primary/10 text-primary' :
                        project.status === 'generating' ? 'border-accent bg-accent/10 text-accent' :
                        project.status === 'failed' ? 'border-destructive bg-destructive/10 text-destructive' :
                        'border-border bg-muted text-muted-foreground'
                      }`}>
                        {project.status.toUpperCase()}
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
                          <Button variant="outline" className="font-mono">
                            <Download className="mr-2 h-4 w-4" />
                            Download Assets
                          </Button>
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
