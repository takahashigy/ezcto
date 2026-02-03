/**
 * Pricing Preview Modal
 * Shows pricing information without requiring project creation
 * Content mirrors the payment modal for consistency
 */
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Star, ShoppingCart, ExternalLink, X } from 'lucide-react';
import { PAYMENT_CONFIG, TOKENS } from '@shared/web3Config';
import { useLanguage } from '@/contexts/LanguageContext';

// PancakeSwap URL for buying EZCTO
const PANCAKESWAP_EZCTO_URL = `https://pancakeswap.finance/swap?outputCurrency=${TOKENS.BSC.EZCTO.address}&chain=bsc`;

interface PricingPreviewModalProps {
  open: boolean;
  onClose: () => void;
}

export function PricingPreviewModal({ open, onClose }: PricingPreviewModalProps) {
  const { language } = useLanguage();
  
  const savings = PAYMENT_CONFIG.priceUSD - PAYMENT_CONFIG.ezctoPaymentUSD;
  const discountPercent = Math.round((savings / PAYMENT_CONFIG.priceUSD) * 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {language === 'zh' ? '价格方案' : 'Pricing Plans'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {language === 'zh' 
              ? '选择最适合您的支付方式，使用 EZCTO 代币可享受 50% 折扣'
              : 'Choose the payment method that works best for you. Pay with EZCTO token for 50% off!'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Price Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard Price Card */}
            <Card className="p-5 border-2 border-muted">
              <div className="text-center space-y-3">
                <h3 className="font-semibold text-lg text-muted-foreground">
                  {language === 'zh' ? '标准价格' : 'Standard Price'}
                </h3>
                <div className="text-4xl font-bold">${PAYMENT_CONFIG.priceUSD}</div>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh' 
                    ? '支持 ETH / BNB / USDT / USDC / SOL'
                    : 'Pay with ETH / BNB / USDT / USDC / SOL'
                  }
                </p>
              </div>
            </Card>

            {/* EZCTO Discount Card */}
            <Card className="p-5 border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 relative overflow-hidden">
              {/* Recommended Badge */}
              <div className="absolute -top-1 -right-1">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg flex items-center gap-1 shadow-lg">
                  <Star className="h-3 w-3 fill-current" />
                  {language === 'zh' ? '推荐' : 'BEST VALUE'}
                </div>
              </div>
              
              <div className="text-center space-y-3">
                <h3 className="font-semibold text-lg text-green-700 dark:text-green-400">
                  {language === 'zh' ? 'EZCTO 代币支付' : 'Pay with EZCTO'}
                </h3>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl line-through text-muted-foreground">${PAYMENT_CONFIG.priceUSD}</span>
                  <span className="text-4xl font-bold text-green-600">${PAYMENT_CONFIG.ezctoPaymentUSD}</span>
                </div>
                <div className="inline-flex items-center gap-1 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  -{discountPercent}% OFF
                </div>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {language === 'zh' 
                    ? `节省 $${savings}！在 BSC 链上使用 EZCTO 代币支付`
                    : `Save $${savings}! Pay with EZCTO token on BSC`
                  }
                </p>
              </div>
            </Card>
          </div>

          {/* Buy EZCTO Banner */}
          <Card className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-green-500/30 p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-700 dark:text-green-400">
                    {language === 'zh' ? '还没有 EZCTO 代币？' : "Don't have EZCTO tokens?"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh' 
                      ? '在 PancakeSwap 上购买，享受 50% 折扣'
                      : 'Buy on PancakeSwap and enjoy 50% discount'
                    }
                  </p>
                </div>
              </div>
              <a
                href={PANCAKESWAP_EZCTO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                <ShoppingCart className="h-4 w-4" />
                {language === 'zh' ? '购买 EZCTO' : 'Buy EZCTO'}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </Card>

          {/* What You Get */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">
              {language === 'zh' ? '包含内容：' : "What's Included:"}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{language === 'zh' ? 'AI 生成 Logo' : 'AI-Generated Logo'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{language === 'zh' ? 'Banner (1500×500)' : 'Banner (1500×500)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{language === 'zh' ? 'PFP 头像' : 'PFP Avatar'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{language === 'zh' ? '宣传海报' : 'Promotional Poster'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{language === 'zh' ? '落地页 HTML' : 'Landing Page HTML'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{language === 'zh' ? '营销文案' : 'Marketing Copy'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{language === 'zh' ? '白皮书草稿' : 'Whitepaper Draft'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{language === 'zh' ? '发布推文' : 'Launch Tweets'}</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-2">
            <Button 
              onClick={onClose}
              variant="outline"
              className="px-8"
            >
              {language === 'zh' ? '关闭' : 'Close'}
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-center text-muted-foreground">
            {language === 'zh' 
              ? '安全的区块链支付 • 一次性费用 • 无订阅费'
              : 'Secure payment via blockchain • One-time fee • No recurring charges'
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
