import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, formatEther, parseEther } from 'ethers';
import { WEB3_CONFIG } from '../../../shared/web3Config';

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

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

  // Initialize provider
  useEffect(() => {
    if (isMetaMaskInstalled && window.ethereum) {
      const browserProvider = new BrowserProvider(window.ethereum as never);
      setProvider(browserProvider);
    }
  }, [isMetaMaskInstalled]);

  // Update account info
  const updateAccountInfo = useCallback(async (accounts: string[]) => {
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
    if (!window.ethereum) return;
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' }) as string;
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

  // Listen to account and chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled || !window.ethereum) return;

    const ethereum = window.ethereum;

    const handleAccountsChanged = (accounts: unknown) => {
      updateAccountInfo(accounts as string[]);
    };

    const handleChainChanged = () => {
      window.location.reload(); // Recommended by MetaMask
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    // Check if already connected
    ethereum.request({ method: 'eth_accounts' })
      .then((accounts) => handleAccountsChanged(accounts))
      .catch(console.error);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isMetaMaskInstalled, updateAccountInfo]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled || !window.ethereum) {
      setError('Please install MetaMask to continue');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];
      await updateAccountInfo(accounts);
      setIsConnecting(false);
      return true;
    } catch (err: unknown) {
      console.error('Failed to connect wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      setIsConnecting(false);
      return false;
    }
  }, [isMetaMaskInstalled, updateAccountInfo]);

  // Switch to BSC network
  const switchToBSC = useCallback(async () => {
    if (!isMetaMaskInstalled || !window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: WEB3_CONFIG.BSC.chainId }],
      });
      return true;
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask
      if ((switchError as { code?: number }).code === 4902) {
        try {
          await window.ethereum.request({
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
  }, [isMetaMaskInstalled]);

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
    isMetaMaskInstalled,
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
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
