/**
 * Hook to check if user is eligible for discount based on token holdings
 */
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { PAYMENT_CONFIG } from '../../../shared/paymentConfig';

export function useDiscountCheck(walletAddress: string | null, chainId: number | null) {
  const [isEligible, setIsEligible] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<string>('0');

  useEffect(() => {
    if (!walletAddress || chainId !== PAYMENT_CONFIG.bsc.chainId) {
      setIsEligible(false);
      setTokenBalance('0');
      return;
    }

    checkDiscountEligibility();
  }, [walletAddress, chainId]);

  async function checkDiscountEligibility() {
    if (!walletAddress) return;

    setIsChecking(true);
    try {
      // Connect to BSC
      const provider = new ethers.JsonRpcProvider(PAYMENT_CONFIG.bsc.rpcUrls[0]);
      
      // Create contract instance
      const tokenContract = new ethers.Contract(
        PAYMENT_CONFIG.discount.tokenAddress,
        [
          'function balanceOf(address owner) view returns (uint256)',
          'function decimals() view returns (uint8)',
        ],
        provider
      );

      // Get token balance
      const balance = await tokenContract.balanceOf(walletAddress);
      const decimals = await tokenContract.decimals();
      
      // Convert to human-readable format
      const balanceFormatted = ethers.formatUnits(balance, decimals);
      setTokenBalance(balanceFormatted);

      // For simplicity, assume 1 token = 1 USD
      // In production, you should fetch real-time price from an oracle
      const balanceUSD = parseFloat(balanceFormatted);
      
      // Check if eligible for discount
      const eligible = balanceUSD >= PAYMENT_CONFIG.discount.minBalanceUSD;
      setIsEligible(eligible);

      console.log(`[Discount Check] Balance: ${balanceFormatted}, USD Value: ${balanceUSD}, Eligible: ${eligible}`);
    } catch (error) {
      console.error('[Discount Check] Error:', error);
      setIsEligible(false);
      setTokenBalance('0');
    } finally {
      setIsChecking(false);
    }
  }

  return {
    isEligible,
    isChecking,
    tokenBalance,
    refresh: checkDiscountEligibility,
  };
}
