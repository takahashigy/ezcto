import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useProgress } from "@/hooks/useProgress";
import { Link, useLocation } from "wouter";
import { Rocket, Loader2, ArrowLeft, Sparkles, Upload, X, Image as ImageIcon } from "lucide-react";
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
    name: "",
    description: "",
    ticker: "",
    styleTemplate: "retro_gaming",
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  
  const MAX_IMAGES = 3;
  
  // Listen to progress updates
  const { progress, isConnected } = useProgress(currentProjectId);

  const triggerLaunchMutation = trpc.launch.trigger.useMutation();

  const uploadImageMutation = trpc.upload.characterImage.useMutation();

  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: async (_, variables) => {
      toast.success("Project created! Starting asset generation...");
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

    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one character image");
      return;
    }

    setIsGenerating(true);
    setIsUploading(true);
    
    try {
      // Step 1: Upload all images to S3
      if (removeBackground) {
        toast.info(`Removing background and uploading ${uploadedImages.length} image(s)...`);
      } else {
        toast.info(`Uploading ${uploadedImages.length} image(s)...`);
      }
      
      const uploadResults = await Promise.all(
        uploadedImages.map((file, index) =>
          uploadImageMutation.mutateAsync({
            fileName: file.name,
            fileType: file.type,
            base64Data: imagePreviews[index],
            removeBackground,
          })
        )
      );
      
      if (uploadResults.some(result => !result.success)) {
        throw new Error("Failed to upload one or more images");
      }
      
      setIsUploading(false);
      toast.success(`${uploadedImages.length} image(s) uploaded! Creating project...`);
      
      // Step 2: Create project with uploaded image URLs
      const userImages = uploadResults.map(result => ({
        url: result.url,
        key: result.fileKey,
      }));
      
      const result = await createProjectMutation.mutateAsync({
        ...formData,
        userImageUrl: userImages[0].url, // Primary image
        userImageKey: userImages[0].key,
        userImages: JSON.stringify(userImages),
      });
      
      // Start listening to progress
      if (result.projectId) {
        setCurrentProjectId(result.projectId);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      setIsUploading(false);
      setIsGenerating(false);
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
                {t('nav.dashboard')}
              </Button>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <div className="container py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary bg-primary/10 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-mono font-bold uppercase tracking-wider">
              {t('launch.page.tag')}
            </span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4">
            {t('launch.page.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('launch.page.subtitle')}
          </p>
        </div>

        {/* Progress Display */}
        {isGenerating && progress && (
          <Card className="module-card mb-6 border-primary">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="font-mono text-sm font-bold">{progress.message}</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-primary">
                    {progress.progress}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                {progress.error && (
                  <p className="text-sm text-destructive font-mono">{progress.error}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Launch Form */}
        <Card className="module-card">
          <CardHeader>
            <CardTitle className="text-2xl">{t('launch.page.formTitle')}</CardTitle>
            <CardDescription>
              {t('launch.page.formDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-bold">
                  {t('launch.form.projectName')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder={t('launch.form.projectNamePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-lg font-mono retro-border"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {t('launch.form.projectNameHelp')}
                </p>
              </div>

              {/* Ticker */}
              <div className="space-y-2">
                <Label htmlFor="ticker" className="text-base font-bold">
                  {t('launch.form.ticker')}
                </Label>
                <Input
                  id="ticker"
                  placeholder={t('launch.form.tickerPlaceholder')}
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                  className="text-lg font-mono retro-border"
                  maxLength={10}
                />
                <p className="text-sm text-muted-foreground">
                  {t('launch.form.tickerHelp')}
                </p>
              </div>

              {/* Character Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="characterImage" className="text-base font-bold">
                  {t('launch.form.uploadImages')} <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-4">
                  {/* Upload Button */}
                  {uploadedImages.length < MAX_IMAGES && (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                         onClick={() => document.getElementById('characterImage')?.click()}>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-mono mb-2">{t('launch.form.uploadPrompt')}</p>
                      <p className="text-xs text-muted-foreground">{t('launch.form.uploadFormat')}</p>
                      <p className="text-xs text-primary mt-2">
                        {uploadedImages.length}/{MAX_IMAGES} {t('launch.form.uploadCount')}
                      </p>
                      <Input
                        id="characterImage"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error(t('launch.form.imageSizeError'));
                              return;
                            }
                            if (uploadedImages.length >= MAX_IMAGES) {
                              toast.error(`Maximum ${MAX_IMAGES} images allowed`);
                              return;
                            }
                            setUploadedImages([...uploadedImages, file]);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setImagePreviews([...imagePreviews, reader.result as string]);
                            };
                            reader.readAsDataURL(file);
                            // Reset input
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Image Previews Grid */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {uploadedImages.map((file, index) => (
                        <div key={index} className="relative border-2 border-primary rounded-lg p-2">
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedImages(uploadedImages.filter((_, i) => i !== index));
                              setImagePreviews(imagePreviews.filter((_, i) => i !== index));
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80 transition-colors z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <img
                            src={imagePreviews[index]}
                            alt={`Character ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <p className="text-xs text-center mt-1 font-mono text-muted-foreground truncate">
                            {file.name}
                          </p>
                          {index === 0 && (
                            <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                              {t('launch.form.primary')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="removeBackground"
                    checked={removeBackground}
                    onChange={(e) => setRemoveBackground(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="removeBackground" className="text-sm text-muted-foreground cursor-pointer">
                    {t('launch.form.removeBackground')}
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('launch.form.uploadHelp')}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-bold">
                  {t('launch.form.description')}
                </Label>
                <Textarea
                  id="description"
                  placeholder={t('launch.form.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-32 text-base font-mono retro-border"
                />
                <p className="text-sm text-muted-foreground">
                  {t('launch.form.descriptionHelp')}
                </p>
              </div>

              {/* Style Template */}
              <div className="space-y-2">
                <Label htmlFor="styleTemplate" className="text-base font-bold">
                  {t('launch.form.styleTemplate')}
                </Label>
                <Select
                  value={formData.styleTemplate}
                  onValueChange={(value) => setFormData({ ...formData, styleTemplate: value })}
                >
                  <SelectTrigger className="text-lg font-mono retro-border">
                    <SelectValue placeholder={t('launch.form.styleTemplatePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retro_gaming">
                      <div className="flex flex-col">
                        <span className="font-bold">{t('launch.styles.retroGaming.name')}</span>
                        <span className="text-xs text-muted-foreground">{t('launch.styles.retroGaming.description')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cyberpunk">
                      <div className="flex flex-col">
                        <span className="font-bold">{t('launch.styles.cyberpunk.name')}</span>
                        <span className="text-xs text-muted-foreground">{t('launch.styles.cyberpunk.description')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="minimalist">
                      <div className="flex flex-col">
                        <span className="font-bold">{t('launch.styles.minimalist.name')}</span>
                        <span className="text-xs text-muted-foreground">{t('launch.styles.minimalist.description')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="internet_meme">
                      <div className="flex flex-col">
                        <span className="font-bold">{t('launch.styles.internetMeme.name')}</span>
                        <span className="text-xs text-muted-foreground">{t('launch.styles.internetMeme.description')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t('launch.form.styleTemplateHelp')}
                </p>
              </div>

              {/* What You'll Get */}
              <Card className="bg-primary/5 border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">{t('launch.page.whatYouGetTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold mb-2 text-primary">{t('launch.page.visualAssets')}</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• {t('launch.assets.logo')}</li>
                        <li>• {t('launch.assets.banner')}</li>
                        <li>• {t('launch.assets.pfp')}</li>
                        <li>• {t('launch.assets.poster')}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2 text-primary">{t('launch.page.contentAssets')}</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• {t('launch.assets.narrative')}</li>
                        <li>• {t('launch.assets.whitepaper')}</li>
                        <li>• {t('launch.assets.tweets')}</li>
                        <li>• {t('launch.assets.landingPage')}</li>
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
                disabled={isGenerating || isUploading}
                className="flex-1 text-lg font-mono"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('launch.buttons.uploadingImage')}
                  </>
                ) : isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('launch.buttons.generatingAssets')}
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    {t('launch.buttons.launchProject')}
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
                    {t('launch.buttons.cancel')}
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                {t('launch.page.generationTime')}
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
