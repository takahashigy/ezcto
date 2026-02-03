/**
 * Crypto Payment Modal V2 for Launch V2
 * Supports multiple chains and EZCTO token payment with discount
 */
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CryptoPayment } from '@/components/CryptoPayment';
import { Card } from '@/components/ui/card';
import { Check, Sparkles } from 'lucide-react';
import { PAYMENT_CONFIG } from '@shared/web3Config';

interface CryptoPaymentModalV2Props {
  open: boolean;
  onClose: () => void;
  projectId: number;
  projectName?: string;
  onPaymentSuccess: () => void;
}

export function CryptoPaymentModalV2({ 
  open, 
  onClose, 
  projectId, 
  projectName,
  onPaymentSuccess 
}: CryptoPaymentModalV2Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Complete Payment to Start Generation
          </DialogTitle>
          <DialogDescription className="text-base">
            {projectName ? (
              <>Pay to unlock AI-powered generation for <span className="font-semibold text-foreground">{projectName}</span></>
            ) : (
              'Pay to unlock AI-powered project generation'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* EZCTO Discount Banner */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-500 text-white rounded-full p-1.5 mt-0.5">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-green-800 dark:text-green-300 text-lg">
                  Save ${PAYMENT_CONFIG.priceUSD - PAYMENT_CONFIG.ezctoPaymentUSD} with EZCTO Token - 50% OFF!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Pay with EZCTO token on BSC and get <span className="font-bold">50% off</span> - only <span className="font-bold text-green-600">${PAYMENT_CONFIG.ezctoPaymentUSD}</span> instead of <span className="line-through">${PAYMENT_CONFIG.priceUSD}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* What You Get */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">What's Included:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>AI-Generated Logo</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Banner (1500×500)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>PFP Avatar</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Promotional Poster</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Landing Page HTML</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Marketing Copy</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Whitepaper Draft</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Launch Tweets</span>
              </div>
            </div>
          </div>

          {/* Payment Component */}
          <CryptoPayment 
            projectId={projectId}
            onPaymentSuccess={onPaymentSuccess}
          />

          {/* Info Text */}
          <p className="text-xs text-center text-muted-foreground">
            Secure payment via blockchain • One-time fee • No recurring charges
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
