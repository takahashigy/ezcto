import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2, Rocket, CreditCard, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CryptoPayment } from "@/components/CryptoPayment";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface DeploymentPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  projectName: string;
}

export function DeploymentPaywall({
  open,
  onOpenChange,
  projectId,
  projectName,
}: DeploymentPaywallProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'crypto'>('crypto');

  const createCheckout = trpc.payment.createDeploymentCheckout.useMutation({
    onSuccess: (data: { url: string | null }) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecting to payment...");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create checkout session");
      setIsProcessing(false);
    },
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    createCheckout.mutate({ projectId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Deploy Your Project</DialogTitle>
          <DialogDescription className="text-base">
            Deploy <span className="font-bold text-foreground">{projectName}</span> to a live URL and unlock all features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Method Tabs */}
          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'stripe' | 'crypto')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="crypto" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Crypto (0.55 BNB)
              </TabsTrigger>
              <TabsTrigger value="stripe" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Card ($479)
              </TabsTrigger>
            </TabsList>

            {/* Crypto Payment */}
            <TabsContent value="crypto" className="space-y-4 mt-6">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold mb-2">0.55 BNB</div>
                <div className="text-sm text-muted-foreground">≈ $479 USD • One-time payment</div>
              </div>

              <CryptoPayment 
                projectId={projectId} 
                onPaymentSuccess={() => {
                  toast.success("Payment confirmed! Your project is now unlocked.");
                  onOpenChange(false);
                  window.location.reload();
                }}
              />
            </TabsContent>

            {/* Stripe Payment */}
            <TabsContent value="stripe" className="space-y-4 mt-6">
              <Card className="border-2 border-primary">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold mb-2">$479</div>
                    <div className="text-sm text-muted-foreground">One-time payment</div>
                  </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Live Website Deployment</div>
                    <div className="text-sm text-muted-foreground">
                      Get a custom URL: {projectName.toLowerCase().replace(/\s+/g, '')}.ezcto.manus.space
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Download All Assets</div>
                    <div className="text-sm text-muted-foreground">
                      Logo, Banner (1500×500), PFP, Poster, Website HTML
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Full Source Code</div>
                    <div className="text-sm text-muted-foreground">
                      Complete HTML/CSS/JS files for self-hosting
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Marketing Materials</div>
                    <div className="text-sm text-muted-foreground">
                      Narrative, Whitepaper, Launch Tweets
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Lifetime Access</div>
                    <div className="text-sm text-muted-foreground">
                      No recurring fees, keep your deployment forever
                    </div>
                  </div>
                </div>
              </div>

                  <Button
                    size="lg"
                    className="w-full font-mono text-base"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-5 w-5" />
                        Pay with Card - $479
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Secure payment powered by Stripe
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info Text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Your project is already generated and ready to deploy.
              <br />
              Payment unlocks deployment and download features.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
