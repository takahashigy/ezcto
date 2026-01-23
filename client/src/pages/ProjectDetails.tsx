import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useParams, useLocation } from "wouter";
import { Loader2, ArrowLeft, Download, ExternalLink, Image as ImageIcon, FileText } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function ProjectDetails() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0");

  const { data: project, isLoading: projectLoading } = trpc.projects.getById.useQuery(
    { id: projectId },
    { enabled: isAuthenticated && projectId > 0 }
  );

  const { data: assets, isLoading: assetsLoading } = trpc.assets.listByProject.useQuery(
    { projectId },
    { enabled: isAuthenticated && projectId > 0 }
  );

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
    pfp: assets?.find(a => a.assetType === 'pfp'),
    poster: assets?.find(a => a.assetType === 'poster'),
    narrative: assets?.find(a => a.assetType === 'narrative'),
    whitepaper: assets?.find(a => a.assetType === 'whitepaper'),
    tweets: assets?.filter(a => a.assetType === 'tweet') || [],
    website: assets?.find(a => a.assetType === 'website'),
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
          </div>
        </div>
      </nav>

      <div className="container py-12">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
          {project.ticker && (
            <p className="text-xl text-muted-foreground font-mono">${project.ticker}</p>
          )}
          {project.description && (
            <p className="mt-4 text-muted-foreground">{project.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-mono ${
              project.status === 'completed' ? 'bg-green-500/20 text-green-500' :
              project.status === 'generating' ? 'bg-yellow-500/20 text-yellow-500' :
              project.status === 'failed' ? 'bg-red-500/20 text-red-500' :
              'bg-gray-500/20 text-gray-500'
            }`}>
              {project.status.toUpperCase()}
            </span>
            {project.styleTemplate && (
              <span className="text-sm text-muted-foreground font-mono">
                Style: {project.styleTemplate.replace(/_/g, ' ').toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo */}
          {groupedAssets.logo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Logo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupedAssets.logo.fileUrl && (
                  <div className="space-y-4">
                    <img 
                      src={groupedAssets.logo.fileUrl} 
                      alt="Logo" 
                      className="w-full h-64 object-contain bg-muted rounded-lg"
                    />
                    <Button asChild className="w-full">
                      <a href={groupedAssets.logo.fileUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download Logo
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Banner */}
          {groupedAssets.banner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Banner (1500×500)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupedAssets.banner.fileUrl && (
                  <div className="space-y-4">
                    <img 
                      src={groupedAssets.banner.fileUrl} 
                      alt="Banner" 
                      className="w-full h-auto object-cover bg-muted rounded-lg"
                    />
                    <Button asChild className="w-full">
                      <a href={groupedAssets.banner.fileUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download Banner
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* PFP */}
          {groupedAssets.pfp && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupedAssets.pfp.fileUrl && (
                  <div className="space-y-4">
                    <img 
                      src={groupedAssets.pfp.fileUrl} 
                      alt="PFP" 
                      className="w-full h-64 object-contain bg-muted rounded-lg"
                    />
                    <Button asChild className="w-full">
                      <a href={groupedAssets.pfp.fileUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download PFP
                      </a>
                    </Button>
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
              </CardHeader>
              <CardContent>
                {groupedAssets.poster.fileUrl && (
                  <div className="space-y-4">
                    <img 
                      src={groupedAssets.poster.fileUrl} 
                      alt="Poster" 
                      className="w-full h-auto object-cover bg-muted rounded-lg"
                    />
                    <Button asChild className="w-full">
                      <a href={groupedAssets.poster.fileUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download Poster
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Narrative */}
          {groupedAssets.narrative && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project Narrative
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {groupedAssets.narrative.textContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Whitepaper */}
          {groupedAssets.whitepaper && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Whitepaper
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {groupedAssets.whitepaper.textContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tweets */}
          {groupedAssets.tweets.length > 0 && (
            <Card className="md:col-span-2">
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
                      <p className="text-sm font-mono mb-2">Tweet #{index + 1}</p>
                      <p className="text-sm">{tweet.textContent}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Website */}
          {groupedAssets.website && (
            <Card className="md:col-span-2">
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
                      href={`data:text/html;charset=utf-8,${encodeURIComponent(groupedAssets.website.textContent || '')}`}
                      download={`${project.name.toLowerCase().replace(/\s+/g, '-')}-website.html`}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download HTML
                    </a>
                  </Button>
                  {project.deploymentUrl && (
                    <Button asChild variant="outline" className="flex-1">
                      <a href={project.deploymentUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visit Live Site
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
