import { describe, it, expect } from 'vitest';
import { TOKENS, PAYMENT_CONFIG } from '../shared/web3Config';

describe('EZCTO Token Payment Configuration', () => {
  it('should have EZCTO token configured on BSC', () => {
    expect(TOKENS.BSC.EZCTO).toBeDefined();
    expect(TOKENS.BSC.EZCTO.address).toBe('0xf036693f699d36e7fb3df3822918b325e1db7777');
    expect(TOKENS.BSC.EZCTO.symbol).toBe('EZCTO');
    expect(TOKENS.BSC.EZCTO.decimals).toBe(18);
  });

  it('should have special EZCTO payment price of $200', () => {
    expect(PAYMENT_CONFIG.ezctoPaymentUSD).toBe(200);
  });

  it('should have standard price of $299 for other tokens', () => {
    expect(PAYMENT_CONFIG.priceUSD).toBe(299);
  });

  it('should offer $99 discount for EZCTO payment', () => {
    const discount = PAYMENT_CONFIG.priceUSD - PAYMENT_CONFIG.ezctoPaymentUSD;
    expect(discount).toBe(99);
  });

  it('should have EZCTO in BSC token list', () => {
    const bscTokens = Object.keys(TOKENS.BSC);
    expect(bscTokens).toContain('EZCTO');
  });
});

describe('EZCTO Price Calculation', () => {
  it('should calculate correct EZCTO amount for $200 payment', () => {
    // Example: if EZCTO price is $0.001, need 200000 EZCTO
    const mockPriceUsd = 0.001;
    const ezctoNeeded = PAYMENT_CONFIG.ezctoPaymentUSD / mockPriceUsd;
    expect(ezctoNeeded).toBe(200000);
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
