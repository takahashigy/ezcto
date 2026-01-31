import { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { WEB3_CONFIG } from '../../../shared/web3Config';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Wallet, AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useToast } from '../hooks/use-toast';

interface CryptoPaymentProps {
  projectId: number;
  onPaymentSuccess: () => void;
}

export function CryptoPayment({ projectId, onPaymentSuccess }: CryptoPaymentProps) {
  const {
    account,
    isConnected,
    isCorrectChain,
    balance,
    isConnecting,
    error: web3Error,
    isMetaMaskInstalled,
    connectWallet,
    switchToBSC,
    sendPayment,
  } = useWeb3();

  const { toast } = useToast();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createPaymentMutation = trpc.crypto.createPayment.useMutation();
  const verifyPaymentMutation = trpc.crypto.verifyPayment.useMutation();

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success && !isCorrectChain) {
      await switchToBSC();
    }
  };

  const handlePayment = async () => {
    if (!account || !isCorrectChain) {
      toast({
        title: 'Error',
        description: 'Please connect wallet and switch to BSC network',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment record
      const payment = await createPaymentMutation.mutateAsync({
        projectId,
        chain: 'BSC',
        tokenSymbol: 'BNB',
        amount: WEB3_CONFIG.PAYMENT.priceInBNB,
        senderAddress: account,
      });

      // Send transaction
      const hash = await sendPayment(WEB3_CONFIG.PAYMENT.priceInBNB);
      
      if (!hash) {
        throw new Error('Transaction failed');
      }

      setTxHash(hash);

      toast({
        title: 'Transaction Sent',
        description: 'Waiting for confirmation...',
      });

      // Verify payment
      const verified = await verifyPaymentMutation.mutateAsync({
        paymentId: payment.id,
        txHash: hash,
      });

      if (verified.success) {
        toast({
          title: 'Payment Confirmed!',
          description: 'Your website deployment is now unlocked.',
        });
        onPaymentSuccess();
      }
    } catch (err: unknown) {
      console.error('Payment error:', err);
      toast({
        title: 'Payment Failed',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isMetaMaskInstalled) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold mb-2">MetaMask Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please install MetaMask to pay with crypto.
            </p>
            <Button asChild variant="outline">
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                Install MetaMask
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pay with Crypto</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <img 
              src="https://cryptologos.cc/logos/bnb-bnb-logo.png" 
              alt="BNB" 
              className="h-5 w-5"
            />
            <span>BSC Network</span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price:</span>
            <span className="font-mono font-semibold">
              {WEB3_CONFIG.PAYMENT.priceInBNB} BNB
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">USD Equivalent:</span>
            <span className="font-mono">${WEB3_CONFIG.PAYMENT.priceInUSD}</span>
          </div>
        </div>

        {web3Error && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{web3Error}</span>
          </div>
        )}

        {!isConnected ? (
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </>
            )}
          </Button>
        ) : !isCorrectChain ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Please switch to BSC network to continue</span>
            </div>
            <Button onClick={switchToBSC} className="w-full" size="lg">
              Switch to BSC
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connected:</span>
                <span className="font-mono text-xs">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>
              </div>
              {balance && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className="font-mono">{parseFloat(balance).toFixed(4)} BNB</span>
                </div>
              )}
            </div>

            {txHash ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-1">Transaction Submitted</p>
                    <a
                      href={`https://bscscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline flex items-center gap-1"
                    >
                      View on BSCScan
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handlePayment} 
                disabled={isProcessing || parseFloat(balance || '0') < parseFloat(WEB3_CONFIG.PAYMENT.priceInBNB)}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {WEB3_CONFIG.PAYMENT.priceInBNB} BNB
                  </>
                )}
              </Button>
            )}

            {balance && parseFloat(balance) < parseFloat(WEB3_CONFIG.PAYMENT.priceInBNB) && (
              <p className="text-xs text-destructive text-center">
                Insufficient BNB balance
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
