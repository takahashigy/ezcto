import { useState, useMemo, useEffect } from 'react';
import { useAccount, useBalance, useSendTransaction, useChainId, useSwitchChain, useReadContract } from 'wagmi';
import { parseEther, parseUnits, formatUnits } from 'viem';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { CHAINS, TOKENS, PAYMENT_CONFIG, PAYMENT_METHODS, ERC20_ABI } from '@shared/web3Config';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertCircle, CheckCircle2, Loader2, ExternalLink, ChevronDown, Sparkles, ShoppingCart, Star, Wallet, AlertTriangle } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useToast } from '../hooks/use-toast';
import { useWalletAuth } from '../hooks/useWalletAuth';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
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
  onBeforePayment?: () => Promise<{ success: boolean; projectId?: number; error?: string }>;
}

type ChainType = 'ETH' | 'BSC' | 'POLYGON' | 'SOLANA';

// PancakeSwap URL for buying EZCTO
const PANCAKESWAP_EZCTO_URL = `https://pancakeswap.finance/swap?outputCurrency=${TOKENS.BSC.EZCTO.address}&chain=bsc`;

// ERC20 balanceOf ABI
const BALANCE_OF_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

export function CryptoPayment({ projectId, onPaymentSuccess, onBeforePayment }: CryptoPaymentProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedChain, setSelectedChain] = useState<ChainType>('BSC');
  const [selectedToken, setSelectedToken] = useState<string>('EZCTO');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Wallet auth hooks
  const { signInWithWallet, isSigningIn } = useWalletAuth();
  const { isAuthenticated, refresh: refreshAuth } = useAuth();

  // EVM hooks
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  
  // Get balance for native token
  const { data: evmBalance } = useBalance({
    address: evmAddress,
  });

  // Get EZCTO token balance
  const { data: ezctoBalanceRaw, isLoading: ezctoBalanceLoading } = useReadContract({
    address: TOKENS.BSC.EZCTO.address as `0x${string}`,
    abi: BALANCE_OF_ABI,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    chainId: CHAINS.BSC.chainId,
    query: {
      enabled: !!evmAddress && selectedChain === 'BSC' && selectedToken === 'EZCTO',
      refetchInterval: 15000,
    }
  });

  // Format EZCTO balance
  const ezctoBalance = useMemo(() => {
    if (!ezctoBalanceRaw) return '0';
    return formatUnits(ezctoBalanceRaw as bigint, TOKENS.BSC.EZCTO.decimals);
  }, [ezctoBalanceRaw]);

  // Solana hooks
  const { publicKey: solanaPublicKey, connected: solanaConnected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // tRPC mutations
  const createPaymentMutation = trpc.crypto.createPayment.useMutation();
  const verifyPaymentMutation = trpc.crypto.verifyPayment.useMutation();
  
  // Get EZCTO price from DEX
  const { data: ezctoPrice, isLoading: ezctoPriceLoading } = trpc.crypto.getEzctoPrice.useQuery(
    undefined,
    {
      refetchInterval: 30000,
      enabled: selectedToken === 'EZCTO',
    }
  );

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

  // Get current price for display
  const getCurrentPrice = () => {
    if (selectedToken === 'EZCTO') {
      return PAYMENT_CONFIG.ezctoPaymentUSD;
    }
    return PAYMENT_CONFIG.priceUSD;
  };

  // Get token amount for payment
  const getTokenAmount = () => {
    const token = availableTokens.find(t => t.key === selectedToken);
    if (!token) return '0';
    
    if (selectedToken === 'EZCTO' && ezctoPrice?.ezctoNeeded) {
      return ezctoPrice.ezctoNeeded.toFixed(2);
    }
    
    if (['USDT', 'USDC'].includes(selectedToken)) {
      return PAYMENT_CONFIG.priceUSD.toString();
    }
    
    if (selectedToken === 'ETH') return '0.12';
    if (selectedToken === 'BNB') return '0.55';
    if (selectedToken === 'MATIC') return '500';
    if (selectedToken === 'SOL') return '1.5';
    
    return PAYMENT_CONFIG.priceUSD.toString();
  };

  // Check if user has enough EZCTO balance
  const requiredAmount = parseFloat(getTokenAmount());
  const currentBalance = parseFloat(ezctoBalance);
  const hasEnoughBalance = currentBalance >= requiredAmount;
  const shortfall = requiredAmount - currentBalance;

  const handleChainSwitch = async () => {
    if (selectedChain === 'SOLANA') return;
    
    const targetChainId = CHAINS[selectedChain].chainId;
    try {
      await switchChain({ chainId: targetChainId });
    } catch (err) {
      console.error('Failed to switch chain:', err);
      toast({
        title: t('cryptoPayment.networkSwitchFailed'),
        description: t('cryptoPayment.switchManually'),
        variant: 'destructive',
      });
    }
  };

  // State to track the actual project ID (may be updated by onBeforePayment)
  const [actualProjectId, setActualProjectId] = useState<number>(projectId);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Auto sign-in with wallet if not authenticated
      if (!isAuthenticated && evmConnected) {
        toast({
          title: 'Signing in with wallet...',
          description: 'Please sign the message in your wallet',
        });
        const signInSuccess = await signInWithWallet();
        if (!signInSuccess) {
          throw new Error('Failed to sign in with wallet. Please try again.');
        }
        await refreshAuth();
      }

      // Call onBeforePayment to validate form and create project
      let currentProjectId = projectId;
      if (onBeforePayment) {
        const result = await onBeforePayment();
        if (!result.success) {
          throw new Error(result.error || 'Please complete the form before payment');
        }
        if (result.projectId) {
          currentProjectId = result.projectId;
          setActualProjectId(result.projectId);
        }
      }

      const amount = getTokenAmount();
      const token = availableTokens.find(t => t.key === selectedToken);
      
      if (!token) {
        throw new Error('Invalid token selected');
      }

      const payment = await createPaymentMutation.mutateAsync({
        projectId: currentProjectId,
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
        if (!evmAddress) throw new Error('Wallet not connected');

        if (token.address === 'native') {
          const result = await sendTransactionAsync({
            to: PAYMENT_CONFIG.receivers.EVM as `0x${string}`,
            value: parseEther(amount),
          });
          hash = result;
        } else {
          const tokenAmount = parseUnits(amount, token.decimals);
          const result = await sendTransactionAsync({
            to: token.address as `0x${string}`,
            data: `0xa9059cbb000000000000000000000000${PAYMENT_CONFIG.receivers.EVM.slice(2)}${tokenAmount.toString(16).padStart(64, '0')}` as `0x${string}`,
          });
          hash = result;
        }
      }

      setTxHash(hash);

      toast({
        title: t('cryptoPayment.transactionSent'),
        description: t('cryptoPayment.waitingConfirmation'),
      });

      const verified = await verifyPaymentMutation.mutateAsync({
        paymentId: payment.id,
        txHash: hash,
      });

      if (verified.success) {
        toast({
          title: t('cryptoPayment.paymentConfirmed'),
          description: t('cryptoPayment.deploymentUnlocked'),
        });
        onPaymentSuccess();
      }
    } catch (err: unknown) {
      console.error('Payment error:', err);
      toast({
        title: t('cryptoPayment.paymentFailed'),
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isConnected = selectedChain === 'SOLANA' ? solanaConnected : evmConnected;

  // Calculate savings
  const savings = PAYMENT_CONFIG.priceUSD - PAYMENT_CONFIG.ezctoPaymentUSD;
  const discountPercent = Math.round((savings / PAYMENT_CONFIG.priceUSD) * 100);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header with Price */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('cryptoPayment.title')}</h3>
          <div className="text-right">
            {selectedToken === 'EZCTO' ? (
              <div className="flex flex-col items-end">
                <span className="text-sm line-through text-muted-foreground">${PAYMENT_CONFIG.priceUSD}</span>
                <span className="text-xl font-bold text-green-600">${PAYMENT_CONFIG.ezctoPaymentUSD}</span>
              </div>
            ) : (
              <span className="text-xl font-bold">${PAYMENT_CONFIG.priceUSD}</span>
            )}
          </div>
        </div>

        {/* EZCTO Recommended Banner */}
        {selectedChain === 'BSC' && (
          <div className="relative overflow-hidden bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-green-500/30 rounded-xl p-4">
            {/* Recommended Badge */}
            <div className="absolute -top-1 -right-1">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg flex items-center gap-1 shadow-lg">
                <Star className="h-3 w-3 fill-current" />
                {t('cryptoPayment.recommended')}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-green-700 dark:text-green-400">{t('cryptoPayment.payWithEzcto')}</span>
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    -{discountPercent}% OFF
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('cryptoPayment.saveAmount')} <span className="font-bold text-green-600">${savings}</span> {t('cryptoPayment.whenPayWithEzcto')}
                </p>
                
                {/* Price Comparison */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground line-through">${PAYMENT_CONFIG.priceUSD}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-2xl font-black text-green-600">${PAYMENT_CONFIG.ezctoPaymentUSD}</span>
                  </div>
                </div>
                
                {/* Buy EZCTO Link */}
                <a
                  href={PANCAKESWAP_EZCTO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {t('cryptoPayment.buyEzctoOnPancake')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Chain Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('cryptoPayment.selectNetwork')}</label>
          <Select value={selectedChain} onValueChange={(v) => {
            setSelectedChain(v as ChainType);
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
                  <span>BNB Smart Chain</span>
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded font-medium">{t('cryptoPayment.bestRate')}</span>
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
          <label className="text-sm font-medium">{t('cryptoPayment.selectToken')}</label>
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger className={selectedToken === 'EZCTO' ? 'border-green-500 ring-1 ring-green-500/20' : ''}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTokens.map((token) => (
                <SelectItem key={token.key} value={token.key}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{token.symbol}</span>
                    <span className="text-muted-foreground text-xs">({token.name})</span>
                    {token.key === 'EZCTO' && (
                      <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        -{discountPercent}%
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* EZCTO Balance Display */}
        {selectedChain === 'BSC' && selectedToken === 'EZCTO' && evmConnected && isCorrectChain && (
          <div className={`rounded-lg p-4 border-2 ${hasEnoughBalance ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className={`h-5 w-5 ${hasEnoughBalance ? 'text-green-600' : 'text-amber-600'}`} />
                <span className="font-medium text-sm">{t('cryptoPayment.yourEzctoBalance')}</span>
              </div>
              {ezctoBalanceLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <span className={`font-mono font-bold text-lg ${hasEnoughBalance ? 'text-green-600' : 'text-amber-600'}`}>
                  {parseFloat(ezctoBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} EZCTO
                </span>
              )}
            </div>
            
            {/* Balance comparison */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('cryptoPayment.required')}:</span>
                <span className="font-mono">{requiredAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} EZCTO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('cryptoPayment.yourBalance')}:</span>
                <span className={`font-mono ${hasEnoughBalance ? 'text-green-600' : 'text-amber-600'}`}>
                  {parseFloat(ezctoBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} EZCTO
                </span>
              </div>
              {hasEnoughBalance ? (
                <div className="flex items-center gap-1 text-green-600 mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">{t('cryptoPayment.sufficientBalance')}</span>
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-1 text-amber-600 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">
                      {t('cryptoPayment.needMore')} {shortfall.toLocaleString(undefined, { maximumFractionDigits: 2 })} {t('cryptoPayment.moreEzcto')}
                    </span>
                  </div>
                  <a
                    href={PANCAKESWAP_EZCTO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {t('cryptoPayment.buyEzctoOnPancake')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price Display */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          {selectedToken === 'EZCTO' && (
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <span className="text-xl">🎉</span>
                  <span className="font-bold">{t('cryptoPayment.youSave')} ${savings}!</span>
                </div>
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                  {discountPercent}% OFF
                </span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                {t('cryptoPayment.payWithEzctoEnjoy')}
              </p>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('cryptoPayment.amount')}:</span>
            {ezctoPriceLoading && selectedToken === 'EZCTO' ? (
              <span className="font-mono text-muted-foreground">{t('cryptoPayment.loading')}</span>
            ) : (
              <span className="font-mono font-semibold">
                {getTokenAmount()} {selectedToken}
              </span>
            )}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('cryptoPayment.usdValue')}:</span>
            <div className="flex items-center gap-2">
              {selectedToken === 'EZCTO' && (
                <span className="font-mono text-muted-foreground line-through text-xs">${PAYMENT_CONFIG.priceUSD}</span>
              )}
              <span className={`font-mono font-bold ${selectedToken === 'EZCTO' ? 'text-green-600' : ''}`}>
                ${getCurrentPrice()}
              </span>
            </div>
          </div>
          {selectedToken === 'EZCTO' && ezctoPrice?.priceUsd && (
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>{t('cryptoPayment.ezctoPrice')}:</span>
              <span className="font-mono">${ezctoPrice.priceUsd.toFixed(6)}</span>
            </div>
          )}
        </div>

        {/* Buy EZCTO CTA for non-EZCTO selection */}
        {selectedChain === 'BSC' && selectedToken !== 'EZCTO' && (
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>{t('cryptoPayment.switchToEzcto')} ${savings}!</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/30"
              onClick={() => setSelectedToken('EZCTO')}
            >
              {t('cryptoPayment.useEzcto')}
            </Button>
          </div>
        )}

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
              <span>{t('cryptoPayment.switchToNetwork')} {CHAINS[selectedChain].name} {t('cryptoPayment.toContinue')}</span>
            </div>
            <Button onClick={handleChainSwitch} className="w-full" size="lg">
              {t('cryptoPayment.switchTo')} {CHAINS[selectedChain].name}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('cryptoPayment.connected')}:</span>
                <span className="font-mono text-xs">
                  {selectedChain === 'SOLANA' 
                    ? `${solanaPublicKey?.toString().slice(0, 6)}...${solanaPublicKey?.toString().slice(-4)}`
                    : `${evmAddress?.slice(0, 6)}...${evmAddress?.slice(-4)}`
                  }
                </span>
              </div>
              {evmBalance && selectedChain !== 'SOLANA' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('cryptoPayment.nativeBalance')}:</span>
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
                    <p className="font-medium mb-1">{t('cryptoPayment.transactionSubmitted')}</p>
                    <a
                      href={`${CHAINS[selectedChain].blockExplorer}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline flex items-center gap-1"
                    >
                      {t('cryptoPayment.viewOnExplorer')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handlePayment} 
                disabled={isProcessing || (selectedToken === 'EZCTO' && !hasEnoughBalance)}
                className={`w-full ${selectedToken === 'EZCTO' ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' : ''}`}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('cryptoPayment.processing')}
                  </>
                ) : selectedToken === 'EZCTO' && !hasEnoughBalance ? (
                  <>
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {t('cryptoPayment.insufficientBalance')}
                  </>
                ) : (
                  <>
                    {t('cryptoPayment.pay')} {getTokenAmount()} {selectedToken}
                    {selectedToken === 'EZCTO' && <span className="ml-2 text-xs opacity-80">({t('cryptoPayment.save')} ${savings})</span>}
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Footer Info with PancakeSwap Link */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {selectedChain === 'BSC' && selectedToken === 'EZCTO' 
              ? `🔥 ${t('cryptoPayment.bestDeal')}`
              : `${t('cryptoPayment.otherAccepted')} $199`
            }
          </p>
          {selectedChain === 'BSC' && (
            <a
              href={PANCAKESWAP_EZCTO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <ShoppingCart className="h-3 w-3" />
              {t('cryptoPayment.needEzcto')}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
