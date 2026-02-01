import { useState, useMemo } from 'react';
import { useAccount, useBalance, useSendTransaction, useChainId, useSwitchChain } from 'wagmi';
import { parseEther, parseUnits, formatUnits } from 'viem';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { CHAINS, TOKENS, PAYMENT_CONFIG, PAYMENT_METHODS, ERC20_ABI } from '@shared/web3Config';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertCircle, CheckCircle2, Loader2, ExternalLink, ChevronDown } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useToast } from '../hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface CryptoPaymentProps {
  projectId: number;
  onPaymentSuccess: () => void;
}

type ChainType = 'ETH' | 'BSC' | 'POLYGON' | 'SOLANA';

export function CryptoPayment({ projectId, onPaymentSuccess }: CryptoPaymentProps) {
  const { toast } = useToast();
  const [selectedChain, setSelectedChain] = useState<ChainType>('BSC');
  const [selectedToken, setSelectedToken] = useState<string>('EZCTO');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // EVM hooks
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  
  // Get balance for native token
  const { data: evmBalance } = useBalance({
    address: evmAddress,
  });

  // Solana hooks
  const { publicKey: solanaPublicKey, connected: solanaConnected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // tRPC mutations
  const createPaymentMutation = trpc.crypto.createPayment.useMutation();
  const verifyPaymentMutation = trpc.crypto.verifyPayment.useMutation();

  // Check if on correct chain
  const isCorrectChain = useMemo(() => {
    if (selectedChain === 'SOLANA') return solanaConnected;
    const targetChainId = CHAINS[selectedChain].chainId;
    return chainId === targetChainId;
  }, [selectedChain, chainId, solanaConnected]);

  // Get available tokens for selected chain
  const availableTokens = useMemo(() => {
    if (selectedChain === 'SOLANA') {
      return Object.entries(TOKENS.SOLANA).map(([key, token]) => ({
        key,
        ...token,
      }));
    }
    return Object.entries(TOKENS[selectedChain]).map(([key, token]) => ({
      key,
      ...token,
    }));
  }, [selectedChain]);

  // Get token amount for payment
  const getTokenAmount = () => {
    const token = availableTokens.find(t => t.key === selectedToken);
    if (!token) return '0';
    
    // For stablecoins, use USD price directly
    if (['USDT', 'USDC'].includes(selectedToken)) {
      return PAYMENT_CONFIG.priceUSD.toString();
    }
    
    // For native tokens and others, calculate based on approximate rates
    // This is a placeholder - in production, use a price oracle
    if (selectedToken === 'ETH') return '0.12';
    if (selectedToken === 'BNB') return '0.55';
    if (selectedToken === 'MATIC') return '500';
    if (selectedToken === 'SOL') return '1.5';
    if (selectedToken === 'EZCTO') return '299000'; // Example rate
    
    return PAYMENT_CONFIG.priceUSD.toString();
  };

  const handleChainSwitch = async () => {
    if (selectedChain === 'SOLANA') return;
    
    const targetChainId = CHAINS[selectedChain].chainId;
    try {
      await switchChain({ chainId: targetChainId });
    } catch (err) {
      console.error('Failed to switch chain:', err);
      toast({
        title: 'Network Switch Failed',
        description: 'Please switch network manually in your wallet',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const amount = getTokenAmount();
      const token = availableTokens.find(t => t.key === selectedToken);
      
      if (!token) {
        throw new Error('Invalid token selected');
      }

      // Create payment record
      const payment = await createPaymentMutation.mutateAsync({
        projectId,
        chain: selectedChain as 'ETH' | 'BSC' | 'POLYGON' | 'SOLANA',
        tokenSymbol: selectedToken,
        tokenAddress: token.address === 'native' ? null : token.address,
        amount,
        senderAddress: selectedChain === 'SOLANA' 
          ? solanaPublicKey?.toString() || ''
          : evmAddress || '',
      });

      let hash: string;

      if (selectedChain === 'SOLANA') {
        // Solana payment
        if (!solanaPublicKey) throw new Error('Wallet not connected');
        
        const receiver = new PublicKey(PAYMENT_CONFIG.receivers.SOLANA);
        const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
        
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: solanaPublicKey,
            toPubkey: receiver,
            lamports,
          })
        );

        const signature = await sendTransaction(transaction, connection);
        hash = signature;
      } else {
        // EVM payment
        if (!evmAddress) throw new Error('Wallet not connected');

        if (token.address === 'native') {
          // Native token transfer
          const result = await sendTransactionAsync({
            to: PAYMENT_CONFIG.receivers.EVM as `0x${string}`,
            value: parseEther(amount),
          });
          hash = result;
        } else {
          // ERC20 token transfer
          const tokenAmount = parseUnits(amount, token.decimals);
          // For ERC20, we need to use writeContract - simplified here
          const result = await sendTransactionAsync({
            to: token.address as `0x${string}`,
            data: `0xa9059cbb000000000000000000000000${PAYMENT_CONFIG.receivers.EVM.slice(2)}${tokenAmount.toString(16).padStart(64, '0')}` as `0x${string}`,
          });
          hash = result;
        }
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

  const isConnected = selectedChain === 'SOLANA' ? solanaConnected : evmConnected;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pay with Crypto</h3>
          <span className="text-sm text-muted-foreground">
            ${PAYMENT_CONFIG.priceUSD} USD
          </span>
        </div>

        {/* Chain Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Network</label>
          <Select value={selectedChain} onValueChange={(v) => {
            setSelectedChain(v as ChainType);
            // Reset token to first available
            const tokens = Object.keys(TOKENS[v as ChainType]);
            setSelectedToken(v === 'BSC' ? 'EZCTO' : tokens[0]);
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BSC">
                <div className="flex items-center gap-2">
                  <img src="https://cryptologos.cc/logos/bnb-bnb-logo.png" alt="BSC" className="h-5 w-5" />
                  BNB Smart Chain (Recommended)
                </div>
              </SelectItem>
              <SelectItem value="ETH">
                <div className="flex items-center gap-2">
                  <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="h-5 w-5" />
                  Ethereum
                </div>
              </SelectItem>
              <SelectItem value="POLYGON">
                <div className="flex items-center gap-2">
                  <img src="https://cryptologos.cc/logos/polygon-matic-logo.png" alt="Polygon" className="h-5 w-5" />
                  Polygon
                </div>
              </SelectItem>
              <SelectItem value="SOLANA">
                <div className="flex items-center gap-2">
                  <img src="https://cryptologos.cc/logos/solana-sol-logo.png" alt="Solana" className="h-5 w-5" />
                  Solana
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Token Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Token</label>
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTokens.map((token) => (
                <SelectItem key={token.key} value={token.key}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{token.symbol}</span>
                    <span className="text-muted-foreground text-xs">({token.name})</span>
                    {token.key === 'EZCTO' && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Preferred</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Display */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-mono font-semibold">
              {getTokenAmount()} {selectedToken}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">USD Value:</span>
            <span className="font-mono">${PAYMENT_CONFIG.priceUSD}</span>
          </div>
        </div>

        {/* Wallet Connection */}
        {!isConnected ? (
          <div className="space-y-3">
            {selectedChain === 'SOLANA' ? (
              <div className="flex justify-center">
                <WalletMultiButton />
              </div>
            ) : (
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            )}
          </div>
        ) : !isCorrectChain && selectedChain !== 'SOLANA' ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Please switch to {CHAINS[selectedChain].name} to continue</span>
            </div>
            <Button onClick={handleChainSwitch} className="w-full" size="lg">
              Switch to {CHAINS[selectedChain].name}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Connected:</span>
                <span className="font-mono text-xs">
                  {selectedChain === 'SOLANA' 
                    ? `${solanaPublicKey?.toString().slice(0, 6)}...${solanaPublicKey?.toString().slice(-4)}`
                    : `${evmAddress?.slice(0, 6)}...${evmAddress?.slice(-4)}`
                  }
                </span>
              </div>
              {evmBalance && selectedChain !== 'SOLANA' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className="font-mono">
                    {parseFloat(formatUnits(evmBalance.value, evmBalance.decimals)).toFixed(4)} {evmBalance.symbol}
                  </span>
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
                      href={`${CHAINS[selectedChain].blockExplorer}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline flex items-center gap-1"
                    >
                      View on Explorer
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handlePayment} 
                disabled={isProcessing}
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
                    Pay {getTokenAmount()} {selectedToken}
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          {selectedChain === 'BSC' && selectedToken === 'EZCTO' 
            ? 'Pay with EZCTO token on BSC for the best experience'
            : 'ETH, USDT, and USDC are also accepted as payment'
          }
        </p>
      </div>
    </Card>
  );
}
