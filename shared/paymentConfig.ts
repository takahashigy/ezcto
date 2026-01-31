/**
 * Payment configuration for EZCTO Launch V2
 * Supports BSC (USDT) and Solana (USDC) payments
 */

export const PAYMENT_CONFIG = {
  // Base price in USD
  basePrice: 299,
  
  // Discount configuration
  discount: {
    // Token address for discount eligibility (BSC)
    tokenAddress: '0xf036693f699d36e7fb3df3822918b325e1db7777',
    // Minimum token balance required (in USD value)
    minBalanceUSD: 100,
    // Discount percentage (0.7 = 30% off)
    discountRate: 0.7,
  },
  
  // BSC (BNB Smart Chain) payment
  bsc: {
    chainId: 56, // BSC Mainnet
    chainName: 'BNB Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com'],
    
    // USDT contract on BSC
    usdt: {
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      decimals: 18,
      abi: [
        // ERC20 standard functions
        'function balanceOf(address owner) view returns (uint256)',
        'function transfer(address to, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
      ],
    },
    
    // Receiver address
    receiverAddress: '0x5ea1a353C4dB9E77E4A5035Eb89BA4F8F1d99e7D',
  },
  
  // Solana payment
  solana: {
    network: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    
    // USDC contract on Solana
    usdc: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      decimals: 6,
    },
    
    // Receiver address
    receiverAddress: '3JJBPL8Xjg5qgeMsJZDp8wZKLvqXrtQYkB1oRFJhZjrd',
  },
} as const;

/**
 * Calculate final price based on discount eligibility
 */
export function calculatePrice(hasDiscount: boolean): number {
  if (hasDiscount) {
    return PAYMENT_CONFIG.basePrice * PAYMENT_CONFIG.discount.discountRate;
  }
  return PAYMENT_CONFIG.basePrice;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)} USD`;
}
