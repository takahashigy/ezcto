import { useState } from "react";
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
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WalletConnectButton } from "@/components/WalletConnectButton";

export default function LaunchV2() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  
  // Form state
  const [formData, setFormData] = useState({
    projectName: "",
    ticker: "",
    description: "",
    tokenomics: "",
    twitter: "",
    telegram: "",
    discord: "",
    website: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const createProjectMutation = trpc.projects.create.useMutation();
  const launchTriggerMutation = trpc.launch.trigger.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectName || !formData.ticker || !formData.description) {
      toast.error("Please fill in Project Name, Ticker, and Description");
      return;
    }

    if (formData.description.length < 20) {
      toast.error("Description must be at least 20 characters");
      return;
    }

    setIsGenerating(true);
    toast.info("🚀 Starting AI generation... This will take 3-5 minutes");

    try {
      // Step 1: Create project record
      const projectData = await createProjectMutation.mutateAsync({
        name: formData.projectName,
        ticker: formData.ticker,
        description: formData.description,
        tokenomics: formData.tokenomics || undefined,
      });

      toast.success("Project created! Starting generation pipeline...");

      // Step 2: Navigate to preview page
      setLocation(`/launch-v2/preview?projectId=${projectData.projectId}`);

      // Step 3: Trigger the full generation pipeline (runs in background)
      launchTriggerMutation.mutate({
        projectId: projectData.projectId,
      });
    } catch (error) {
      console.error("[LaunchV2] Generation error:", error);
      toast.error(`Failed to start generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsGenerating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8dcc4]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2d3e2d]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8dcc4]">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please login to launch your project</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Login with Manus</a>
            </Button>
          </CardContent>
        </Card>
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
              <Rocket className="h-6 w-6 text-[#2d3e2d]" />
              <span className="font-bold text-xl text-[#2d3e2d]">EZCTO</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-[#2d3e2d]">
                Dashboard
              </Button>
            </Link>
            <LanguageSwitcher />
            <WalletConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-6 text-[#2d3e2d]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d3e2d] text-[#e8dcc4] rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="font-mono text-sm font-bold">AI-POWERED GENERATION V2</span>
            </div>
            <h1 className="text-5xl font-black text-[#2d3e2d] mb-4">
              Launch Your Meme Project
            </h1>
            <p className="text-xl text-[#2d3e2d]/80">
              Complete AI automation: Analysis → Images → Website → Deployment
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-4 border-[#2d3e2d] shadow-[8px_8px_0px_0px_rgba(45,62,45,1)]">
            <CardHeader>
              <CardTitle className="text-2xl text-[#2d3e2d]">Project Details</CardTitle>
              <CardDescription className="text-[#2d3e2d]/70">
                Fill in your project information. Our AI will handle the rest.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#2d3e2d] font-semibold">
                    Project Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    placeholder="EZCTO"
                    className="border-2 border-[#2d3e2d]"
                    disabled={isGenerating}
                    required
                  />
                </div>

                {/* Ticker */}
                <div className="space-y-2">
                  <Label htmlFor="ticker" className="text-[#2d3e2d] font-semibold">
                    Ticker Symbol *
                  </Label>
                  <Input
                    id="ticker"
                    value={formData.ticker}
                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                    placeholder="EZCTO"
                    className="border-2 border-[#2d3e2d] font-mono"
                    disabled={isGenerating}
                    maxLength={10}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[#2d3e2d] font-semibold">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your meme project... (minimum 20 characters)"
                    className="border-2 border-[#2d3e2d] min-h-[120px]"
                    disabled={isGenerating}
                    required
                  />
                  <p className="text-sm text-[#2d3e2d]/60">
                    {formData.description.length} / 20 characters minimum
                  </p>
                </div>

                {/* Tokenomics */}
                <div className="space-y-2">
                  <Label htmlFor="tokenomics" className="text-[#2d3e2d]">
                    Tokenomics (Optional)
                  </Label>
                  <Textarea
                    id="tokenomics"
                    value={formData.tokenomics}
                    onChange={(e) => setFormData({ ...formData, tokenomics: e.target.value })}
                    placeholder="Total Supply: 1,000,000,000&#10;Liquidity: 90%&#10;Marketing: 5%&#10;Team: 5%"
                    className="border-2 border-[#2d3e2d] min-h-[100px]"
                    disabled={isGenerating}
                  />
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                  <Label className="text-[#2d3e2d] font-semibold">Social Links (Optional)</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="text-[#2d3e2d]">Twitter</Label>
                      <Input
                        id="twitter"
                        type="url"
                        value={formData.twitter}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                        placeholder="https://twitter.com/..."
                        className="border-2 border-[#2d3e2d]"
                        disabled={isGenerating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegram" className="text-[#2d3e2d]">Telegram</Label>
                      <Input
                        id="telegram"
                        type="url"
                        value={formData.telegram}
                        onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                        placeholder="https://t.me/..."
                        className="border-2 border-[#2d3e2d]"
                        disabled={isGenerating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discord" className="text-[#2d3e2d]">Discord</Label>
                      <Input
                        id="discord"
                        type="url"
                        value={formData.discord}
                        onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                        placeholder="https://discord.gg/..."
                        className="border-2 border-[#2d3e2d]"
                        disabled={isGenerating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-[#2d3e2d]">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => {
                          let value = e.target.value;
                          // Auto-add https:// if user didn't provide protocol
                          if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                            value = 'https://' + value;
                          }
                          setFormData({ ...formData, website: value });
                        }}
                        onBlur={(e) => {
                          // Also check on blur to ensure protocol is added
                          let value = e.target.value;
                          if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                            setFormData({ ...formData, website: 'https://' + value });
                          }
                        }}
                        placeholder="https://..."
                        className="border-2 border-[#2d3e2d]"
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isGenerating}
                  className="w-full bg-[#2d3e2d] hover:bg-[#2d3e2d]/90 text-[#e8dcc4] font-bold text-lg h-14 border-4 border-[#2d3e2d] shadow-[4px_4px_0px_0px_rgba(45,62,45,1)] hover:shadow-[2px_2px_0px_0px_rgba(45,62,45,1)] transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-5 w-5" />
                      Launch Project with AI
                    </>
                  )}
                </Button>

                {/* Info Text */}
                <div className="bg-[#2d3e2d]/5 border-2 border-[#2d3e2d] rounded-lg p-4">
                  <p className="text-sm text-[#2d3e2d]/80">
                    <strong>What happens next:</strong>
                  </p>
                  <ul className="text-sm text-[#2d3e2d]/70 mt-2 space-y-1 list-disc list-inside">
                    <li>AI analyzes your project and determines the best design style</li>
                    <li>Generates 6 unique images (logo, banner, PFP, poster, website, character)</li>
                    <li>Creates a complete website with your branding</li>
                    <li>Deploys to a public URL (yourproject.ezcto.fun)</li>
                  </ul>
                  <p className="text-sm text-[#2d3e2d]/60 mt-3">
                    ⏱️ Estimated time: 3-5 minutes
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
