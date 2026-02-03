import { describe, it, expect } from 'vitest';
import { TOKENS, PAYMENT_CONFIG } from '../shared/web3Config';

describe('EZCTO Token Payment Configuration', () => {
  it('should have EZCTO token configured on BSC', () => {
    expect(TOKENS.BSC.EZCTO).toBeDefined();
    expect(TOKENS.BSC.EZCTO.address).toBe('0xf036693f699d36e7fb3df3822918b325e1db7777');
    expect(TOKENS.BSC.EZCTO.symbol).toBe('EZCTO');
    expect(TOKENS.BSC.EZCTO.decimals).toBe(18);
  });

  it('should have special EZCTO payment price of $99', () => {
    expect(PAYMENT_CONFIG.ezctoPaymentUSD).toBe(99);
  });

  it('should have standard price of $199 for other tokens', () => {
    expect(PAYMENT_CONFIG.priceUSD).toBe(199);
  });

  it('should offer $100 discount (50% off) for EZCTO payment', () => {
    const discount = PAYMENT_CONFIG.priceUSD - PAYMENT_CONFIG.ezctoPaymentUSD;
    expect(discount).toBe(100);
  });

  it('should have EZCTO in BSC token list', () => {
    const bscTokens = Object.keys(TOKENS.BSC);
    expect(bscTokens).toContain('EZCTO');
  });
});

describe('EZCTO Price Calculation', () => {
  it('should calculate correct EZCTO amount for $99 payment', () => {
    // Example: if EZCTO price is $0.001, need 99000 EZCTO
    const mockPriceUsd = 0.001;
    const ezctoNeeded = PAYMENT_CONFIG.ezctoPaymentUSD / mockPriceUsd;
    expect(ezctoNeeded).toBe(99000);
  });

  it('should round up EZCTO amount to 2 decimals', () => {
    const mockPriceUsd = 0.00123;
    const ezctoNeeded = PAYMENT_CONFIG.ezctoPaymentUSD / mockPriceUsd;
    const rounded = Math.ceil(ezctoNeeded * 100) / 100;
    expect(rounded).toBeGreaterThanOrEqual(ezctoNeeded);
    // Check it's rounded to 2 decimals
    const decimalPlaces = (rounded.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });
});
