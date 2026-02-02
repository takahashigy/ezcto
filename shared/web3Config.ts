/**
 * Web3 Configuration for Multi-Chain Crypto Payments
 * Supports EVM chains (ETH, BSC, Polygon) and Solana
 */

// Chain configurations
export const CHAINS = {
  ETH: {
    id: 1,
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  BSC: {
    id: 56,
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
  POLYGON: {
    id: 137,
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  SOLANA: {
    id: 'solana',
    chainId: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    blockExplorer: 'https://solscan.io',
    nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
  },
} as const;

// Token configurations per chain
export const TOKENS = {
  // Ethereum tokens
  ETH: {
    ETH: { address: 'native', symbol: 'ETH', decimals: 18, name: 'Ether' },
    USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6, name: 'Tether USD' },
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
  },
  // BSC tokens
  BSC: {
    BNB: { address: 'native', symbol: 'BNB', decimals: 18, name: 'BNB' },
    USDT: { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18, name: 'Tether USD' },
    USDC: { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 18, name: 'USD Coin' },
    // Custom EZCTO token on BSC
    EZCTO: { address: '0xf036693f699d36e7fb3df3822918b325e1db7777', symbol: 'EZCTO', decimals: 18, name: 'EZCTO Token' },
  },
  // Polygon tokens
  POLYGON: {
    MATIC: { address: 'native', symbol: 'MATIC', decimals: 18, name: 'MATIC' },
    USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', decimals: 6, name: 'Tether USD' },
    USDC: { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
  },
  // Solana tokens
  SOLANA: {
    SOL: { address: 'native', symbol: 'SOL', decimals: 9, name: 'Solana' },
    USDC: { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
  },
} as const;

// Payment configuration
export const PAYMENT_CONFIG = {
  // Price in USD for standard payment
  priceUSD: 299,
  
  // Special price for EZCTO token payment (in USD equivalent)
  ezctoPaymentUSD: 200,
  
  // Receiver addresses
  receivers: {
    EVM: '0x5ea1a353C4dB9E77E4A5035Eb89BA4F8F1d99e7D',
    SOLANA: '3JJBPL8Xjg5qgeMsJZDp8wZKLvqXrtQYkB1oRFJhZjrd',
  },
  
  // WalletConnect Project ID
  walletConnectProjectId: 'aef4a058a492c4c93b5529da6e22e09f',
  
  // Payment expiration (in minutes)
  expirationMinutes: 30,
  
  // Required confirmations per chain
  confirmations: {
    ETH: 3,
    BSC: 15,
    POLYGON: 30,
    SOLANA: 1,
  },
} as const;

// Supported payment methods
export const PAYMENT_METHODS = [
  { chain: 'ETH', token: 'ETH', label: 'ETH on Ethereum' },
  { chain: 'ETH', token: 'USDT', label: 'USDT on Ethereum' },
  { chain: 'ETH', token: 'USDC', label: 'USDC on Ethereum' },
  { chain: 'BSC', token: 'BNB', label: 'BNB on BSC' },
  { chain: 'BSC', token: 'USDT', label: 'USDT on BSC' },
  { chain: 'BSC', token: 'USDC', label: 'USDC on BSC' },
  { chain: 'BSC', token: 'EZCTO', label: 'EZCTO Token (BSC)' },
  { chain: 'POLYGON', token: 'MATIC', label: 'MATIC on Polygon' },
  { chain: 'POLYGON', token: 'USDT', label: 'USDT on Polygon' },
  { chain: 'POLYGON', token: 'USDC', label: 'USDC on Polygon' },
  { chain: 'SOLANA', token: 'SOL', label: 'SOL on Solana' },
  { chain: 'SOLANA', token: 'USDC', label: 'USDC on Solana' },
] as const;

// ERC20 ABI for token transfers
export const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view'
  },
  {
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

// Type exports
export type ChainKey = keyof typeof CHAINS;
export type EVMChainKey = 'ETH' | 'BSC' | 'POLYGON';
export type TokenKey<C extends ChainKey> = keyof typeof TOKENS[C];
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// Legacy export for backward compatibility
export const WEB3_CONFIG = {
  BSC: {
    chainId: '0x38',
    chainIdDecimal: 56,
    chainName: 'BNB Smart Chain',
    nativeCurrency: CHAINS.BSC.nativeCurrency,
    rpcUrls: [CHAINS.BSC.rpcUrl],
    blockExplorerUrls: [CHAINS.BSC.blockExplorer],
  },
  PAYMENT: {
    receiverAddress: PAYMENT_CONFIG.receivers.EVM,
    priceInBNB: '0.55',
    priceInUSD: PAYMENT_CONFIG.priceUSD,
    requiredConfirmations: PAYMENT_CONFIG.confirmations.BSC,
    expirationMinutes: PAYMENT_CONFIG.expirationMinutes,
  },
  MEME_TOKEN: {
    enabled: true,
    tokenAddress: TOKENS.BSC.EZCTO.address,
    tokenSymbol: TOKENS.BSC.EZCTO.symbol,
    tokenDecimals: TOKENS.BSC.EZCTO.decimals,
    priceInToken: '',
  },
} as const;

export type SupportedChain = 'BSC';
export type PaymentToken = 'BNB' | 'MEME';
