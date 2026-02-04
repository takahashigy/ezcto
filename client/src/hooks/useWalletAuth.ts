import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';

export function useWalletAuth() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { language } = useLanguage();
  
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
      
      // Create bilingual SIWE message for better user understanding
      const statementEn = 'Sign in to EZCTO with your wallet';
      const statementZh = '使用钱包登录 EZCTO';
      const noteEn = 'This signature is only for identity verification and will NOT transfer any assets or authorize any transactions.';
      const noteZh = '此签名仅用于身份验证，不会转移任何资产或授权任何交易。';
      
      const message = `${domain} wants you to sign in with your Ethereum account:
${address}

${language === 'zh' ? statementZh : statementEn}
${language === 'zh' ? noteZh : noteEn}

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
