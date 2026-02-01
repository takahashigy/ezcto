import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link, useParams, useLocation } from "wouter";
import { Loader2, ArrowLeft, Download, ExternalLink, Image as ImageIcon, FileText, Package, CheckCircle2, XCircle, Clock } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { DeploymentPaywall } from "@/components/DeploymentPaywall";
import { downloadProjectAsZip } from "@/utils/zipDownload";
import { toast } from "sonner";
import { WalletConnectButton } from "@/components/WalletConnectButton";

export default function ProjectDetails() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0");
  const [deploymentPaywallOpen, setDeploymentPaywallOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = trpc.projects.getById.useQuery(
    { id: projectId },
    { enabled: isAuthenticated && projectId > 0 }
  );

  const { data: assets, isLoading: assetsLoading } = trpc.assets.listByProject.useQuery(
    { projectId },
    { enabled: isAuthenticated && projectId > 0 }
  );

  // 所有Hooks必须在条件判断之前调用
  const downloadZipMutation = trpc.assets.downloadProjectZip.useMutation();

  if (authLoading || projectLoading || assetsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-mono">LOADING PROJECT...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">Project Not Found</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const groupedAssets = {
    logo: assets?.find(a => a.assetType === 'logo'),
    paydexBanner: assets?.find(a => a.assetType === 'paydex_banner'),
    xBanner: assets?.find(a => a.assetType === 'x_banner'),
    heroBackground: assets?.find(a => a.assetType === 'hero_background'),
    featureIcons: assets?.filter(a => a.assetType === 'feature_icon') || [],
    communityScene: assets?.find(a => a.assetType === 'community_scene'),
    website: assets?.find(a => a.assetType === 'website'),
  };

  const isPaid = project?.deploymentStatus === 'deployed';
  const isDeployed = !!project?.deploymentUrl;

  const handleDownloadZip = async () => {
    // 检查是否已付费
    if (!isPaid) {
      setDeploymentPaywallOpen(true);
      return;
    }

    try {
      toast.loading("Preparing download...", {
        description: "Collecting all project assets",
      });

      const result = await downloadZipMutation.mutateAsync({ projectId });
      
      await downloadProjectAsZip(result.projectName, result.assets);
      
      toast.success("Download complete!", {
        description: `${result.projectName}-assets.zip has been downloaded`,
      });
    } catch (error) {
      toast.error("Download failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleDownloadMarketingKit = async () => {
    // 检查是否已付费
    if (!isPaid) {
      setDeploymentPaywallOpen(true);
      return;
    }

    try {
      toast.loading("Preparing Marketing Kit...", {
        description: "Collecting PayDex Banner, X Banner, and Logo",
      });

      // 只打包营销素材（PayDex Banner、X Banner、Logo）
      const rawAssets = [
        groupedAssets.paydexBanner,
        groupedAssets.xBanner,
        groupedAssets.logo,
      ];
      
      console.log('[MarketingKit] Raw assets:', rawAssets);
      
      const marketingAssets = rawAssets.filter(Boolean).map(asset => ({
        type: asset!.assetType,
        url: asset!.fileUrl,
        textContent: asset!.textContent,
      }));
      
      console.log('[MarketingKit] Processed assets:', marketingAssets);
      
      if (marketingAssets.length === 0) {
        toast.dismiss();
        toast.error("No marketing assets available", {
          description: "Please wait for asset generation to complete",
        });
        return;
      }

      await downloadProjectAsZip(`${project.name}-marketing-kit`, marketingAssets);
      
      toast.success("Marketing Kit downloaded!", {
        description: `${project.name}-marketing-kit.zip has been downloaded`,
      });
    } catch (error) {
      toast.error("Download failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="border-b-2 border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="font-mono">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <WalletConnectButton />
        </div>
      </nav>

      <div className="container py-12">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
              <p className="text-muted-foreground font-mono mb-4">
                {project.description || "No description provided"}
              </p>
              <div className="flex items-center gap-4">
                <Badge variant={
                  project.status === 'completed' ? 'default' :
                  project.status === 'generating' ? 'secondary' :
                  project.status === 'failed' ? 'destructive' :
                  'outline'
                } className="font-mono">
                  {project.status === 'completed' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                  {project.status === 'generating' && <Clock className="mr-1 h-3 w-3 animate-spin" />}
                  {project.status === 'failed' && <XCircle className="mr-1 h-3 w-3" />}
                  {project.status.toUpperCase()}
                </Badge>
                {project.ticker && (
                  <span className="text-sm text-muted-foreground font-mono">
                    Ticker: <span className="font-bold">{project.ticker}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleDownloadMarketingKit}
              size="lg" 
              className="font-mono retro-border"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Marketing Kit
            </Button>
            <Button 
              onClick={handleDownloadZip}
              variant="outline"
              size="lg" 
              className="font-mono retro-border"
            >
              <Package className="mr-2 h-5 w-5" />
              Download All Assets
            </Button>
            {isDeployed && (
              <Button asChild variant="outline" size="lg" className="font-mono retro-border">
                <a href={project.deploymentUrl!} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Visit Website
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Assets Grid */}
        <div className="space-y-8">
          {/* Marketing Assets Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Marketing Assets</h2>
            <p className="text-muted-foreground">Ready-to-use banners and logo for promoting your meme coin</p>
            
            <div className="space-y-6">
              {/* PayDex Banner (1500×500) */}
              {groupedAssets.paydexBanner && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      PayDex Banner (1500×500)
                    </CardTitle>
                    <CardDescription>
                      Optimized for PayDex listing with centered ticker text
                      {!isPaid && <span className="text-yellow-500 ml-2">⚠️ Watermarked</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {groupedAssets.paydexBanner.fileUrl && (
                      <div className="space-y-4">
                        <div className="relative w-full bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: '1500/500' }}>
                          <img 
                            src={groupedAssets.paydexBanner.fileUrl} 
                            alt="PayDex Banner" 
                            className="w-full h-full object-cover"
                          />
                          {!isPaid && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="text-white/30 text-6xl font-bold transform -rotate-45 select-none"
                                style={{
                                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                  letterSpacing: '0.2em'
                                }}>
                                EZCTO
                              </div>
                            </div>
                          )}
                        </div>
                        {isPaid && (
                          <Button asChild className="w-full">
                            <a href={groupedAssets.paydexBanner.fileUrl} download target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              Download PayDex Banner (No Watermark)
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* X/Twitter Banner (1200×480) */}
              {groupedAssets.xBanner && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      X/Twitter Banner (1200×480)
                    </CardTitle>
                    <CardDescription>
                      Optimized for X/Twitter profile banner with centered ticker text
                      {!isPaid && <span className="text-yellow-500 ml-2">⚠️ Watermarked</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {groupedAssets.xBanner.fileUrl && (
                      <div className="space-y-4">
                        <div className="relative w-full bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: '1200/480' }}>
                          <img 
                            src={groupedAssets.xBanner.fileUrl} 
                            alt="X Banner" 
                            className="w-full h-full object-cover"
                          />
                          {!isPaid && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="text-white/30 text-6xl font-bold transform -rotate-45 select-none"
                                style={{
                                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                  letterSpacing: '0.2em'
                                }}>
                                EZCTO
                              </div>
                            </div>
                          )}
                        </div>
                        {isPaid && (
                          <Button asChild className="w-full">
                            <a href={groupedAssets.xBanner.fileUrl} download target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              Download X Banner (No Watermark)
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Logo */}
              {groupedAssets.logo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Logo (512×512)
                    </CardTitle>
                    <CardDescription>
                      High-resolution logo for avatars, icons, and watermarks
                      {!isPaid && <span className="text-yellow-500 ml-2">⚠️ Watermarked</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {groupedAssets.logo.fileUrl && (
                      <div className="space-y-4">
                        <div className="relative w-64 aspect-square bg-muted rounded-lg overflow-hidden mx-auto">
                          <img 
                            src={groupedAssets.logo.fileUrl} 
                            alt="Logo" 
                            className="w-full h-full object-contain p-4"
                          />
                          {!isPaid && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="text-white/30 text-4xl font-bold transform -rotate-45 select-none"
                                style={{
                                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                  letterSpacing: '0.1em'
                                }}>
                                EZCTO
                              </div>
                            </div>
                          )}
                        </div>
                        {isPaid && (
                          <Button asChild className="w-full">
                            <a href={groupedAssets.logo.fileUrl} download target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              Download Logo (No Watermark)
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Website Decoration Assets Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Website Decoration Assets</h2>
            <p className="text-muted-foreground">Background images and icons used in your generated website</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hero Background */}
              {groupedAssets.heroBackground && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Hero Background (1920×1080)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {groupedAssets.heroBackground.fileUrl && (
                      <div className="relative w-full bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                        <img 
                          src={groupedAssets.heroBackground.fileUrl} 
                          alt="Hero Background" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Community Scene */}
              {groupedAssets.communityScene && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Community Scene (800×600)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {groupedAssets.communityScene.fileUrl && (
                      <div className="relative w-full bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                        <img 
                          src={groupedAssets.communityScene.fileUrl} 
                          alt="Community Scene" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Feature Icons */}
            {groupedAssets.featureIcons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Feature Icons (256×256)
                  </CardTitle>
                  <CardDescription>
                    Icons used in the Features section of your website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {groupedAssets.featureIcons.map((icon, index) => (
                      <div key={icon.id} className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={icon.fileUrl || ''} 
                          alt={`Feature Icon ${index + 1}`} 
                          className="w-full h-full object-contain p-4"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Website */}
          {groupedAssets.website && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generated Website
                </CardTitle>
                <CardDescription>
                  Complete HTML website with all assets integrated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button asChild className="flex-1">
                    <a 
                      href={`data:text/html;charset=utf-8,${encodeURIComponent(groupedAssets.website.textContent || '')}`}
                      download={`${project.name.toLowerCase().replace(/\s+/g, '-')}-website.html`}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download HTML
                    </a>
                  </Button>
                  {isDeployed && (
                    <Button asChild variant="outline" className="flex-1">
                      <a href={project.deploymentUrl!} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Live Website
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Deployment Paywall */}
      <DeploymentPaywall
        open={deploymentPaywallOpen}
        onOpenChange={setDeploymentPaywallOpen}
        projectId={projectId}
        projectName={project.name}
      />
    </div>
  );
}
