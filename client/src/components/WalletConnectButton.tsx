import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from './ui/button';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Check, Zap, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import { useState, useEffect, useRef } from 'react';
import { useAccount, useDisconnect, useBalance, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { bsc, mainnet, polygon } from 'wagmi/chains';
import { toast } from 'sonner';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

type WalletMode = 'evm' | 'solana';

// Chain icons and info
const CHAIN_INFO: Record<number, { name: string; icon: string; color: string }> = {
  [mainnet.id]: { name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  [bsc.id]: { name: 'BSC', icon: '⛓', color: '#F0B90B' },
  [polygon.id]: { name: 'Polygon', icon: '⬡', color: '#8247E5' },
};

// Truncate address for display
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Copy to clipboard helper
async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
  toast.success('Address copied to clipboard');
}

export function WalletConnectButton() {
  const [walletMode, setWalletMode] = useState<WalletMode>('evm');
  const [copied, setCopied] = useState(false);
  const [isAutoSigningIn, setIsAutoSigningIn] = useState(false);
  
  // Track if we've already attempted auto sign-in for this connection
  const hasAttemptedAutoSignIn = useRef(false);
  const previousAddress = useRef<string | undefined>(undefined);
  
  // EVM wallet state
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  
  // Solana wallet state
  const { connected: solanaConnected, publicKey, disconnect: disconnectSolana } = useWallet();

  // Auth hooks
  const { signInWithWallet, isSigningIn } = useWalletAuth();
  const { isAuthenticated, refresh: refreshAuth } = useAuth();
  const { language } = useLanguage();

  // Bilingual text
  const texts = {
    signingIn: language === 'zh' ? '登录中...' : 'Signing in...',
    loggedIn: language === 'zh' ? '已登录' : 'Logged in',
    notLoggedIn: language === 'zh' ? '未登录' : 'Not logged in',
    signInWithWallet: language === 'zh' ? '使用钱包登录' : 'Sign in with Wallet',
    viewOnExplorer: language === 'zh' ? '在浏览器中查看' : 'View on Explorer',
    switchNetwork: language === 'zh' ? '切换网络' : 'Switch Network',
    changeNetwork: language === 'zh' ? '更改网络' : 'Change Network',
    disconnect: language === 'zh' ? '断开连接' : 'Disconnect',
    connectWallet: language === 'zh' ? '连接钱包' : 'Connect Wallet',
    connectAndSignIn: language === 'zh' ? '连接并登录您的钱包' : 'Connect and sign in with your wallet',
    selectEvmWallet: language === 'zh' ? '选择 EVM 钱包' : 'Select EVM Wallet',
    supportsWallets: language === 'zh' ? '支持 Binance, OKX, Trust, TokenPocket, MetaMask' : 'Supports Binance, OKX, Trust, TokenPocket, MetaMask',
    signToLogin: language === 'zh' ? '连接后需签名完成登录（不涉及资产转移）' : "You'll sign a message to login (no asset transfer)",
    supportsSolana: language === 'zh' ? '支持 Phantom, Solflare' : 'Supports Phantom, Solflare',
    walletDisconnected: language === 'zh' ? '钱包已断开' : 'Wallet disconnected',
    addressCopied: language === 'zh' ? '地址已复制' : 'Address copied to clipboard',
    pleaseSignMessage: language === 'zh' ? '请在钱包中签名以完成登录\n（仅验证身份，不涉及资产）' : 'Please sign the message in your wallet to complete login\n(Identity verification only, no asset transfer)',
    walletConnectedSuccess: language === 'zh' ? '钱包连接并登录成功！' : 'Wallet connected and logged in successfully!',
    signInFailed: language === 'zh' ? '登录失败，请重新连接钱包重试' : 'Failed to sign in. You can try again by reconnecting your wallet.',
    signInError: language === 'zh' ? '登录失败，请重试' : 'Sign-in failed. Please try again.',
    loggedInSuccess: language === 'zh' ? '登录成功！' : 'Logged in successfully!',
  };

  // Auto sign-in when wallet connects (EVM only)
  useEffect(() => {
    // Reset the flag when address changes (new wallet connected)
    if (address !== previousAddress.current) {
      hasAttemptedAutoSignIn.current = false;
      previousAddress.current = address;
    }

    // Only trigger auto sign-in if:
    // 1. Wallet is connected
    // 2. User is not already authenticated
    // 3. Not currently signing in
    // 4. Haven't already attempted for this connection
    // 5. EVM mode
    if (
      isConnected && 
      address && 
      !isAuthenticated && 
      !isSigningIn && 
      !isAutoSigningIn &&
      !hasAttemptedAutoSignIn.current &&
      walletMode === 'evm'
    ) {
      hasAttemptedAutoSignIn.current = true;
      
      const performAutoSignIn = async () => {
        setIsAutoSigningIn(true);
        toast.info(texts.pleaseSignMessage, {
          duration: 5000,
        });
        
        try {
          const success = await signInWithWallet();
          if (success) {
            await refreshAuth();
            toast.success(texts.walletConnectedSuccess);
          } else {
            toast.error(texts.signInFailed);
          }
        } catch (error) {
          console.error('[WalletConnectButton] Auto sign-in error:', error);
          toast.error(texts.signInError);
        } finally {
          setIsAutoSigningIn(false);
        }
      };
      
      // Small delay to ensure wallet connection is fully established
      const timer = setTimeout(performAutoSignIn, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, isAuthenticated, isSigningIn, isAutoSigningIn, walletMode, signInWithWallet, refreshAuth]);

  const handleCopy = async () => {
    if (address) {
      await copyToClipboard(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    if (walletMode === 'evm') {
      disconnect();
    } else {
      disconnectSolana();
    }
    // Reset the auto sign-in flag when disconnecting
    hasAttemptedAutoSignIn.current = false;
    toast.success(texts.walletDisconnected);
  };

  const chainInfo = chainId ? CHAIN_INFO[chainId] : null;

  // Show loading state during auto sign-in
  const showSigningInState = isSigningIn || isAutoSigningIn;

  // Connected state UI
  if (isConnected && address && walletMode === 'evm') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all"
            disabled={showSigningInState}
          >
            {showSigningInState ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{texts.signingIn}</span>
              </>
            ) : (
              <>
                {/* Chain indicator */}
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: chainInfo?.color || '#22c55e' }}
                />
                
                {/* Address */}
                <span className="font-mono text-sm text-foreground">
                  {truncateAddress(address)}
                </span>
                
                {/* Balance */}
                {balance && (
                  <span className="hidden sm:inline text-xs text-muted-foreground border-l border-border pl-2 ml-1">
                    {parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} {balance.symbol}
                  </span>
                )}
                
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
          {/* Header with wallet info */}
          <div className="bg-primary/5 p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: `${chainInfo?.color}20`, color: chainInfo?.color }}
              >
                {chainInfo?.icon || '⟠'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">
                    {truncateAddress(address)}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1 hover:bg-primary/10 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span 
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${chainInfo?.color}20`, color: chainInfo?.color }}
                  >
                    {chainInfo?.name || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {balance ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}` : '0.0000'}
                  </span>
                  {/* Login status indicator */}
                  {isAuthenticated ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-600">
                      {texts.loggedIn}
                    </span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-600">
                      {texts.notLoggedIn}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-2">
            {/* Manual sign-in option if not authenticated */}
            {!isAuthenticated && !showSigningInState && (
              <>
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer text-primary"
                  onClick={async () => {
                    setIsAutoSigningIn(true);
                    toast.info(texts.pleaseSignMessage);
                    try {
                      const success = await signInWithWallet();
                      if (success) {
                        await refreshAuth();
                        toast.success(texts.loggedInSuccess);
                      } else {
                        toast.error(texts.signInError);
                      }
                    } catch (error) {
                      toast.error(texts.signInError);
                    } finally {
                      setIsAutoSigningIn(false);
                    }
                  }}
                >
                  <Wallet className="h-4 w-4" />
                  <span>{texts.signInWithWallet}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuItem 
              className="gap-2 cursor-pointer"
              onClick={() => window.open(`https://bscscan.com/address/${address}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              <span>{texts.viewOnExplorer}</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Switch Network - using RainbowKit's built-in */}
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              {texts.switchNetwork}
            </DropdownMenuLabel>
            <div className="px-2 pb-2">
              <ConnectButton.Custom>
                {({ chain, openChainModal }) => (
                  <button
                    onClick={openChainModal}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                  >
                    <Zap className="h-4 w-4" />
                    <span>{texts.changeNetwork}</span>
                    {chain && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {chain.name}
                      </span>
                    )}
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={handleDisconnect}
            >
              <LogOut className="h-4 w-4" />
              <span>{texts.disconnect}</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Solana connected state
  if (solanaConnected && publicKey && walletMode === 'solana') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="font-mono text-sm">
              {truncateAddress(publicKey.toBase58())}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
          <div className="bg-purple-500/5 p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-lg">
                ◎
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">
                    {truncateAddress(publicKey.toBase58())}
                  </span>
                  <button
                    onClick={async () => {
                      await copyToClipboard(publicKey.toBase58());
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1 hover:bg-purple-500/10 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-500 mt-1 inline-block">
                  Solana
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-2">
            <DropdownMenuItem 
              className="gap-2 cursor-pointer"
              onClick={() => window.open(`https://solscan.io/account/${publicKey.toBase58()}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              <span>View on Solscan</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={handleDisconnect}
            >
              <LogOut className="h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Not connected state - show connect options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">{texts.connectWallet}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 p-4 border-b border-border">
          <h3 className="font-semibold text-sm">{texts.connectWallet}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {texts.connectAndSignIn}
          </p>
        </div>
        
        {/* Network tabs */}
        <div className="p-3 border-b border-border">
          <div className="flex gap-2">
            <Button
              variant={walletMode === 'evm' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => setWalletMode('evm')}
            >
              <span className="text-base">⛓</span>
              EVM Chains
            </Button>
            <Button
              variant={walletMode === 'solana' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => setWalletMode('solana')}
            >
              <span className="text-base">◎</span>
              Solana
            </Button>
          </div>
        </div>
        
        {/* Wallet options */}
        <div className="p-3">
          {walletMode === 'evm' ? (
            <div className="space-y-3">
              <ConnectButton.Custom>
                {({ openConnectModal, connectModalOpen }) => (
                  <Button
                    onClick={openConnectModal}
                    className="w-full gap-2"
                    variant="outline"
                    disabled={connectModalOpen}
                  >
                    <Wallet className="h-4 w-4" />
                    {texts.selectEvmWallet}
                  </Button>
                )}
              </ConnectButton.Custom>
              <p className="text-xs text-muted-foreground text-center">
                {texts.supportsWallets}
              </p>
              <p className="text-xs text-center text-primary/80">
                {texts.signToLogin}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center">
                <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-md !h-9 !text-sm" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {texts.supportsSolana}
              </p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
