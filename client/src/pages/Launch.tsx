import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Rocket, Loader2, ArrowLeft, Upload, X, ImageIcon, Sparkles } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Launch() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);

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
  const [isUploading, setIsUploading] = useState(false);

  const uploadImageMutation = trpc.upload.characterImage.useMutation();
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectName.trim()) {
      toast.error(t("launch.errors.nameRequired") || "Project name is required");
      return;
    }

    if (!formData.ticker.trim()) {
      toast.error(t("launch.errors.tickerRequired") || "Ticker is required");
      return;
    }

    if (!formData.description.trim() || formData.description.length < 10) {
      toast.error(t("launch.errors.descriptionRequired") || "Description must be at least 10 characters");
      return;
    }

    if (!uploadedImage) {
      toast.error(t("launch.errors.imageRequired") || "Please upload your meme image");
      return;
    }

    setIsGenerating(true);
    setIsUploading(true);

    try {
      // Step 1: Upload image to S3
      toast.info(t("launch.uploading") || "Uploading image...");

      const uploadResult = await uploadImageMutation.mutateAsync({
        fileName: uploadedImage.name,
        fileType: uploadedImage.type,
        base64Data: imagePreview,
        removeBackground: false, // Don't remove background for meme images
      });

      if (!uploadResult.success) {
        throw new Error("Failed to upload image");
      }

      setIsUploading(false);
      toast.success(t("launch.uploadSuccess") || "Image uploaded!");

      // Step 2: Generate website
      toast.info(t("launch.generating") || "Generating your website... This may take 30-60 seconds");

      await generateWebsiteMutation.mutateAsync({
        projectName: formData.projectName,
        ticker: formData.ticker,
        description: formData.description,
        memeImageUrl: uploadResult.url,
        socialLinks: {
          twitter: formData.twitter || undefined,
          telegram: formData.telegram || undefined,
          discord: formData.discord || undefined,
          website: formData.website || undefined,
        },
        contractAddress: formData.contractAddress || undefined,
      });
    } catch (error) {
      console.error("[Launch] Error:", error);
      setIsGenerating(false);
      setIsUploading(false);
    }
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
            <CardTitle className="text-2xl text-[#2d3e2d]">
              {t("launch.loginRequired") || "Login Required"}
            </CardTitle>
            <CardDescription>
              {t("launch.loginDescription") || "Please login to launch your meme project"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full bg-[#2d3e2d] hover:bg-[#3d4e3d]">
              <a href={getLoginUrl()}>
                {t("nav.login") || "Login"}
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("nav.home") || "Back to Home"}
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
                {t("nav.dashboard") || "Dashboard"}
              </Button>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2d3e2d] mb-4 font-mono">
              {t("launch.title") || "Launch Your Meme Project"}
            </h1>
            <p className="text-lg text-[#2d3e2d]/80 mb-2">
              {t("launch.subtitle") || "Upload your meme, tell us about it, and get a complete website in 60 seconds."}
            </p>
            <p className="text-sm text-[#2d3e2d]/60">
              {t("launch.aiPowered") || "Powered by AI - No design skills required"}
            </p>
          </div>

          {/* Form */}
          <Card className="bg-white/90 border-2 border-[#2d3e2d]">
            <CardHeader>
              <CardTitle className="text-2xl text-[#2d3e2d] flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                {t("launch.formTitle") || "Project Information"}
              </CardTitle>
              <CardDescription>
                {t("launch.formDescription") || "Fill in the details below. Our AI will analyze your meme and create a perfect website."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Meme Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="meme-image" className="text-[#2d3e2d] font-semibold">
                    {t("launch.memeImage") || "Your Meme Image"} *
                  </Label>
                  <p className="text-sm text-[#2d3e2d]/60">
                    {t("launch.memeImageDescription") || "Upload the main character/image for your meme project"}
                  </p>

                  {!imagePreview ? (
                    <label
                      htmlFor="meme-image"
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[#2d3e2d] rounded-lg cursor-pointer bg-white/50 hover:bg-white/70 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-12 h-12 mb-4 text-[#2d3e2d]/60" />
                        <p className="mb-2 text-sm text-[#2d3e2d]">
                          <span className="font-semibold">{t("launch.clickToUpload") || "Click to upload"}</span> {t("launch.orDragAndDrop") || "or drag and drop"}
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
                        disabled={isGenerating}
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
                        disabled={isGenerating}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Project Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#2d3e2d] font-semibold">
                    {t("launch.projectName") || "Project Name"} *
                  </Label>
                  <Input
                    id="name"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    placeholder="DogeKing"
                    className="border-2 border-[#2d3e2d]"
                    disabled={isGenerating}
                    required
                  />
                </div>

                {/* Ticker */}
                <div className="space-y-2">
                  <Label htmlFor="ticker" className="text-[#2d3e2d] font-semibold">
                    {t("launch.ticker") || "Ticker Symbol"} *
                  </Label>
                  <Input
                    id="ticker"
                    value={formData.ticker}
                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                    placeholder="DGKNG"
                    className="border-2 border-[#2d3e2d] font-mono"
                    disabled={isGenerating}
                    maxLength={10}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[#2d3e2d] font-semibold">
                    {t("launch.description") || "Project Description"} *
                  </Label>
                  <p className="text-sm text-[#2d3e2d]/60">
                    {t("launch.descriptionHint") || "Describe your project's story, community, and vision. Our AI will use this to design your website."}
                  </p>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("launch.descriptionPlaceholder") || "Tell us about your meme project... (100-500 words)"}
                    rows={6}
                    className="border-2 border-[#2d3e2d]"
                    disabled={isGenerating}
                    required
                  />
                  <p className="text-xs text-[#2d3e2d]/60">
                    {formData.description.length} characters
                  </p>
                </div>

                {/* Optional: Social Links */}
                <details className="border-2 border-[#2d3e2d] rounded-lg p-4 bg-white/50">
                  <summary className="cursor-pointer font-semibold text-[#2d3e2d] mb-4">
                    {t("launch.socialLinks") || "Social Links (Optional)"}
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
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://..."
                        className="border-2 border-[#2d3e2d]"
                        disabled={isGenerating}
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
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                </details>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isGenerating || isUploading}
                    className="flex-1 bg-[#2d3e2d] hover:bg-[#3d4e3d] text-white py-6 text-lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {isUploading
                          ? (t("launch.uploading") || "Uploading...")
                          : (t("launch.generating") || "Generating...")}
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 mr-2" />
                        {t("launch.generateWebsite") || "Generate Website"}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/dashboard")}
                    disabled={isGenerating}
                    className="border-2 border-[#2d3e2d]"
                  >
                    {t("launch.cancel") || "Cancel"}
                  </Button>
                </div>

                {/* Info Text */}
                <p className="text-sm text-center text-[#2d3e2d]/60">
                  {t("launch.processingTime") || "Generation typically takes 30-60 seconds. You'll be redirected to your dashboard when complete."}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
