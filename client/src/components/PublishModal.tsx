import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Check, X, Globe, Lock, ShoppingCart, ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  projectName: string;
  currentSubdomain?: string;
  isEdit?: boolean;
  onPublishSuccess?: () => void;
}

export function PublishModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  currentSubdomain,
  isEdit = false,
  onPublishSuccess,
}: PublishModalProps) {
  const [subdomain, setSubdomain] = useState("");
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
    fullDomain?: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const checkSubdomainMutation = trpc.projects.checkSubdomain.useMutation();
  const previewMutation = trpc.projects.previewWebsite.useMutation({
    onSuccess: (data) => {
      setPreviewUrl(data.previewUrl);
      toast.success("Preview created! Opening in new tab...");
      window.open(data.previewUrl, '_blank');
    },
    onError: (error) => {
      toast.error(`Failed to create preview: ${error.message}`);
    },
  });
  const publishMutation = trpc.projects.publishWebsite.useMutation({
    onSuccess: (data) => {
      if (isEdit) {
        toast.success(`Subdomain updated successfully to ${data.fullDomain}!`);
      } else {
        toast.success(`Website published successfully to ${data.fullDomain}!`);
      }
      onPublishSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to ${isEdit ? 'update' : 'publish'}: ${error.message}`);
    },
  });

  // Initialize subdomain from project name or current subdomain
  useEffect(() => {
    if (open) {
      if (isEdit && currentSubdomain) {
        // In edit mode, use current subdomain
        setSubdomain(currentSubdomain);
      } else if (projectName) {
        // In publish mode, generate from project name
        const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        setSubdomain(slug);
      }
      setAvailabilityStatus(null);
      setPreviewUrl(null);
    }
  }, [open, projectName, currentSubdomain, isEdit]);

  const handleSubdomainChange = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSubdomain(cleaned);
    setAvailabilityStatus(null);
  };

  const checkAvailability = async () => {
    if (!subdomain || subdomain.length < 3) {
      toast.error("Subdomain must be at least 3 characters");
      return;
    }

    setIsCheckingAvailability(true);

    try {
      const result = await checkSubdomainMutation.mutateAsync({ subdomain });
      setAvailabilityStatus({
        checked: true,
        available: result.available,
        message: result.message,
        fullDomain: result.fullDomain,
      });

      if (result.available) {
        toast.success("Subdomain is available!");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to check availability");
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handlePreview = async () => {
    await previewMutation.mutateAsync({ projectId });
  };

  const handlePublish = async () => {
    if (!availabilityStatus?.available) {
      toast.error("Please check subdomain availability first");
      return;
    }

    await publishMutation.mutateAsync({
      projectId,
      subdomain,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEdit ? "Edit Subdomain" : "Publish Your Website"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your website's subdomain. The website will be redeployed automatically."
              : "Choose how you want to publish your meme project website"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview Section */}
          <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Preview Before Publishing</h4>
                  <p className="text-sm text-blue-700">
                    See how your website looks before making it live
                  </p>
                </div>
              </div>
              <Button
                onClick={handlePreview}
                disabled={previewMutation.isPending || publishMutation.isPending}
                variant="outline"
                className="border-blue-400 text-blue-700 hover:bg-blue-100"
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
            </div>
            {previewUrl && (
              <div className="mt-3 p-3 bg-white rounded border border-green-200">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900">
                      Preview created successfully!
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Expires in 24 hours
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-400 text-green-700 hover:bg-green-50 flex-shrink-0"
                    onClick={() => window.open(previewUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Option 1: Free Subdomain (Active) */}
          <div className="border-2 border-[#2d3e2d] rounded-lg p-6 bg-white">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#2d3e2d] mb-2">
                  {isEdit ? "Update Subdomain" : "Free Subdomain"}
                </h3>
                <p className="text-sm text-[#2d3e2d]/70 mb-4">
                  {isEdit
                    ? "Change your website's subdomain. Your website will be redeployed to the new address."
                    : "Get a free subdomain under ezcto.fun. Perfect for getting started quickly."}
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subdomain" className="text-[#2d3e2d] font-semibold">
                      Choose your subdomain
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          id="subdomain"
                          value={subdomain}
                          onChange={(e) => handleSubdomainChange(e.target.value)}
                          placeholder="my-project"
                          className="border-2 border-[#2d3e2d] font-mono"
                          disabled={publishMutation.isPending}
                        />
                        <span className="text-[#2d3e2d] font-mono whitespace-nowrap">
                          .ezcto.fun
                        </span>
                      </div>
                      <Button
                        onClick={checkAvailability}
                        disabled={isCheckingAvailability || subdomain.length < 3 || publishMutation.isPending}
                        variant="outline"
                        className="border-2 border-[#2d3e2d]"
                      >
                        {isCheckingAvailability ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          "Check"
                        )}
                      </Button>
                    </div>

                    {/* Availability Status */}
                    {availabilityStatus && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg ${
                        availabilityStatus.available
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}>
                        {availabilityStatus.available ? (
                          <>
                            <Check className="w-5 h-5 text-green-600" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-green-900">
                                {availabilityStatus.message}
                              </p>
                              <p className="text-xs text-green-700 font-mono mt-1">
                                {availabilityStatus.fullDomain}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <X className="w-5 h-5 text-red-600" />
                            <p className="text-sm font-semibold text-red-900">
                              {availabilityStatus.message}
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-[#2d3e2d]/60">
                      Only lowercase letters, numbers, and hyphens. Min 3 characters.
                    </p>
                  </div>

                  <Button
                    onClick={handlePublish}
                    disabled={!availabilityStatus?.available || publishMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {publishMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isEdit ? "Updating..." : "Publishing..."}
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {isEdit ? `Update to ${subdomain}.ezcto.fun` : `Publish to ${subdomain}.ezcto.fun`}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Custom Domain (Coming Soon) */}
          <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50 opacity-60 relative">
            <div className="absolute top-4 right-4 bg-gray-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
              Coming Soon
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-200 rounded-lg">
                <Lock className="w-6 h-6 text-gray-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Custom Domain
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Connect your own domain (e.g., myproject.com) for a professional look.
                </p>
                <ul className="text-sm text-gray-500 space-y-1 mb-4">
                  <li>• Full DNS configuration support</li>
                  <li>• Free SSL certificate</li>
                  <li>• Easy setup wizard</li>
                </ul>
                <Button disabled className="w-full" variant="outline">
                  <Lock className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>

          {/* Option 3: Purchase Domain (Coming Soon) */}
          <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50 opacity-60 relative">
            <div className="absolute top-4 right-4 bg-gray-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
              Coming Soon
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-200 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-gray-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Purchase New Domain
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Buy a new domain directly through EZCTO. We'll handle everything for you.
                </p>
                <ul className="text-sm text-gray-500 space-y-1 mb-4">
                  <li>• Instant domain search</li>
                  <li>• Automatic configuration</li>
                  <li>• No technical knowledge required</li>
                </ul>
                <Button disabled className="w-full" variant="outline">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
