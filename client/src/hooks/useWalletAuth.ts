import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { trpc } from '@/lib/trpc';

export function useWalletAuth() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const utils = trpc.useUtils();
  const getNonceMutation = trpc.wallet.getNonce.useMutation();
  const verifyMutation = trpc.wallet.verify.useMutation();

  /**
   * Sign in with wallet using SIWE (Sign-In with Ethereum)
   * @returns true if sign in was successful, false otherwise
   */
  const signInWithWallet = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return false;
    }

    setIsSigningIn(true);
    setError(null);

    try {
      // Get nonce from server
      const { nonce } = await getNonceMutation.mutateAsync({ address });

      // Create SIWE message manually (to avoid siwe dependency on client)
      const domain = window.location.host;
      const uri = window.location.origin;
      const issuedAt = new Date().toISOString();
      
      const message = `${domain} wants you to sign in with your Ethereum account:
${address}

Sign in to EZCTO with your wallet

URI: ${uri}
Version: 1
Chain ID: 56
Nonce: ${nonce}
Issued At: ${issuedAt}`;

      // Request signature from wallet using wagmi
      const signature = await signMessageAsync({ message });

      // Verify signature on server and create session
      const result = await verifyMutation.mutateAsync({
        message,
        signature,
      });

      if (result.success) {
        // Refresh auth state
        await utils.auth.me.invalidate();
        setIsSigningIn(false);
        return true;
      }

      throw new Error('Verification failed');
    } catch (err: unknown) {
      console.error('[WalletAuth] Sign in failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with wallet';
      setError(errorMessage);
      setIsSigningIn(false);
      return false;
    }
  }, [address, isConnected, getNonceMutation, verifyMutation, signMessageAsync, utils]);

  return {
    signInWithWallet,
    isSigningIn,
    error,
    isConnected,
    address,
  };
}
