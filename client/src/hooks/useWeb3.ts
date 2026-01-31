import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, formatEther, parseEther } from 'ethers';
import { WEB3_CONFIG } from '../../../shared/web3Config';

export type WalletType = 'metamask' | 'binance' | 'okx' | 'tokenpocket' | 'trustwallet';

export interface WalletInfo {
  type: WalletType;
  name: string;
  icon: string;
  isInstalled: boolean;
  provider?: any;
}

export interface Web3State {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectChain: boolean;
  balance: string | null;
}

export function useWeb3() {
  const [state, setState] = useState<Web3State>({
    account: null,
    chainId: null,
    isConnected: false,
    isCorrectChain: false,
    balance: null,
  });
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);

  // Detect all available wallets
  const detectWallets = useCallback(() => {
    const wallets: WalletInfo[] = [];
    
    if (typeof window === 'undefined') return wallets;

    // MetaMask
    if (window.ethereum?.isMetaMask && !window.ethereum.isBinance && !window.ethereum.isOkxWallet) {
      wallets.push({
        type: 'metamask',
        name: 'MetaMask',
        icon: '🦊',
        isInstalled: true,
        provider: window.ethereum,
      });
    }

    // Binance Wallet
    if (window.BinanceChain || window.ethereum?.isBinance) {
      wallets.push({
        type: 'binance',
        name: 'Binance Wallet',
        icon: '🔶',
        isInstalled: true,
        provider: window.BinanceChain || window.ethereum,
      });
    }

    // OKX Wallet
    if (window.okxwallet || window.ethereum?.isOkxWallet) {
      wallets.push({
        type: 'okx',
        name: 'OKX Wallet',
        icon: '⭕',
        isInstalled: true,
        provider: window.okxwallet || window.ethereum,
      });
    }

    // TokenPocket
    if (window.tokenpocket || window.ethereum?.isTokenPocket) {
      wallets.push({
        type: 'tokenpocket',
        name: 'TokenPocket',
        icon: '🎫',
        isInstalled: true,
        provider: window.tokenpocket || window.ethereum,
      });
    }

    // Trust Wallet
    if (window.trustwallet || window.ethereum?.isTrust) {
      wallets.push({
        type: 'trustwallet',
        name: 'Trust Wallet',
        icon: '🛡️',
        isInstalled: true,
        provider: window.trustwallet || window.ethereum,
      });
    }

    // Fallback: Generic ethereum provider
    if (wallets.length === 0 && window.ethereum) {
      wallets.push({
        type: 'metamask',
        name: 'Web3 Wallet',
        icon: '💼',
        isInstalled: true,
        provider: window.ethereum,
      });
    }

    return wallets;
  }, []);

  useEffect(() => {
    const wallets = detectWallets();
    setAvailableWallets(wallets);
  }, [detectWallets]);

  const getWalletProvider = useCallback((walletType?: WalletType) => {
    const type = walletType || selectedWallet;
    if (!type) return null;

    const wallet = availableWallets.find(w => w.type === type);
    return wallet?.provider || null;
  }, [selectedWallet, availableWallets]);

  // Update account info
  const updateAccountInfo = useCallback(async (walletProvider: any, accounts: string[]) => {
    if (accounts.length === 0) {
      setState({
        account: null,
        chainId: null,
        isConnected: false,
        isCorrectChain: false,
        balance: null,
      });
      return;
    }

    const account = accounts[0];
    const chainIdHex = await walletProvider.request({ method: 'eth_chainId' }) as string;
    const chainId = parseInt(chainIdHex, 16);
    const isCorrectChain = chainId === WEB3_CONFIG.BSC.chainIdDecimal;

    // Get balance
    let balance = null;
    if (provider && isCorrectChain) {
      try {
        const balanceWei = await provider.getBalance(account);
        balance = formatEther(balanceWei);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    }

    setState({
      account,
      chainId,
      isConnected: true,
      isCorrectChain,
      balance,
    });
  }, [provider]);

  // Connect wallet
  const connectWallet = useCallback(async (walletType: WalletType) => {
    setIsConnecting(true);
    setError(null);

    try {
      const walletProvider = getWalletProvider(walletType);
      
      if (!walletProvider) {
        throw new Error(`${walletType} wallet is not installed`);
      }

      const accounts = await walletProvider.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      setSelectedWallet(walletType);
      const browserProvider = new BrowserProvider(walletProvider);
      setProvider(browserProvider);
      
      await updateAccountInfo(walletProvider, accounts);

      // Setup event listeners
      walletProvider.on('accountsChanged', (newAccounts: string[]) => {
        updateAccountInfo(walletProvider, newAccounts);
      });

      walletProvider.on('chainChanged', () => {
        window.location.reload();
      });

      setIsConnecting(false);
      return true;
    } catch (err: unknown) {
      console.error('Failed to connect wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      setIsConnecting(false);
      return false;
    }
  }, [getWalletProvider, updateAccountInfo]);

  // Switch to BSC network
  const switchToBSC = useCallback(async () => {
    const walletProvider = getWalletProvider();
    if (!walletProvider) return false;

    try {
      await walletProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: WEB3_CONFIG.BSC.chainId }],
      });
      return true;
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added
      if ((switchError as { code?: number }).code === 4902) {
        try {
          await walletProvider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: WEB3_CONFIG.BSC.chainId,
                chainName: WEB3_CONFIG.BSC.chainName,
                nativeCurrency: WEB3_CONFIG.BSC.nativeCurrency,
                rpcUrls: WEB3_CONFIG.BSC.rpcUrls,
                blockExplorerUrls: WEB3_CONFIG.BSC.blockExplorerUrls,
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add BSC network:', addError);
          setError('Failed to add BSC network');
          return false;
        }
      }
      console.error('Failed to switch to BSC:', switchError);
      setError('Failed to switch to BSC network');
      return false;
    }
  }, [getWalletProvider]);

  // Send payment
  const sendPayment = useCallback(async (amountInBNB: string) => {
    if (!provider || !state.account || !state.isCorrectChain) {
      setError('Please connect wallet and switch to BSC network');
      return null;
    }

    try {
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: WEB3_CONFIG.PAYMENT.receiverAddress,
        value: parseEther(amountInBNB),
      });

      return tx.hash;
    } catch (err: unknown) {
      console.error('Payment failed:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      return null;
    }
  }, [provider, state.account, state.isCorrectChain]);

  return {
    ...state,
    provider,
    isConnecting,
    error,
    selectedWallet,
    availableWallets,
    connectWallet,
    switchToBSC,
    sendPayment,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isBinance?: boolean;
      isOkxWallet?: boolean;
      isTokenPocket?: boolean;
      isTrust?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
    BinanceChain?: any;
    okxwallet?: any;
    tokenpocket?: any;
    trustwallet?: any;
  }
}
