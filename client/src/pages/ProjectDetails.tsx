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
    banner: assets?.find(a => a.assetType === 'banner'),
    poster: assets?.find(a => a.assetType === 'poster'),
    narrative: assets?.find(a => a.assetType === 'narrative'),
    whitepaper: assets?.find(a => a.assetType === 'whitepaper'),
    tweets: assets?.filter(a => a.assetType === 'tweet') || [],
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
        description: error instanceof Error ? error.message : "Failed to download assets",
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
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-mono">
              {user?.email || user?.name}
            </span>
            <WalletConnectButton />
          </div>
        </div>
      </nav>

      <div className="container py-12">
        {/* Project Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
            {project.ticker && (
              <p className="text-xl text-muted-foreground font-mono">${project.ticker}</p>
            )}
            {project.description && (
              <p className="mt-4 text-muted-foreground max-w-2xl">{project.description}</p>
            )}
            <div className="mt-4 flex items-center gap-4 flex-wrap">
              {/* Generation Status */}
              {project.status === 'completed' && (
                <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Generated Successfully
                </Badge>
              )}
              {project.status === 'generating' && (
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500">
                  <Clock className="mr-1 h-3 w-3 animate-spin" />
                  Generating...
                </Badge>
              )}
              {project.status === 'failed' && (
                <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500">
                  <XCircle className="mr-1 h-3 w-3" />
                  Generation Failed
                </Badge>
              )}

              {/* Payment Status */}
              {isPaid ? (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-500 border-blue-500">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Paid
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-500/20 text-gray-500 border-gray-500">
                  Unpaid
                </Badge>
              )}

              {/* Deployment Status */}
              {isDeployed && (
                <Badge variant="outline" className="bg-purple-500/20 text-purple-500 border-purple-500">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Published
                </Badge>
              )}

              {project.styleTemplate && (
                <Badge variant="outline" className="font-mono">
                  {project.styleTemplate.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleDownloadZip} size="lg" className="font-mono">
              <Package className="mr-2 h-4 w-4" />
              Download ZIP
            </Button>
            
            {/* 网站发布状态按钮 */}
            {!isPaid && project.status === 'completed' && (
              <Button 
                onClick={() => setDeploymentPaywallOpen(true)}
                size="lg" 
                variant="default"
                className="font-mono"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Publish Website
              </Button>
            )}
            {isPaid && isDeployed && (
              <Button 
                asChild
                size="lg" 
                variant="default"
                className="font-mono"
              >
                <a href={project.deploymentUrl!} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Website
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Assets Grid */}
        <div className="space-y-6">
          {/* Banner (1500×500) */}
          {groupedAssets.banner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Twitter/X Banner (1500×500)
                </CardTitle>
                <CardDescription>
                  Optimized for Twitter/X profile banner
                  {!isPaid && <span className="text-yellow-500 ml-2">⚠️ Watermarked</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {groupedAssets.banner.fileUrl && (
                  <div className="space-y-4">
                    <div className="relative w-full bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: '1500/500' }}>
                      <img 
                        src={groupedAssets.banner.fileUrl} 
                        alt="Banner" 
                        className="w-full h-full object-cover"
                      />
                      {!isPaid && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {/* 对角线重复水印 */}
                          <div className="absolute inset-0 flex flex-wrap">
                            {[...Array(6)].map((_, i) => (
                              <div
                                key={i}
                                className="text-white/60 text-8xl font-black transform -rotate-45"
                                style={{
                                  position: 'absolute',
                                  top: `${(i % 2) * 50}%`,
                                  left: `${(i % 3) * 33}%`,
                                  textShadow: '2px 2px 8px rgba(0,0,0,0.8), -2px -2px 8px rgba(0,0,0,0.8)',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                EZCTO
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {isPaid && (
                      <Button asChild className="w-full">
                        <a href={groupedAssets.banner.fileUrl} download target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download Banner (No Watermark)
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Logo and Poster (1:1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            {groupedAssets.logo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Logo
                  </CardTitle>
                  {!isPaid && <CardDescription className="text-yellow-500">⚠️ Watermarked</CardDescription>}
                </CardHeader>
                <CardContent>
                  {groupedAssets.logo.fileUrl && (
                    <div className="space-y-4">
                      <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={groupedAssets.logo.fileUrl} 
                          alt="Logo" 
                          className="w-full h-full object-contain p-4"
                        />
                        {!isPaid && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-white/30 text-4xl font-bold transform -rotate-12">
                              EZCTO
                            </div>
                          </div>
                        )}
                      </div>
                      {isPaid && (
                        <Button asChild className="w-full">
                          <a href={groupedAssets.logo.fileUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Download Logo
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Poster */}
            {groupedAssets.poster && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Poster
                  </CardTitle>
                  {!isPaid && <CardDescription className="text-yellow-500">⚠️ Watermarked</CardDescription>}
                </CardHeader>
                <CardContent>
                  {groupedAssets.poster.fileUrl && (
                    <div className="space-y-4">
                      <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={groupedAssets.poster.fileUrl} 
                          alt="Poster" 
                          className="w-full h-full object-cover"
                        />
                        {!isPaid && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-white/30 text-4xl font-bold transform -rotate-12">
                              EZCTO
                            </div>
                          </div>
                        )}
                      </div>
                      {isPaid && (
                        <Button asChild className="w-full">
                          <a href={groupedAssets.poster.fileUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Download Poster
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Narrative */}
          {groupedAssets.narrative && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project Narrative
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-lg">
                    {groupedAssets.narrative.textContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Whitepaper */}
          {groupedAssets.whitepaper && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Whitepaper
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-lg">
                    {groupedAssets.whitepaper.textContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tweets */}
          {groupedAssets.tweets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Launch Tweets ({groupedAssets.tweets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupedAssets.tweets.map((tweet, index) => (
                    <div key={tweet.id} className="p-4 border rounded-lg bg-muted/50">
                      <p className="text-sm font-mono mb-2 text-muted-foreground">Tweet #{index + 1}</p>
                      <p className="text-sm">{tweet.textContent}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Website */}
          {groupedAssets.website && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Website HTML
                </CardTitle>
                <CardDescription>
                  Complete single-page website ready for deployment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button asChild className="flex-1">
                    <a 
                      href={`data:text/html;charset=utf-8,${encodeURIComponent(groupedAssets.website.textContent ?? '')}`}
                      download={`${project.name.toLowerCase().replace(/\s+/g, '-')}-website.html`}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download HTML
                    </a>
                  </Button>
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
