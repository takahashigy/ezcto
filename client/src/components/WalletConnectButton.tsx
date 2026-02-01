import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from './ui/button';
import { Wallet, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useState } from 'react';

type WalletMode = 'evm' | 'solana';

export function WalletConnectButton() {
  const [walletMode, setWalletMode] = useState<WalletMode>('evm');
  const { connected: solanaConnected, publicKey } = useWallet();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={walletMode === 'evm' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setWalletMode('evm')}
            >
              EVM Chains
            </Button>
            <Button
              variant={walletMode === 'solana' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setWalletMode('solana')}
            >
              Solana
            </Button>
          </div>
          
          {walletMode === 'evm' ? (
            <div className="flex justify-center">
              <ConnectButton 
                showBalance={false}
                chainStatus="icon"
                accountStatus="address"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            {walletMode === 'evm' 
              ? 'Supports ETH, BSC, Polygon' 
              : 'Supports Phantom, Solflare'}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
