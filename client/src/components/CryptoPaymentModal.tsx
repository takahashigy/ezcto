/**
 * Crypto Payment Modal for Launch V2
 * Supports BSC (USDT) and Solana (USDC) payments with discount detection
 */
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Check, AlertCircle, Copy, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useWeb3 } from '@/hooks/useWeb3';
import { useDiscountCheck } from '@/hooks/useDiscountCheck';
import { PAYMENT_CONFIG, calculatePrice, formatPrice } from '../../../shared/paymentConfig';
import QRCode from 'qrcode';

interface CryptoPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onPaymentSuccess: (txHash: string, chain: 'bsc' | 'solana') => void;
}

export function CryptoPaymentModal({ open, onClose, onPaymentSuccess }: CryptoPaymentModalProps) {
  const { account, chainId, connectWallet, switchToBSC } = useWeb3();
  const { isEligible, isChecking, tokenBalance } = useDiscountCheck(account, chainId);
  
  const [selectedChain, setSelectedChain] = useState<'bsc' | 'solana'>('bsc');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [txHash, setTxHash] = useState('');
  const [qrCodeBSC, setQrCodeBSC] = useState('');
  const [qrCodeSolana, setQrCodeSolana] = useState('');

  const finalPrice = calculatePrice(isEligible);
  const discountAmount = PAYMENT_CONFIG.basePrice - finalPrice;

  // Generate QR codes
  useEffect(() => {
    QRCode.toDataURL(PAYMENT_CONFIG.bsc.receiverAddress, { width: 200 })
      .then(setQrCodeBSC)
      .catch(console.error);
    
    QRCode.toDataURL(PAYMENT_CONFIG.solana.receiverAddress, { width: 200 })
      .then(setQrCodeSolana)
      .catch(console.error);
  }, []);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard!');
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet('metamask'); // Default to MetaMask
      toast.success('Wallet connected!');
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error(error);
    }
  };

  const handleSwitchToBSC = async () => {
    try {
      await switchToBSC();
      setSelectedChain('bsc');
      toast.success('Switched to BSC network');
    } catch (error) {
      toast.error('Failed to switch network');
      console.error(error);
    }
  };

  const handlePayBSC = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (chainId !== PAYMENT_CONFIG.bsc.chainId) {
      toast.error('Please switch to BSC network');
      return;
    }

    setPaymentStatus('pending');
    toast.info('Please confirm the transaction in your wallet...');

    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      // Create USDT contract instance
      const usdtContract = new ethers.Contract(
        PAYMENT_CONFIG.bsc.usdt.address,
        PAYMENT_CONFIG.bsc.usdt.abi,
        signer
      );

      // Convert amount to token units (USDT has 18 decimals on BSC)
      const amount = ethers.parseUnits(finalPrice.toString(), PAYMENT_CONFIG.bsc.usdt.decimals);

      // Send transaction
      const tx = await usdtContract.transfer(PAYMENT_CONFIG.bsc.receiverAddress, amount);
      toast.info('Transaction submitted! Waiting for confirmation...');

      // Wait for confirmation
      const receipt = await tx.wait();
      
      setTxHash(receipt.hash);
      setPaymentStatus('success');
      toast.success('Payment successful!');
      
      // Notify parent component
      onPaymentSuccess(receipt.hash, 'bsc');
    } catch (error: any) {
      console.error('[Payment] BSC payment failed:', error);
      setPaymentStatus('failed');
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Payment failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handlePaySolana = () => {
    toast.info('Solana payment coming soon! Please use BSC for now.');
    // TODO: Implement Solana payment
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Complete Payment to Start Generation</DialogTitle>
          <DialogDescription>
            Pay {formatPrice(finalPrice)} to unlock AI-powered project generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Discount Banner */}
          {isEligible && (
            <Card className="bg-green-50 border-green-200 p-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">30% Discount Applied!</p>
                  <p className="text-sm text-green-700">
                    You hold {tokenBalance} discount tokens. Save {formatPrice(discountAmount)}!
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Wallet Connection */}
          {!account ? (
            <Card className="p-6">
              <div className="text-center space-y-4">
                <Wallet className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-lg font-semibold">Connect Your Wallet</p>
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to check for discounts and make payment
                </p>
                <Button onClick={handleConnectWallet} className="font-mono font-semibold">
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Price Summary */}
              <Card className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <div className="text-right">
                    {isEligible && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatPrice(PAYMENT_CONFIG.basePrice)}
                      </p>
                    )}
                    <p className="text-2xl font-bold text-primary">{formatPrice(finalPrice)}</p>
                  </div>
                </div>
              </Card>

              {/* Payment Options */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* BSC Payment */}
                <Card className={`p-4 cursor-pointer transition-all ${
                  selectedChain === 'bsc' ? 'border-primary border-2' : 'border-border'
                }`} onClick={() => setSelectedChain('bsc')}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">BSC (BNB Chain)</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">USDT</span>
                    </div>
                    
                    {qrCodeBSC && (
                      <img src={qrCodeBSC} alt="BSC Address QR" className="w-full" />
                    )}
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Receiver Address:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted p-2 rounded flex-1 overflow-hidden text-ellipsis">
                          {PAYMENT_CONFIG.bsc.receiverAddress}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyAddress(PAYMENT_CONFIG.bsc.receiverAddress);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {chainId !== PAYMENT_CONFIG.bsc.chainId && account ? (
                      <Button onClick={handleSwitchToBSC} className="w-full font-mono">
                        Switch to BSC Network
                      </Button>
                    ) : (
                      <Button
                        onClick={handlePayBSC}
                        disabled={paymentStatus === 'pending' || !account}
                        className="w-full font-mono font-semibold"
                      >
                        {paymentStatus === 'pending' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Pay ${formatPrice(finalPrice)} USDT`
                        )}
                      </Button>
                    )}
                  </div>
                </Card>

                {/* Solana Payment */}
                <Card className={`p-4 cursor-pointer transition-all opacity-50 ${
                  selectedChain === 'solana' ? 'border-primary border-2' : 'border-border'
                }`} onClick={() => setSelectedChain('solana')}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">Solana</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">USDC</span>
                    </div>
                    
                    {qrCodeSolana && (
                      <img src={qrCodeSolana} alt="Solana Address QR" className="w-full" />
                    )}
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Receiver Address:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted p-2 rounded flex-1 overflow-hidden text-ellipsis">
                          {PAYMENT_CONFIG.solana.receiverAddress}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyAddress(PAYMENT_CONFIG.solana.receiverAddress);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handlePaySolana}
                      disabled
                      className="w-full font-mono font-semibold"
                    >
                      Coming Soon
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Payment Status */}
              {paymentStatus === 'success' && (
                <Card className="bg-green-50 border-green-200 p-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">Payment Successful!</p>
                      <p className="text-sm text-green-700">
                        Transaction: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {paymentStatus === 'failed' && (
                <Card className="bg-red-50 border-red-200 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">Payment Failed</p>
                      <p className="text-sm text-red-700">Please try again or contact support</p>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
