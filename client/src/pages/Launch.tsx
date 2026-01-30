import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Rocket, Loader2, ArrowLeft, Upload, X, Sparkles, Eye } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WebsitePreview } from "@/components/WebsitePreview";

interface ProjectAnalysis {
  narrativeType: "community" | "tech" | "culture" | "gaming";
  layoutStyle: "minimal" | "playful" | "cyberpunk" | "retro";
  colorPalette: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  vibe: "friendly" | "edgy" | "mysterious" | "energetic";
  targetAudience: string;
}

export default function Launch() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  
  // Form state
  const [formData, setFormData] = useState({
    projectName: "",
    ticker: "",
    description: "",
    twitter: "",
    telegram: "",
    discord: "",
    website: "",
    contractAddress: "",
  });

  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  
  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const uploadImageMutation = trpc.upload.characterImage.useMutation();
  const previewAnalysisMutation = trpc.projects.previewAnalysis.useMutation();
  const generatePreviewMutation = trpc.projects.generatePreview.useMutation();
  const generateWebsiteMutation = trpc.projects.generateWebsite.useMutation({
    onSuccess: (data) => {
      toast.success("Website generated successfully!");
      setIsGenerating(false);
      // Open generated website in new tab
      window.open(data.websiteUrl, "_blank");
      // Navigate to dashboard
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    },
    onError: (error) => {
      toast.error(`Failed to generate website: ${error.message}`);
      setIsGenerating(false);
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview("");
    setUploadedImageUrl("");
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (!formData.ticker.trim()) {
      toast.error("Ticker is required");
      return;
    }

    if (!formData.description.trim() || formData.description.length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    if (!uploadedImage) {
      toast.error("Please upload your meme image");
      return;
    }

    setIsUploading(true);
    setIsAnalyzing(true);

    try {
      // Step 1: Upload image
      toast.info("Uploading image...");

      const uploadResult = await uploadImageMutation.mutateAsync({
        fileName: uploadedImage.name,
        fileType: uploadedImage.type,
        base64Data: imagePreview,
        removeBackground: false,
      });

      if (!uploadResult.success) {
        throw new Error("Failed to upload image");
      }

      setUploadedImageUrl(uploadResult.url);
      setIsUploading(false);
      toast.success("Image uploaded!");

      // Step 2: Run AI analysis
      toast.info("AI is analyzing your project...");

      const analysisResult = await previewAnalysisMutation.mutateAsync({
        projectName: formData.projectName,
        ticker: formData.ticker,
        description: formData.description,
        memeImageUrl: uploadResult.url,
      });

      if (!analysisResult.success) {
        throw new Error("Failed to analyze project");
      }

      setAnalysis(analysisResult.analysis);
      setIsAnalyzing(false);
      toast.success("Analysis complete!");

      // Step 3: Generate initial preview
      await generateInitialPreview(uploadResult.url, analysisResult.analysis);

      // Show preview
      setShowPreview(true);
    } catch (error) {
      console.error("[Launch] Error:", error);
      setIsUploading(false);
      setIsAnalyzing(false);
      toast.error("Failed to analyze project. Please try again.");
    }
  };

  const generateInitialPreview = async (imageUrl: string, analysisData: ProjectAnalysis) => {
    setIsLoadingPreview(true);
    toast.info("Generating preview...");

    try {
      const previewResult = await generatePreviewMutation.mutateAsync({
        projectName: formData.projectName,
        ticker: formData.ticker,
        description: formData.description,
        memeImageUrl: imageUrl,
        analysis: analysisData,
        socialLinks: {
          twitter: formData.twitter || undefined,
          telegram: formData.telegram || undefined,
          discord: formData.discord || undefined,
          website: formData.website || undefined,
        },
        contractAddress: formData.contractAddress || undefined,
      });

      if (!previewResult.success) {
        throw new Error("Failed to generate preview");
      }

      setPreviewHtml(previewResult.html);
      setIsLoadingPreview(false);
      toast.success("Preview ready!");
    } catch (error) {
      console.error("[Launch] Preview error:", error);
      setIsLoadingPreview(false);
      toast.error("Failed to generate preview");
    }
  };

  const handleAnalysisChange = (newAnalysis: ProjectAnalysis) => {
    setAnalysis(newAnalysis);
  };

  const handleGeneratePreview = async () => {
    if (!analysis || !uploadedImageUrl) return;

    setIsLoadingPreview(true);

    try {
      const previewResult = await generatePreviewMutation.mutateAsync({
        projectName: formData.projectName,
        ticker: formData.ticker,
        description: formData.description,
        memeImageUrl: uploadedImageUrl,
        analysis,
        socialLinks: {
          twitter: formData.twitter || undefined,
          telegram: formData.telegram || undefined,
          discord: formData.discord || undefined,
          website: formData.website || undefined,
        },
        contractAddress: formData.contractAddress || undefined,
      });

      if (!previewResult.success) {
        throw new Error("Failed to generate preview");
      }

      setPreviewHtml(previewResult.html);
      setIsLoadingPreview(false);
      toast.success("Preview updated!");
    } catch (error) {
      console.error("[Launch] Preview error:", error);
      setIsLoadingPreview(false);
      toast.error("Failed to update preview");
    }
  };

  const handleConfirmGenerate = async () => {
    if (!uploadedImageUrl || !analysis) return;

    setIsGenerating(true);
    toast.info("Generating your complete website... This may take 30-60 seconds");

    try {
      await generateWebsiteMutation.mutateAsync({
        projectName: formData.projectName,
        ticker: formData.ticker,
        description: formData.description,
        memeImageUrl: uploadedImageUrl,
        socialLinks: {
          twitter: formData.twitter || undefined,
          telegram: formData.telegram || undefined,
          discord: formData.discord || undefined,
          website: formData.website || undefined,
        },
        contractAddress: formData.contractAddress || undefined,
      });
    } catch (error) {
      console.error("[Launch] Generation error:", error);
    }
  };

  const handleBackToForm = () => {
    setShowPreview(false);
    setAnalysis(null);
    setPreviewHtml(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#d1c9b8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2d3e2d]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#d1c9b8] flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/90 border-2 border-[#2d3e2d]">
          <CardHeader>
            <CardTitle className="text-2xl text-[#2d3e2d]">Login Required</CardTitle>
            <CardDescription>
              Please login to launch your meme project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full bg-[#2d3e2d] hover:bg-[#3d4e3d]">
              <a href={getLoginUrl()}>Login</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d1c9b8]">
      {/* Header */}
      <header className="border-b-2 border-[#2d3e2d] bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/Anniu.png" alt="EZCTO Logo" className="h-12" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-[#2d3e2d]">
                Dashboard
              </Button>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2d3e2d] mb-4 font-mono">
              Launch Your Meme Project
            </h1>
            <p className="text-lg text-[#2d3e2d]/80 mb-2">
              Upload your meme, tell us about it, and get a complete website in 60 seconds.
            </p>
            <p className="text-sm text-[#2d3e2d]/60">
              Powered by AI - No design skills required
            </p>
          </div>

          {/* Show Form or Preview */}
          {!showPreview ? (
            /* Form */
            <Card className="bg-white/90 border-2 border-[#2d3e2d]">
              <CardHeader>
                <CardTitle className="text-2xl text-[#2d3e2d] flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Project Information
                </CardTitle>
                <CardDescription>
                  Fill in the details below. Our AI will analyze your meme and create a perfect website.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-6">
                  {/* Meme Image Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="meme-image" className="text-[#2d3e2d] font-semibold">
                      Your Meme Image *
                    </Label>
                    <p className="text-sm text-[#2d3e2d]/60">
                      Upload the main character/image for your meme project
                    </p>

                    {!imagePreview ? (
                      <label
                        htmlFor="meme-image"
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[#2d3e2d] rounded-lg cursor-pointer bg-white/50 hover:bg-white/70 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-12 h-12 mb-4 text-[#2d3e2d]/60" />
                          <p className="mb-2 text-sm text-[#2d3e2d]">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-[#2d3e2d]/60">
                            PNG, JPG, GIF (MAX. 10MB)
                          </p>
                        </div>
                        <input
                          id="meme-image"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isAnalyzing}
                        />
                      </label>
                    ) : (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Uploaded meme"
                          className="w-full h-64 object-contain rounded-lg border-2 border-[#2d3e2d] bg-white"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                          disabled={isAnalyzing}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Project Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#2d3e2d] font-semibold">
                      Project Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      placeholder="DogeKing"
                      className="border-2 border-[#2d3e2d]"
                      disabled={isAnalyzing}
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
                      placeholder="DGKNG"
                      className="border-2 border-[#2d3e2d] font-mono"
                      disabled={isAnalyzing}
                      maxLength={10}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[#2d3e2d] font-semibold">
                      Project Description *
                    </Label>
                    <p className="text-sm text-[#2d3e2d]/60">
                      Describe your project's story, community, and vision. Our AI will use this to design your website.
                    </p>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Tell us about your meme project... (100-500 words)"
                      rows={6}
                      className="border-2 border-[#2d3e2d]"
                      disabled={isAnalyzing}
                      required
                    />
                    <p className="text-xs text-[#2d3e2d]/60">
                      {formData.description.length} characters
                    </p>
                  </div>

                  {/* Optional: Social Links */}
                  <details className="border-2 border-[#2d3e2d] rounded-lg p-4 bg-white/50">
                    <summary className="cursor-pointer font-semibold text-[#2d3e2d] mb-4">
                      Social Links (Optional)
                    </summary>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="twitter" className="text-[#2d3e2d]">Twitter</Label>
                        <Input
                          id="twitter"
                          type="url"
                          value={formData.twitter}
                          onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                          placeholder="https://twitter.com/..."
                          className="border-2 border-[#2d3e2d]"
                          disabled={isAnalyzing}
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
                          disabled={isAnalyzing}
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
                          disabled={isAnalyzing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-[#2d3e2d]">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://..."
                          className="border-2 border-[#2d3e2d]"
                          disabled={isAnalyzing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contract" className="text-[#2d3e2d]">Contract Address</Label>
                        <Input
                          id="contract"
                          value={formData.contractAddress}
                          onChange={(e) => setFormData({ ...formData, contractAddress: e.target.value })}
                          placeholder="0x..."
                          className="border-2 border-[#2d3e2d] font-mono text-sm"
                          disabled={isAnalyzing}
                        />
                      </div>
                    </div>
                  </details>

                  {/* Analyze Button */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={isAnalyzing || isUploading}
                      className="flex-1 bg-[#2d3e2d] hover:bg-[#3d4e3d] text-white py-6 text-lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {isUploading ? "Uploading..." : "Analyzing..."}
                        </>
                      ) : (
                        <>
                          <Eye className="w-5 h-5 mr-2" />
                          Analyze & Preview
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/dashboard")}
                      disabled={isAnalyzing}
                      className="border-2 border-[#2d3e2d]"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            /* Preview Mode */
            <div className="space-y-6">
              <Button
                variant="outline"
                onClick={handleBackToForm}
                disabled={isGenerating}
                className="border-2 border-[#2d3e2d]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Form
              </Button>

              {analysis && (
                <WebsitePreview
                  analysis={analysis}
                  previewHtml={previewHtml}
                  isLoadingPreview={isLoadingPreview}
                  onAnalysisChange={handleAnalysisChange}
                  onGeneratePreview={handleGeneratePreview}
                  onConfirmGenerate={handleConfirmGenerate}
                  isGenerating={isGenerating}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
