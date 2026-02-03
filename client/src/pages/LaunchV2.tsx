import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Rocket, Loader2, ArrowLeft, Sparkles, Upload, X, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { CryptoPaymentModalV2 } from "@/components/CryptoPaymentModalV2";
import { PricingPreviewModal } from "@/components/PricingPreviewModal";
import { useAccount } from "wagmi";
import { Wallet, DollarSign } from "lucide-react";

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
  const [showPricingPreview, setShowPricingPreview] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [hasDiscount, setHasDiscount] = useState(false);

  // Wallet connection state
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const walletAddress = evmAddress || '';
  const isWalletConnected = isEvmConnected;

  // Whitelist check
  const { data: whitelistStatus, isLoading: checkingWhitelist } = trpc.admin.checkWhitelistStatus.useQuery(
    { walletAddress },
    { enabled: isWalletConnected && !!walletAddress }
  );

  const hasWhitelistAccess = whitelistStatus?.isWhitelisted && (whitelistStatus?.remainingGenerations || 0) > 0;

  const createProjectMutation = trpc.projects.create.useMutation();
  const useWhitelistMutation = trpc.launch.useWhitelistGeneration.useMutation();
  const launchTriggerMutation = trpc.launch.trigger.useMutation();
  const uploadImageMutation = trpc.upload.characterImage.useMutation();
  const verifyPaymentMutation = trpc.launch.verifyPayment.useMutation();
  const checkSlugQuery = trpc.launch.checkSlug.useQuery(
    { slug: formData.slug },
    { enabled: false } // Manual trigger only
  );
  
  // Check for existing generating project to prevent duplicate submissions
  const { data: generatingProject, isLoading: checkingGenerating } = trpc.projects.getGenerating.useQuery();

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

  // Handle showing payment modal first (for non-admin/non-whitelist users)
  const handleShowPayment = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate submission - if user has a project currently generating
    if (generatingProject) {
      toast.error(
        language === 'zh' 
          ? `您已有一个项目正在生成中 (${generatingProject.name})，请等待完成后再创建新项目` 
          : `You already have a project generating (${generatingProject.name}). Please wait for it to complete.`
      );
      // Redirect to the generating project's preview page
      setLocation(`/launch/preview?projectId=${generatingProject.id}`);
      return;
    }

    // Check wallet connection (required for non-admin users)
    if (user?.role !== 'admin' && !isWalletConnected) {
      toast.error(
        language === 'zh'
          ? '请先连接钱包'
          : 'Please connect your wallet first'
      );
      return;
    }

    // Admin or whitelist users: proceed directly with full validation
    const canSkipPayment = user?.role === 'admin' || hasWhitelistAccess;
    if (canSkipPayment) {
      handleSubmit(e);
      return;
    }

    // Regular users: show payment modal first, validate form later
    setShowPaymentModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate submission - if user has a project currently generating
    if (generatingProject) {
      toast.error(
        language === 'zh' 
          ? `您已有一个项目正在生成中 (${generatingProject.name})，请等待完成后再创建新项目` 
          : `You already have a project generating (${generatingProject.name}). Please wait for it to complete.`
      );
      // Redirect to the generating project's preview page
      setLocation(`/launch/preview?projectId=${generatingProject.id}`);
      return;
    }

    if (!formData.projectName || !formData.ticker || !formData.description) {
      toast.error(language === 'zh' ? '请填写项目名称、Ticker和描述' : 'Please fill in Project Name, Ticker, and Description');
      return;
    }

    if (formData.description.length < 20) {
      toast.error(language === 'zh' ? '描述至少需要20个字符' : 'Description must be at least 20 characters');
      return;
    }

    // Validate image is uploaded and ready
    if (!uploadedImage || !imagePreview) {
      toast.error(
        language === 'zh' 
          ? '请上传项目角色图片' 
          : 'Please upload a character image for your project'
      );
      return;
    }

    // Validate image preview data is valid base64
    if (!imagePreview.startsWith('data:image/')) {
      toast.error(
        language === 'zh' 
          ? '图片数据无效，请重新上传' 
          : 'Invalid image data, please re-upload'
      );
      return;
    }

    // Check wallet connection (required for non-admin users)
    if (user?.role !== 'admin' && !isWalletConnected) {
      toast.error(
        language === 'zh'
          ? '请先连接钱包'
          : 'Please connect your wallet first'
      );
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
        // Social links
        twitterUrl: formData.twitter || undefined,
        telegramUrl: formData.telegram || undefined,
        discordUrl: formData.discord || undefined,
      });

      toast.success("Project created!");
      setCurrentProjectId(projectData.projectId);

      // Step 3: Check if user is admin or has whitelist access
      const canSkipPayment = user?.role === 'admin' || hasWhitelistAccess;
      
      if (canSkipPayment) {
        // Admin or whitelisted users skip payment and start generation immediately
        const skipReason = user?.role === 'admin' 
          ? (language === 'zh' ? '🔑 Admin权限：跳过支付，直接开始生成...' : '🔑 Admin privilege: Skipping payment, starting generation...')
          : (language === 'zh' ? `🎁 白名单用户：使用免费生成次数 (剩余 ${whitelistStatus?.remainingGenerations} 次)` : `🎁 Whitelist: Using free generation (${whitelistStatus?.remainingGenerations} remaining)`);
        toast.info(skipReason);
        
        // Store image data for retry (in case generation fails)
        if (characterImageUrl) {
          localStorage.setItem(`project_${projectData.projectId}_imageUrl`, characterImageUrl);
        }
        if (imagePreview) {
          localStorage.setItem(`project_${projectData.projectId}_imageBase64`, imagePreview);
        }
        
        // Debug: Log image data before sending
        console.log('[LaunchV2] Admin trigger - imagePreview length:', imagePreview?.length || 0);
        console.log('[LaunchV2] Admin trigger - imagePreview starts with:', imagePreview?.substring(0, 50));
        console.log('[LaunchV2] Admin trigger - characterImageUrl:', characterImageUrl);
        
        try {
          // If using whitelist (not admin), deduct the free generation first
          if (hasWhitelistAccess && user?.role !== 'admin') {
            await useWhitelistMutation.mutateAsync({
              projectId: projectData.projectId,
              walletAddress: walletAddress,
            });
          }

          await launchTriggerMutation.mutateAsync({
            projectId: projectData.projectId,
            characterImageUrl: characterImageUrl || undefined,
            // Pass base64 data directly to avoid 403 on CloudFront URLs
            characterImageBase64: imagePreview || undefined,
          });

          toast.success(language === 'zh' ? '生成已启动！正在跳转...' : 'Generation started! Redirecting...');
          setLocation(`/launch/preview?projectId=${projectData.projectId}`);
        } catch (genError) {
          console.error("[LaunchV2] Generation error:", genError);
          toast.error(`Failed to start generation: ${genError instanceof Error ? genError.message : 'Unknown error'}`);
          setIsGenerating(false);
        }
      } else {
        // Regular users: show payment modal
        setIsGenerating(false);
        setShowPaymentModal(true);
        toast.info(language === 'zh' ? '请完成支付以开始生成' : 'Please complete payment to start generation');

        // Store image URL and base64 for later use (after payment)
        if (characterImageUrl) {
          localStorage.setItem(`project_${projectData.projectId}_imageUrl`, characterImageUrl);
        }
        // Store base64 data to avoid 403 on CloudFront URLs during generation
        if (imagePreview) {
          localStorage.setItem(`project_${projectData.projectId}_imageBase64`, imagePreview);
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

  // Removed OAuth login requirement - users can browse freely
  // Wallet connection will be required only at payment step

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
              <form onSubmit={handleShowPayment} className="space-y-6">
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

                {/* Warning if user has a generating project */}
                {generatingProject && (
                  <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-700">
                        {language === 'zh' ? '您有一个项目正在生成中' : 'You have a project generating'}
                      </p>
                      <p className="text-sm text-yellow-600 mt-1">
                        {language === 'zh' 
                          ? `项目 "${generatingProject.name}" 正在生成，请等待完成后再创建新项目。`
                          : `Project "${generatingProject.name}" is being generated. Please wait for it to complete.`
                        }
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 text-yellow-700 border-yellow-500 hover:bg-yellow-500/10"
                        onClick={() => setLocation(`/launch/preview?projectId=${generatingProject.id}`)}
                      >
                        {language === 'zh' ? '查看进度' : 'View Progress'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Wallet Connection & Payment Status */}
                {user?.role !== 'admin' && (
                  <div className="bg-[#2d3e2d]/5 border-2 border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-foreground" />
                        <span className="font-semibold text-foreground">
                          {language === 'zh' ? '钱包状态' : 'Wallet Status'}
                        </span>
                      </div>
                      {!isWalletConnected && (
                        <WalletConnectButton />
                      )}
                    </div>
                    
                    {isWalletConnected ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="w-4 h-4" />
                          <span className="text-sm">
                            {language === 'zh' ? '已连接: ' : 'Connected: '}
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                          </span>
                        </div>
                        
                        {checkingWhitelist ? (
                          <div className="flex items-center gap-2 text-foreground/60">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">
                              {language === 'zh' ? '检查白名单...' : 'Checking whitelist...'}
                            </span>
                          </div>
                        ) : hasWhitelistAccess ? (
                          <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                            <div className="flex items-center gap-2 text-green-600">
                              <Sparkles className="w-4 h-4" />
                              <span className="text-sm font-semibold">
                                {language === 'zh' 
                                  ? `🎁 白名单用户 - 免费生成次数: ${whitelistStatus?.remainingGenerations}`
                                  : `🎁 Whitelisted - Free generations: ${whitelistStatus?.remainingGenerations}`
                                }
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-primary/10 border border-primary/30 rounded p-2">
                            <div className="flex items-center gap-2 text-primary">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm">
                                {language === 'zh' 
                                  ? '钱包已连接，可以开始生成'
                                  : 'Wallet connected, ready to generate'
                                }
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">
                          {language === 'zh' 
                            ? '请先连接钱包以检查白名单状态'
                            : 'Please connect wallet to check whitelist status'
                          }
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isGenerating || checkingGenerating || !!generatingProject || (user?.role !== 'admin' && !isWalletConnected)}
                  className="w-full font-mono font-semibold retro-border bg-gradient-to-r from-[#2d3e2d] to-[#4a5f4a] text-[#e8dcc4] hover:shadow-[0_0_20px_rgba(0,255,65,0.8)] text-lg px-8 py-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {language === 'zh' ? '正在启动...' : 'Launching...'}
                    </>
                  ) : checkingGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {language === 'zh' ? '检查中...' : 'Checking...'}
                    </>
                  ) : generatingProject ? (
                    <>
                      <AlertCircle className="mr-2 h-5 w-5" />
                      {language === 'zh' ? '请等待当前项目完成' : 'Wait for current project'}
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-5 w-5" />
                      {language === 'zh' ? 'AI 启动项目' : 'Launch Project with AI'}
                    </>
                  )}
                </Button>

                {/* View Pricing Link */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowPricingPreview(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    <DollarSign className="h-4 w-4" />
                    {language === 'zh' ? '查看价格详情 →' : 'View Pricing Details →'}
                  </button>
                </div>

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

      {/* Crypto Payment Modal V2 - Supports EZCTO Token */}
      <CryptoPaymentModalV2
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        projectId={currentProjectId || 0}
        projectName={formData.projectName}
        onBeforePayment={async () => {
          // Validate form before payment
          if (!formData.projectName || !formData.ticker || !formData.description) {
            toast.error(language === 'zh' ? '请填写项目名称、Ticker和描述' : 'Please fill in Project Name, Ticker, and Description');
            return { success: false, error: language === 'zh' ? '请填写项目名称、Ticker和描述' : 'Please fill in Project Name, Ticker, and Description' };
          }

          if (formData.description.length < 20) {
            toast.error(language === 'zh' ? '描述至少需要20个字符' : 'Description must be at least 20 characters');
            return { success: false, error: language === 'zh' ? '描述至少需要20个字符' : 'Description must be at least 20 characters' };
          }

          if (!uploadedImage || !imagePreview) {
            toast.error(language === 'zh' ? '请上传项目角色图片' : 'Please upload a character image for your project');
            return { success: false, error: language === 'zh' ? '请上传项目角色图片' : 'Please upload a character image for your project' };
          }

          if (!imagePreview.startsWith('data:image/')) {
            toast.error(language === 'zh' ? '图片数据无效，请重新上传' : 'Invalid image data, please re-upload');
            return { success: false, error: language === 'zh' ? '图片数据无效，请重新上传' : 'Invalid image data, please re-upload' };
          }

          try {
            // Upload image first
            let characterImageUrl = "";
            if (uploadedImage && imagePreview) {
              toast.info(language === 'zh' ? '正在上传图片...' : 'Uploading image...');
              const uploadResult = await uploadImageMutation.mutateAsync({
                fileName: uploadedImage.name,
                fileType: uploadedImage.type,
                base64Data: imagePreview,
                removeBackground: false,
              });
              if (!uploadResult.success) {
                throw new Error('Failed to upload image');
              }
              characterImageUrl = uploadResult.url;
              setUploadedImageUrl(characterImageUrl);
            }

            // Create project
            const projectData = await createProjectMutation.mutateAsync({
              name: formData.projectName,
              ticker: formData.ticker,
              description: formData.description,
            });

            setCurrentProjectId(projectData.projectId);

            // Store image data for later use
            if (characterImageUrl) {
              localStorage.setItem(`project_${projectData.projectId}_imageUrl`, characterImageUrl);
            }
            if (imagePreview) {
              localStorage.setItem(`project_${projectData.projectId}_imageBase64`, imagePreview);
            }

            return { success: true, projectId: projectData.projectId };
          } catch (error) {
            console.error('[LaunchV2] onBeforePayment error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Failed to create project' };
          }
        }}
        onPaymentSuccess={() => {
            toast.success(language === 'zh' ? '支付成功！' : 'Payment successful!');
            setShowPaymentModal(false);

            // Navigate to preview page
            setLocation(`/launch/preview?projectId=${currentProjectId}`);

            // Save to localStorage for recovery
            localStorage.setItem('currentGeneratingProject', JSON.stringify({
              projectId: currentProjectId,
              projectName: formData.projectName,
              timestamp: Date.now(),
            }));

            // Retrieve stored image URL and base64 data
            const storedImageUrl = localStorage.getItem(`project_${currentProjectId}_imageUrl`);
            const storedImageBase64 = localStorage.getItem(`project_${currentProjectId}_imageBase64`);

            // Trigger generation with both URL and base64 data
            launchTriggerMutation.mutate({
              projectId: currentProjectId!,
              characterImageUrl: storedImageUrl || undefined,
              // Pass base64 data directly to avoid 403 on CloudFront URLs
              characterImageBase64: storedImageBase64 || undefined,
            });

            toast.success(language === 'zh' ? '开始生成...' : 'Starting generation...');
          }}
        />

      {/* Pricing Preview Modal */}
      <PricingPreviewModal
        open={showPricingPreview}
        onClose={() => setShowPricingPreview(false)}
      />
    </div>
  );
}
