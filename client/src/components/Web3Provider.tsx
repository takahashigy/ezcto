import { ReactNode, useMemo } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, bsc, polygon } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  RainbowKitProvider, 
  connectorsForWallets,
  darkTheme 
} from '@rainbow-me/rainbowkit';
import {
  binanceWallet,
  okxWallet,
  trustWallet,
  tokenPocketWallet,
  metaMaskWallet,
  walletConnectWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { PAYMENT_CONFIG, CHAINS } from '@shared/web3Config';

import '@rainbow-me/rainbowkit/styles.css';
import '@solana/wallet-adapter-react-ui/styles.css';

// Configure wallet connectors with specific wallets
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        binanceWallet,
        okxWallet,
        trustWallet,
        tokenPocketWallet,
      ],
    },
    {
      groupName: 'Other',
      wallets: [
        metaMaskWallet,
        walletConnectWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'EZCTO',
    projectId: PAYMENT_CONFIG.walletConnectProjectId,
  }
);

// Create wagmi config with custom connectors
const config = createConfig({
  connectors,
  chains: [mainnet, bsc, polygon],
  transports: {
    [mainnet.id]: http(CHAINS.ETH.rpcUrl),
    [bsc.id]: http(CHAINS.BSC.rpcUrl),
    [polygon.id]: http(CHAINS.POLYGON.rpcUrl),
  },
});

// Create query client
const queryClient = new QueryClient();

// Solana wallet adapters
const solanaWallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  // Solana endpoint
  const solanaEndpoint = useMemo(() => CHAINS.SOLANA.rpcUrl, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#2d3e2d',
            accentColorForeground: 'white',
            borderRadius: 'small',
          })}
          locale="en-US"
        >
          <ConnectionProvider endpoint={solanaEndpoint}>
            <WalletProvider wallets={solanaWallets} autoConnect>
              <WalletModalProvider>
                {children}
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
