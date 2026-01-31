import { useState } from 'react';
import { useWeb3, type WalletType } from '../hooks/useWeb3';
import { Button } from './ui/button';
import { Wallet, Loader2, ChevronDown, LogOut, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export function WalletConnectButton() {
  const {
    account,
    balance,
    isConnected,
    isCorrectChain,
    isConnecting,
    selectedWallet,
    availableWallets,
    connectWallet,
    switchToBSC,
  } = useWeb3();

  const [showWalletSelect, setShowWalletSelect] = useState(false);

  const handleWalletSelect = async (walletType: WalletType) => {
    const success = await connectWallet(walletType);
    if (success) {
      setShowWalletSelect(false);
      if (!isCorrectChain) {
        await switchToBSC();
      }
    }
  };

  const handleDisconnect = () => {
    window.location.reload();
  };

  const selectedWalletInfo = availableWallets.find(w => w.type === selectedWallet);

  if (!isConnected) {
    return (
      <>
        <Button
          onClick={() => setShowWalletSelect(true)}
          disabled={isConnecting || availableWallets.length === 0}
          variant="outline"
          size="sm"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </>
          )}
        </Button>

        <Dialog open={showWalletSelect} onOpenChange={setShowWalletSelect}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>
                Choose a wallet to connect to EZCTO platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {availableWallets.length > 0 ? (
                availableWallets.map((wallet) => (
                  <Button
                    key={wallet.type}
                    onClick={() => handleWalletSelect(wallet.type)}
                    disabled={isConnecting}
                    variant="outline"
                    className="w-full justify-start h-14"
                  >
                    {isConnecting ? (
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    ) : (
                      <span className="mr-3 text-2xl">{wallet.icon}</span>
                    )}
                    <span className="text-base">{wallet.name}</span>
                  </Button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No wallet detected</p>
                  <Button asChild variant="outline">
                    <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                      Install MetaMask
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {selectedWalletInfo && (
            <span className="text-lg">{selectedWalletInfo.icon}</span>
          )}
          <span className="hidden sm:inline font-mono text-xs">
            {account?.slice(0, 6)}...{account?.slice(-4)}
          </span>
          {!isCorrectChain && (
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-2">
          <div className="flex items-center gap-2 mb-2">
            {selectedWalletInfo && (
              <span className="text-xl">{selectedWalletInfo.icon}</span>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {selectedWalletInfo?.name || 'Connected'}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {account?.slice(0, 10)}...{account?.slice(-8)}
              </p>
            </div>
          </div>
          {balance && isCorrectChain && (
            <div className="bg-muted/50 rounded px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">Balance: </span>
              <span className="font-mono font-medium">
                {parseFloat(balance).toFixed(4)} BNB
              </span>
            </div>
          )}
          {!isCorrectChain && (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1.5 text-xs text-amber-600">
              Wrong network - Please switch to BSC
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        {!isCorrectChain && (
          <>
            <DropdownMenuItem onClick={switchToBSC}>
              <Wallet className="mr-2 h-4 w-4" />
              Switch to BSC Network
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => window.open(`https://bscscan.com/address/${account}`, '_blank')}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View on BSCScan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
