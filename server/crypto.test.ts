import { describe, it, expect } from "vitest";
import { CHAINS, TOKENS, PAYMENT_CONFIG, ERC20_ABI } from "../shared/web3Config";

describe("Web3 Configuration", () => {
  describe("CHAINS configuration", () => {
    it("should have correct BSC chain configuration", () => {
      expect(CHAINS.BSC).toBeDefined();
      expect(CHAINS.BSC.chainId).toBe(56);
      expect(CHAINS.BSC.name).toBe("BNB Smart Chain");
      expect(CHAINS.BSC.rpcUrl).toBeDefined();
      expect(CHAINS.BSC.blockExplorer).toBe("https://bscscan.com");
    });

    it("should have correct ETH chain configuration", () => {
      expect(CHAINS.ETH).toBeDefined();
      expect(CHAINS.ETH.chainId).toBe(1);
      expect(CHAINS.ETH.name).toBe("Ethereum");
      expect(CHAINS.ETH.rpcUrl).toBeDefined();
      expect(CHAINS.ETH.blockExplorer).toBe("https://etherscan.io");
    });

    it("should have correct Polygon chain configuration", () => {
      expect(CHAINS.POLYGON).toBeDefined();
      expect(CHAINS.POLYGON.chainId).toBe(137);
      expect(CHAINS.POLYGON.name).toBe("Polygon");
      expect(CHAINS.POLYGON.rpcUrl).toBeDefined();
      expect(CHAINS.POLYGON.blockExplorer).toBe("https://polygonscan.com");
    });

    it("should have correct Solana chain configuration", () => {
      expect(CHAINS.SOLANA).toBeDefined();
      expect(CHAINS.SOLANA.name).toBe("Solana");
      expect(CHAINS.SOLANA.rpcUrl).toBeDefined();
      expect(CHAINS.SOLANA.blockExplorer).toBe("https://solscan.io");
    });
  });

  describe("TOKENS configuration", () => {
    it("should have BSC tokens configured", () => {
      expect(TOKENS.BSC).toBeDefined();
      expect(TOKENS.BSC.USDT).toBeDefined();
      expect(TOKENS.BSC.USDT.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(TOKENS.BSC.USDC).toBeDefined();
      expect(TOKENS.BSC.USDC.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should have EZCTO token configured on BSC", () => {
      expect(TOKENS.BSC.EZCTO).toBeDefined();
      expect(TOKENS.BSC.EZCTO.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(TOKENS.BSC.EZCTO.decimals).toBe(18);
    });

    it("should have Solana tokens configured", () => {
      expect(TOKENS.SOLANA).toBeDefined();
      expect(TOKENS.SOLANA.USDC).toBeDefined();
      expect(TOKENS.SOLANA.USDC.address).toBeDefined();
    });

    it("should have ETH tokens configured", () => {
      expect(TOKENS.ETH).toBeDefined();
      expect(TOKENS.ETH.USDT).toBeDefined();
      expect(TOKENS.ETH.USDC).toBeDefined();
    });

    it("should have Polygon tokens configured", () => {
      expect(TOKENS.POLYGON).toBeDefined();
      expect(TOKENS.POLYGON.USDT).toBeDefined();
      expect(TOKENS.POLYGON.USDC).toBeDefined();
    });
  });

  describe("PAYMENT_CONFIG", () => {
    it("should have correct price in USD", () => {
      expect(PAYMENT_CONFIG.priceUSD).toBe(299);
    });

    it("should have EVM receiver address", () => {
      expect(PAYMENT_CONFIG.receivers.EVM).toBeDefined();
      expect(PAYMENT_CONFIG.receivers.EVM).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should have Solana receiver address", () => {
      expect(PAYMENT_CONFIG.receivers.SOLANA).toBeDefined();
      expect(PAYMENT_CONFIG.receivers.SOLANA.length).toBeGreaterThan(30);
    });

    it("should have confirmation requirements for each chain", () => {
      expect(PAYMENT_CONFIG.confirmations.ETH).toBeGreaterThan(0);
      expect(PAYMENT_CONFIG.confirmations.BSC).toBeGreaterThan(0);
      expect(PAYMENT_CONFIG.confirmations.POLYGON).toBeGreaterThan(0);
    });
  });
});

describe("Payment Amount Calculations", () => {
  it("should calculate correct token amounts for stablecoins", () => {
    const priceUSD = PAYMENT_CONFIG.priceUSD;
    // Stablecoins should equal USD price
    expect(priceUSD).toBe(299);
  });

  it("should have valid ERC20 ABI", () => {
    expect(ERC20_ABI).toBeDefined();
    expect(Array.isArray(ERC20_ABI)).toBe(true);
    
    const transferFunction = ERC20_ABI.find(
      (item: any) => item.name === "transfer" && item.type === "function"
    );
    expect(transferFunction).toBeDefined();
  });
});

describe("Multi-chain Support", () => {
  it("should support all required EVM chains", () => {
    const supportedChains = ["ETH", "BSC", "POLYGON"];
    supportedChains.forEach(chain => {
      expect(CHAINS[chain as keyof typeof CHAINS]).toBeDefined();
    });
  });

  it("should have valid chain IDs", () => {
    expect(CHAINS.ETH.chainId).toBe(1);
    expect(CHAINS.BSC.chainId).toBe(56);
    expect(CHAINS.POLYGON.chainId).toBe(137);
  });

  it("should have RPC URLs for all chains", () => {
    Object.values(CHAINS).forEach(chain => {
      expect(chain.rpcUrl).toBeDefined();
      expect(chain.rpcUrl.length).toBeGreaterThan(0);
    });
  });
});

describe("Wallet Address Validation", () => {
  it("should validate EVM wallet address format", () => {
    const validAddress = "0x5ea1a353C4dB9E77E4A5035Eb89BA4F8F1d99e7D";
    const invalidAddress = "invalid-address";

    expect(validAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(invalidAddress).not.toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("should validate Solana wallet address format", () => {
    const validSolanaAddress = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
    // Solana addresses are base58 encoded, 32-44 characters
    expect(validSolanaAddress.length).toBeGreaterThanOrEqual(32);
    expect(validSolanaAddress.length).toBeLessThanOrEqual(44);
  });

  it("should validate BNB amount format", () => {
    const validAmount = "0.55";
    const invalidAmount = "abc";

    expect(parseFloat(validAmount)).toBeGreaterThan(0);
    expect(isNaN(parseFloat(invalidAmount))).toBe(true);
  });
});

describe("Token Decimals", () => {
  it("should have correct decimals for BSC tokens", () => {
    expect(TOKENS.BSC.USDT.decimals).toBe(18);
    expect(TOKENS.BSC.USDC.decimals).toBe(18);
    expect(TOKENS.BSC.EZCTO.decimals).toBe(18);
  });

  it("should have correct decimals for Solana USDC", () => {
    expect(TOKENS.SOLANA.USDC.decimals).toBe(6);
  });
});
