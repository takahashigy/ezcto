/**
 * Web3 Configuration for Crypto Payments
 */

export const WEB3_CONFIG = {
  // BSC Network Configuration
  BSC: {
    chainId: '0x38', // 56 in hex
    chainIdDecimal: 56,
    chainName: 'BNB Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-dataseed1.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
  },
  // Payment Configuration
  PAYMENT: {
    receiverAddress: '0x5ea1a353C4dB9E77E4A5035Eb89BA4F8F1d99e7D',
    priceInBNB: '0.55',
    priceInUSD: 479,
    requiredConfirmations: 3, // Number of block confirmations required
    expirationMinutes: 30, // Payment expires after 30 minutes
  },
  // Future Meme Token Support (placeholder)
  MEME_TOKEN: {
    enabled: false,
    tokenAddress: '', // To be filled when meme token is added
    tokenSymbol: '',
    tokenDecimals: 18,
    priceInToken: '',
  },
} as const;

export type SupportedChain = 'BSC';
export type PaymentToken = 'BNB' | 'MEME';
