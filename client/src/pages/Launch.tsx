import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Rocket, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { toast } from "sonner";

export default function Launch() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ticker: "",
    styleTemplate: "pixel_punk",
  });

  const triggerLaunchMutation = trpc.launch.trigger.useMutation();

  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: async (_, variables) => {
      toast.success("Project created! Starting asset generation...");
      // Note: We can't get the project ID from the create mutation directly,
      // so we'll redirect to dashboard where the user can see the generating status
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`);
      setIsGenerating(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setIsGenerating(true);
    
    try {
      await createProjectMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  if (authLoading) {
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
            <Link href="/dashboard">
              <Button variant="ghost" className="font-mono">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary bg-primary/10 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-mono font-bold uppercase tracking-wider">
              Launch Automation Engine
            </span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4">
            Create Your Meme Project
          </h1>
          <p className="text-xl text-muted-foreground">
            10分钟内生成专业级品牌资产：Logo、Banner、PFP、海报、网站、文案
          </p>
        </div>

        {/* Launch Form */}
        <Card className="module-card">
          <CardHeader>
            <CardTitle className="text-2xl">Project Information</CardTitle>
            <CardDescription>
              Fill in your project details to start the automated generation process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-bold">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., DogeKing, PepeRevolution"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-lg font-mono retro-border"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The name of your Meme project
                </p>
              </div>

              {/* Ticker */}
              <div className="space-y-2">
                <Label htmlFor="ticker" className="text-base font-bold">
                  Ticker Symbol
                </Label>
                <Input
                  id="ticker"
                  placeholder="e.g., DOGE, PEPE"
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                  className="text-lg font-mono retro-border"
                  maxLength={10}
                />
                <p className="text-sm text-muted-foreground">
                  Token ticker symbol (optional)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-bold">
                  Project Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project concept, target audience, and unique value proposition..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-32 text-base font-mono retro-border"
                />
                <p className="text-sm text-muted-foreground">
                  The more details you provide, the better the AI can generate your assets
                </p>
              </div>

              {/* Style Template */}
              <div className="space-y-2">
                <Label htmlFor="styleTemplate" className="text-base font-bold">
                  Visual Style Template
                </Label>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { id: "pixel_punk", name: "Pixel Punk", desc: "像素朋克风格" },
                    { id: "minimal_power", name: "Minimal Power", desc: "简洁力量风格" },
                    { id: "cartoon_chaos", name: "Cartoon Chaos", desc: "卡通狂热风格" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, styleTemplate: style.id })}
                      className={`p-4 border-2 transition-all ${
                        formData.styleTemplate === style.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="font-bold mb-1">{style.name}</div>
                      <div className="text-sm text-muted-foreground">{style.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose a visual style for your brand assets
                </p>
              </div>

              {/* What You'll Get */}
              <Card className="bg-primary/5 border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">What You'll Get</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold mb-2 text-primary">Visual Assets</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Logo (PNG, SVG)</li>
                        <li>• Banner (Twitter/X)</li>
                        <li>• Profile Picture (PFP)</li>
                        <li>• Promotional Poster</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2 text-primary">Content Assets</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Project Narrative</li>
                        <li>• Whitepaper Draft</li>
                        <li>• Launch Tweets (5x)</li>
                        <li>• Landing Page HTML</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 font-mono text-lg retro-border"
                  disabled={isGenerating || !formData.name.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Assets...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-5 w-5" />
                      Launch Project
                    </>
                  )}
                </Button>
                <Link href="/dashboard">
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="font-mono text-lg"
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Generation typically takes 5-10 minutes. You'll be notified when complete.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Process Overview */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Input", desc: "Provide project details" },
              { step: "02", title: "Generate", desc: "AI creates your assets" },
              { step: "03", title: "Review", desc: "Check & download" },
              { step: "04", title: "Launch", desc: "Deploy & promote" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 border-2 border-primary bg-primary/10 flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                  {item.step}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
