import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Rocket, Loader2, ArrowLeft, Sparkles, Upload, X, Check, AlertCircle } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { CryptoPaymentModal } from "@/components/CryptoPaymentModal";

export default function LaunchV2() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  
  // Form state
  const [formData, setFormData] = useState({
    projectName: "",
    ticker: "",
    description: "",
    tokenomics: "",
    contractAddress: "",
    twitter: "",
    telegram: "",
    discord: "",
    website: "",
    slug: "", // Custom subdomain
  });

  // Slug validation state
  const [slugCheckStatus, setSlugCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugMessage, setSlugMessage] = useState('');

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [hasDiscount, setHasDiscount] = useState(false);

  const createProjectMutation = trpc.projects.create.useMutation();
  const launchTriggerMutation = trpc.launch.trigger.useMutation();
  const uploadImageMutation = trpc.upload.characterImage.useMutation();
  const verifyPaymentMutation = trpc.launch.verifyPayment.useMutation();
  const checkSlugQuery = trpc.launch.checkSlug.useQuery(
    { slug: formData.slug },
    { enabled: false } // Manual trigger only
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('launch.form.imageSizeError'));
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error(language === 'zh' ? '请上传图片文件' : 'Please upload an image file');
      return;
    }

    setUploadedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    toast.success(language === 'zh' ? '图片已选择！提交时将自动上传' : 'Image selected! It will be uploaded when you submit.');
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview("");
    setUploadedImageUrl("");
    toast.info(language === 'zh' ? '图片已移除' : 'Image removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectName || !formData.ticker || !formData.description) {
      toast.error(language === 'zh' ? '请填写项目名称、Ticker和描述' : 'Please fill in Project Name, Ticker, and Description');
      return;
    }

    if (formData.description.length < 20) {
      toast.error(language === 'zh' ? '描述至少需要20个字符' : 'Description must be at least 20 characters');
      return;
    }

    setIsGenerating(true);
    toast.info(language === 'zh' ? '🚀 开始AI生成... 预计需要3-5分钟' : '🚀 Starting AI generation... This will take 3-5 minutes');

    try {
      // Step 1: Upload image if provided
      let characterImageUrl = "";
      if (uploadedImage && imagePreview) {
        setIsUploading(true);
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

        characterImageUrl = uploadResult.url;
        setUploadedImageUrl(characterImageUrl);
        setIsUploading(false);
        toast.success("Image uploaded!");
      }

      // Step 2: Create project record
      const projectData = await createProjectMutation.mutateAsync({
        name: formData.projectName,
        ticker: formData.ticker,
        description: formData.description,
        tokenomics: formData.tokenomics || undefined,
        contractAddress: formData.contractAddress || undefined,
      });

      toast.success("Project created!");
      setCurrentProjectId(projectData.projectId);

      // Step 3: Check if user is admin
      if (user?.role === 'admin') {
        // Admin users skip payment and start generation immediately
        toast.info(language === 'zh' ? '🔑 Admin权限：跳过支付，直接开始生成...' : '🔑 Admin privilege: Skipping payment, starting generation...');
        
        try {
          await launchTriggerMutation.mutateAsync({
            projectId: projectData.projectId,
            characterImageUrl: characterImageUrl || undefined,
          });

          toast.success(language === 'zh' ? '生成已启动！正在跳转...' : 'Generation started! Redirecting...');
          setLocation(`/launch/preview?projectId=${projectData.projectId}`);
        } catch (genError) {
          console.error("[LaunchV2] Admin generation error:", genError);
          toast.error(`Failed to start generation: ${genError instanceof Error ? genError.message : 'Unknown error'}`);
          setIsGenerating(false);
        }
      } else {
        // Regular users: show payment modal
        setIsGenerating(false);
        setShowPaymentModal(true);
        toast.info(language === 'zh' ? '请完成支付以开始生成' : 'Please complete payment to start generation');

        // Store image URL for later use
        if (characterImageUrl) {
          localStorage.setItem(`project_${projectData.projectId}_imageUrl`, characterImageUrl);
        }
      }
    } catch (error) {
      console.error("[LaunchV2] Generation error:", error);
      toast.error(`Failed to start generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsGenerating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
    <div className="min-h-screen bg-background">
      {/* Navigation Header - Same as Home */}
      <nav className="border-b-2 border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src="/EZ.png" alt="EZCTO" className="h-10" />
            </div>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="font-mono font-semibold text-[#2d3e2d] hover:bg-[#2d3e2d]/5">
                Dashboard
              </Button>
            </Link>
            <WalletConnectButton />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-6 font-mono font-semibold text-foreground hover:bg-[#2d3e2d]/5">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary bg-primary/10 mb-4">
              <span className="status-indicator active"></span>
              <span className="text-sm font-mono font-bold uppercase tracking-wider">
                AI-POWERED GENERATION V2
              </span>
            </div>
            <h1 className="text-5xl font-bold mb-4">
              {t('launch.v2.page.title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('launch.v2.page.subtitle')}
            </p>
          </div>

          {/* Form Card */}
          <Card className="module-card">
            <CardHeader>
              <CardTitle className="text-2xl">{t('launch.v2.page.formTitle')}</CardTitle>
              <CardDescription>
                {language === 'zh' ? '填写项目信息，AI将处理其余部分' : 'Fill in your project information. Our AI will handle the rest.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground font-semibold">
                    {t('launch.v2.form.projectName')} *
                  </Label>
                  <Input
                    id="name"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    placeholder={t("launch.v2.form.projectNamePlaceholder")}
                    className="border-2 border-border"
                    disabled={isGenerating}
                    required
                  />
                </div>

                {/* Ticker */}
                <div className="space-y-2">
                  <Label htmlFor="ticker" className="text-foreground font-semibold">
                    {t('launch.v2.form.ticker')} *
                  </Label>
                  <Input
                    id="ticker"
                    value={formData.ticker}
                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                    placeholder={t("launch.v2.form.projectNamePlaceholder")}
                    className="border-2 border-border font-mono"
                    disabled={isGenerating}
                    maxLength={10}
                    required
                  />
                </div>

                {/* Custom Subdomain (Slug) */}
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-foreground font-semibold">
                    {language === 'zh' ? '自定义子域名' : 'Custom Subdomain'} *
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="flex items-center border-2 border-border rounded-md overflow-hidden">
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                            setFormData({ ...formData, slug: value });
                            setSlugCheckStatus('idle');
                          }}
                          placeholder={language === 'zh' ? 'my-project' : 'my-project'}
                          className="border-0 font-mono"
                          disabled={isGenerating}
                          required
                        />
                        <span className="px-3 text-sm text-muted-foreground font-mono">.ezcto.fun</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === 'zh' ? '3-63个字符，仅限小写字母、数字和连字符' : '3-63 characters, lowercase letters, numbers, and hyphens only'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        if (!formData.slug || formData.slug.length < 3) {
                          toast.error(language === 'zh' ? '子域名至少需要3个字符' : 'Subdomain must be at least 3 characters');
                          return;
                        }
                        setSlugCheckStatus('checking');
                        try {
                          const result = await checkSlugQuery.refetch();
                          if (result.data?.available) {
                            setSlugCheckStatus('available');
                            setSlugMessage(language === 'zh' ? '✓ 可用' : '✓ Available');
                            toast.success(language === 'zh' ? '子域名可用！' : 'Subdomain is available!');
                          } else {
                            setSlugCheckStatus('taken');
                            setSlugMessage(result.data?.message || (language === 'zh' ? '已被占用' : 'Already taken'));
                            toast.error(language === 'zh' ? '子域名已被占用，请选择其他名称' : 'Subdomain is taken, please choose another');
                          }
                        } catch (error) {
                          setSlugCheckStatus('idle');
                          toast.error(language === 'zh' ? '检查失败，请重试' : 'Check failed, please try again');
                        }
                      }}
                      disabled={isGenerating || slugCheckStatus === 'checking' || !formData.slug}
                      className="font-mono font-semibold"
                    >
                      {slugCheckStatus === 'checking' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : slugCheckStatus === 'available' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : slugCheckStatus === 'taken' ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        language === 'zh' ? '检查' : 'Check'
                      )}
                    </Button>
                  </div>
                  {slugMessage && (
                    <p className={`text-sm font-semibold ${
                      slugCheckStatus === 'available' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {slugMessage}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground font-semibold">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("launch.v2.form.descriptionPlaceholder")}
                    className="border-2 border-border min-h-[120px]"
                    disabled={isGenerating}
                    required
                  />
                  <p className="text-sm text-foreground/60">
                    {formData.description.length} / 20 characters minimum
                  </p>
                </div>

                {/* Character Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="meme-image" className="text-foreground font-semibold">
                    {t("launch.v2.form.characterImage")}
                  </Label>
                  <p className="text-sm text-foreground/70 mb-2">
                    Upload a character image for AI to analyze and generate themed assets
                  </p>
                  {!uploadedImage ? (
                    <label
                      htmlFor="meme-image"
                      className="flex flex-col items-center justify-center w-full h-48 border-4 border-dashed border-border rounded-lg cursor-pointer bg-background/30 hover:bg-background/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-12 h-12 mb-3 text-foreground" />
                        <p className="mb-2 text-sm text-foreground font-semibold">
                          <span className="font-bold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-foreground/60">
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
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Uploaded character"
                          className="w-full h-64 object-contain rounded-lg border-4 border-border bg-white"
                        />
                      )}
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

                {/* Tokenomics */}
                <div className="space-y-2">
                  <Label htmlFor="tokenomics" className="text-foreground">
                    {t("launch.v2.form.tokenomics")}
                  </Label>
                  <Textarea
                    id="tokenomics"
                    value={formData.tokenomics}
                    onChange={(e) => setFormData({ ...formData, tokenomics: e.target.value })}
                    placeholder="Total Supply: 1,000,000,000&#10;Liquidity: 90%&#10;Marketing: 5%&#10;Team: 5%"
                    className="border-2 border-border min-h-[100px]"
                    disabled={isGenerating}
                  />
                </div>

                {/* Contract Address */}
                <div className="space-y-2">
                  <Label htmlFor="contractAddress" className="text-foreground font-semibold">
                    {t("launch.v2.form.contractAddress")}
                  </Label>
                  <Input
                    id="contractAddress"
                    value={formData.contractAddress}
                    onChange={(e) => setFormData({ ...formData, contractAddress: e.target.value })}
                    placeholder="0x1234567890abcdef..."
                    className="border-2 border-border font-mono text-sm"
                    disabled={isGenerating}
                  />
                  <p className="text-sm text-foreground/70">
                    If provided, will be displayed prominently on your generated website with one-click copy
                  </p>
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                  <Label className="text-foreground font-semibold">{t("launch.v2.form.socialLinks")}</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="text-foreground">Twitter</Label>
                      <Input
                        id="twitter"
                        type="url"
                        value={formData.twitter}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                        placeholder="https://twitter.com/..."
                        className="border-2 border-border"
                        disabled={isGenerating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegram" className="text-foreground">Telegram</Label>
                      <Input
                        id="telegram"
                        type="url"
                        value={formData.telegram}
                        onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                        placeholder="https://t.me/..."
                        className="border-2 border-border"
                        disabled={isGenerating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discord" className="text-foreground">Discord</Label>
                      <Input
                        id="discord"
                        type="url"
                        value={formData.discord}
                        onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                        placeholder="https://discord.gg/..."
                        className="border-2 border-border"
                        disabled={isGenerating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-foreground">Website</Label>
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
                        className="border-2 border-border"
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
                  className="w-full font-mono font-semibold retro-border bg-gradient-to-r from-[#2d3e2d] to-[#4a5f4a] text-[#e8dcc4] hover:shadow-[0_0_20px_rgba(0,255,65,0.8)] text-lg px-8 py-6 transition-all"
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
                <div className="bg-[#2d3e2d]/5 border-2 border-border rounded-lg p-4">
                  <p className="text-sm text-foreground/80">
                    <strong>What happens next:</strong>
                  </p>
                  <ul className="text-sm text-foreground/70 mt-2 space-y-1 list-disc list-inside">
                    <li>AI analyzes your project and determines the best design style</li>
                    <li>Generates 6 unique images (logo, banner, PFP, poster, website, character)</li>
                    <li>Creates a complete website with your branding</li>
                    <li>Deploys to a public URL (yourproject.ezcto.fun)</li>
                  </ul>
                  <p className="text-sm text-foreground/60 mt-3">
                    ⏱️ Estimated time: 3-5 minutes
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Crypto Payment Modal */}
      {currentProjectId && (
        <CryptoPaymentModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={async (txHash, chain) => {
            try {
              toast.info(language === 'zh' ? '验证支付中...' : 'Verifying payment...');

              // Get wallet address from useWeb3 hook
              const walletAddress = (window as any).ethereum?.selectedAddress || '';

              // Verify payment on blockchain
              const result = await verifyPaymentMutation.mutateAsync({
                projectId: currentProjectId,
                txHash,
                chain,
                walletAddress,
                hasDiscount,
              });

              toast.success(language === 'zh' ? '支付验证成功！' : 'Payment verified successfully!');
              setShowPaymentModal(false);

              // Navigate to preview page
              setLocation(`/launch/preview?projectId=${currentProjectId}`);

              // Save to localStorage for recovery
              localStorage.setItem('currentGeneratingProject', JSON.stringify({
                projectId: currentProjectId,
                projectName: formData.projectName,
                timestamp: Date.now(),
              }));

              // Retrieve stored image URL
              const storedImageUrl = localStorage.getItem(`project_${currentProjectId}_imageUrl`);

              // Trigger generation
              launchTriggerMutation.mutate({
                projectId: currentProjectId,
                characterImageUrl: storedImageUrl || undefined,
              });

              toast.success(language === 'zh' ? '开始生成...' : 'Starting generation...');
            } catch (error) {
              console.error('[Payment] Verification failed:', error);
              toast.error(
                language === 'zh'
                  ? `支付验证失败: ${error instanceof Error ? error.message : '未知错误'}`
                  : `Payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }}
        />
      )}
    </div>
  );
}
