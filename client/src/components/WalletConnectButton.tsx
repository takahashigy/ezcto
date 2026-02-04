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
        toast.info('Please sign the message in your wallet to complete login', {
          duration: 5000,
        });
        
        try {
          const success = await signInWithWallet();
          if (success) {
            await refreshAuth();
            toast.success('Wallet connected and logged in successfully!');
          } else {
            toast.error('Failed to sign in. You can try again by reconnecting your wallet.');
          }
        } catch (error) {
          console.error('[WalletConnectButton] Auto sign-in error:', error);
          toast.error('Sign-in failed. Please try reconnecting your wallet.');
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
    toast.success('Wallet disconnected');
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
                <span className="text-sm">Signing in...</span>
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
                      Logged in
                    </span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-600">
                      Not logged in
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
                    toast.info('Please sign the message in your wallet');
                    try {
                      const success = await signInWithWallet();
                      if (success) {
                        await refreshAuth();
                        toast.success('Logged in successfully!');
                      } else {
                        toast.error('Sign-in failed. Please try again.');
                      }
                    } catch (error) {
                      toast.error('Sign-in failed. Please try again.');
                    } finally {
                      setIsAutoSigningIn(false);
                    }
                  }}
                >
                  <Wallet className="h-4 w-4" />
                  <span>Sign in with Wallet</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuItem 
              className="gap-2 cursor-pointer"
              onClick={() => window.open(`https://bscscan.com/address/${address}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              <span>View on Explorer</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Switch Network - using RainbowKit's built-in */}
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Switch Network
            </DropdownMenuLabel>
            <div className="px-2 pb-2">
              <ConnectButton.Custom>
                {({ chain, openChainModal }) => (
                  <button
                    onClick={openChainModal}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Change Network</span>
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
              <span>Disconnect</span>
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
          <span className="hidden sm:inline">Connect Wallet</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Connect Wallet</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Connect and sign in with your wallet
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
                    Select EVM Wallet
                  </Button>
                )}
              </ConnectButton.Custom>
              <p className="text-xs text-muted-foreground text-center">
                Supports Binance, OKX, Trust, TokenPocket, MetaMask
              </p>
              <p className="text-xs text-center text-primary/80">
                You'll be asked to sign a message to complete login
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center">
                <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-md !h-9 !text-sm" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Supports Phantom, Solflare
              </p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
