import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Rocket, Loader2, ArrowLeft, Sparkles, Upload, X, Image as ImageIcon } from "lucide-react";
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
    styleTemplate: "retro_gaming",
  });

  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

    if (!uploadedImage) {
      toast.error("Please upload a character image");
      return;
    }

    setIsGenerating(true);
    setIsUploading(true);
    
    try {
      // Step 1: Upload image to S3
      toast.info("Uploading character image...");
      const uploadResult = await uploadImageMutation.mutateAsync({
        fileName: uploadedImage.name,
        fileType: uploadedImage.type,
        base64Data: imagePreview!,
      });
      
      if (!uploadResult.success) {
        throw new Error("Failed to upload image");
      }
      
      setIsUploading(false);
      toast.success("Image uploaded! Creating project...");
      
      // Step 2: Create project with uploaded image URL
      await createProjectMutation.mutateAsync({
        ...formData,
        userImageUrl: uploadResult.url,
        userImageKey: uploadResult.fileKey,
      });
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

              {/* Character Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="characterImage" className="text-base font-bold">
                  Upload Meme Character Image <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-4">
                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                         onClick={() => document.getElementById('characterImage')?.click()}>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-mono mb-2">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (Max 10MB)</p>
                      <Input
                        id="characterImage"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error("Image size must be less than 10MB");
                              return;
                            }
                            setUploadedImage(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="relative border-2 border-primary rounded-lg p-4">
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <img
                        src={imagePreview}
                        alt="Uploaded character"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-center mt-2 font-mono text-muted-foreground">
                        {uploadedImage?.name}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload your Meme character/IP image. AI will use this to generate all visual assets (Logo, Banner, PFP, etc.) in your chosen style.
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
                <Select
                  value={formData.styleTemplate}
                  onValueChange={(value) => setFormData({ ...formData, styleTemplate: value })}
                >
                  <SelectTrigger className="text-lg font-mono retro-border">
                    <SelectValue placeholder="Select a style template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retro_gaming">
                      <div className="flex flex-col">
                        <span className="font-bold">Retro Gaming</span>
                        <span className="text-xs text-muted-foreground">8-bit pixel art, neon colors, arcade vibes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cyberpunk">
                      <div className="flex flex-col">
                        <span className="font-bold">Cyberpunk</span>
                        <span className="text-xs text-muted-foreground">Red & black, futuristic tech, neon aesthetics</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="minimalist">
                      <div className="flex flex-col">
                        <span className="font-bold">Minimalist</span>
                        <span className="text-xs text-muted-foreground">Clean lines, monochrome, modern simplicity</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="internet_meme">
                      <div className="flex flex-col">
                        <span className="font-bold">Internet Meme</span>
                        <span className="text-xs text-muted-foreground">Hand-drawn style, cartoon characters, playful</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose a visual style for your brand assets (affects logo, website, and all visual elements)
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
                disabled={isGenerating || isUploading}
                className="w-full text-lg font-mono"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploading Image...
                  </>
                ) : isGenerating ? (
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
