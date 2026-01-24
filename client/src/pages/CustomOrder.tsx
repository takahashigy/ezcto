import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Package, Upload, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function CustomOrder() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; preview: string }>>([]);
  
  const [formData, setFormData] = useState({
    productType: "",
    quantity: "",
    budget: "",
    description: "",
    contactName: user?.name || "",
    contactEmail: user?.email || "",
    contactPhone: "",
  });

  const MAX_FILES = 5;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedFiles.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedFiles(prev => [...prev, {
          file,
          preview: e.target?.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const createOrderMutation = trpc.customOrder.create.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      toast.success(t('customOrder.success.title'));
    },
    onError: (error) => {
      console.error("Failed to submit order:", error);
      toast.error("Failed to submit order. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productType || !formData.quantity || !formData.budget || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files to S3 if any
      const fileUrls = uploadedFiles.map(item => ({
        url: item.preview,
        key: `custom-orders/${user?.id}/${Date.now()}-${item.file.name}`,
        name: item.file.name,
      }));

      await createOrderMutation.mutateAsync({
        productType: formData.productType as "merchandise" | "packaging" | "manufacturing" | "logistics",
        quantity: parseInt(formData.quantity),
        budget: formData.budget as "small" | "medium" | "large" | "enterprise",
        description: formData.description,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || undefined,
        fileUrls: fileUrls.length > 0 ? fileUrls : undefined,
      });
    } catch (error) {
      // Error already handled in mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please login to submit a custom order</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full">Login</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b-2 border-primary/30 bg-card/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/">
              <img src="/EZ.png" alt="EZCTO" className="h-10" />
            </Link>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Success Message */}
        <div className="container py-20 max-w-2xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">{t('customOrder.success.title')}</h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t('customOrder.success.description')}
            </p>
            <Link href="/supply">
              <Button size="lg" className="font-mono">
                {t('customOrder.success.button')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-primary/30 bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/EZ.png" alt="EZCTO" className="h-10" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-mono hover:text-primary transition-colors">
              {t('nav.home')}
            </Link>
            <Link href="/templates" className="text-sm font-mono hover:text-primary transition-colors">
              {t('nav.templates')}
            </Link>
            <Link href="/supply" className="text-sm font-mono hover:text-primary transition-colors">
              {t('nav.supply')}
            </Link>
            <Link href="/store" className="text-sm font-mono hover:text-primary transition-colors">
              {t('nav.store')}
            </Link>
            <Link href="/dashboard" className="text-sm font-mono hover:text-primary transition-colors">
              {t('nav.dashboard')}
            </Link>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <div className="container py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary bg-primary/10 mb-6">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm font-mono font-bold uppercase tracking-wider">
              {t('customOrder.page.tag')}
            </span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4">
            {t('customOrder.page.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('customOrder.page.subtitle')}
          </p>
        </div>

        {/* Order Form */}
        <Card className="module-card">
          <CardHeader>
            <CardTitle className="text-2xl">{t('customOrder.form.productType')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Type */}
              <div className="space-y-2">
                <Label htmlFor="productType" className="text-base font-bold">
                  {t('customOrder.form.productType')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.productType}
                  onValueChange={(value) => setFormData({ ...formData, productType: value })}
                >
                  <SelectTrigger className="text-lg font-mono retro-border">
                    <SelectValue placeholder={t('customOrder.form.productTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="merchandise">
                      <div className="flex flex-col">
                        <span className="font-bold">{t('customOrder.productTypes.merchandise.name')}</span>
                        <span className="text-xs text-muted-foreground">{t('customOrder.productTypes.merchandise.description')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="packaging">
                      <div className="flex flex-col">
                        <span className="font-bold">{t('customOrder.productTypes.packaging.name')}</span>
                        <span className="text-xs text-muted-foreground">{t('customOrder.productTypes.packaging.description')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="manufacturing">
                      <div className="flex flex-col">
                        <span className="font-bold">{t('customOrder.productTypes.manufacturing.name')}</span>
                        <span className="text-xs text-muted-foreground">{t('customOrder.productTypes.manufacturing.description')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="logistics">
                      <div className="flex flex-col">
                        <span className="font-bold">{t('customOrder.productTypes.logistics.name')}</span>
                        <span className="text-xs text-muted-foreground">{t('customOrder.productTypes.logistics.description')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-base font-bold">
                  {t('customOrder.form.quantity')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder={t('customOrder.form.quantityPlaceholder')}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="text-lg font-mono retro-border"
                  min="100"
                  required
                />
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-base font-bold">
                  {t('customOrder.form.budget')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.budget}
                  onValueChange={(value) => setFormData({ ...formData, budget: value })}
                >
                  <SelectTrigger className="text-lg font-mono retro-border">
                    <SelectValue placeholder={t('customOrder.form.budgetPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">{t('customOrder.budgets.small')}</SelectItem>
                    <SelectItem value="medium">{t('customOrder.budgets.medium')}</SelectItem>
                    <SelectItem value="large">{t('customOrder.budgets.large')}</SelectItem>
                    <SelectItem value="enterprise">{t('customOrder.budgets.enterprise')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-bold">
                  {t('customOrder.form.description')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder={t('customOrder.form.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-32 text-base font-mono retro-border"
                  required
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="files" className="text-base font-bold">
                  {t('customOrder.form.uploadFiles')}
                </Label>
                <div className="space-y-4">
                  {uploadedFiles.length < MAX_FILES && (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                         onClick={() => document.getElementById('files')?.click()}>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-mono mb-2">{t('customOrder.form.uploadPrompt')}</p>
                      <p className="text-xs text-muted-foreground">{t('customOrder.form.uploadFormat')}</p>
                      <p className="text-xs text-primary mt-2">
                        {uploadedFiles.length}/{MAX_FILES} {t('customOrder.form.uploadCount')}
                      </p>
                      <Input
                        id="files"
                        type="file"
                        accept="image/*,.pdf,.ai"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {uploadedFiles.map((item, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square border-2 border-border rounded-lg overflow-hidden">
                            {item.file.type.startsWith('image/') ? (
                              <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Package className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                          <p className="text-xs text-center mt-1 font-mono text-muted-foreground truncate">
                            {item.file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="text-base font-bold">
                    {t('customOrder.form.contactName')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    placeholder={t('customOrder.form.contactNamePlaceholder')}
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="text-lg font-mono retro-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-base font-bold">
                    {t('customOrder.form.contactEmail')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder={t('customOrder.form.contactEmailPlaceholder')}
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="text-lg font-mono retro-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-base font-bold">
                  {t('customOrder.form.contactPhone')}
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder={t('customOrder.form.contactPhonePlaceholder')}
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="text-lg font-mono retro-border"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full text-lg font-mono"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('customOrder.buttons.submitting')}
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-5 w-5" />
                    {t('customOrder.buttons.submit')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
