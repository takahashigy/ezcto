import { describe, it, expect } from "vitest";
import Stripe from "stripe";

/**
 * 测试Stripe价格ID配置是否正确
 */
describe("Stripe Price Configuration", () => {
  it("should have STRIPE_PRICE_DEPLOYMENT environment variable", () => {
    expect(process.env.STRIPE_PRICE_DEPLOYMENT).toBeDefined();
    expect(process.env.STRIPE_PRICE_DEPLOYMENT).toMatch(/^price_/);
  });

  it("should be able to retrieve deployment price from Stripe", async () => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-12-18.acacia",
    });

    const priceId = process.env.STRIPE_PRICE_DEPLOYMENT!;
    
    // 验证价格ID是否存在且可访问
    const price = await stripe.prices.retrieve(priceId);
    
    expect(price.id).toBe(priceId);
    expect(price.unit_amount).toBe(29900); // $299.00
    expect(price.currency).toBe("usd");
    expect(price.active).toBe(true);
  });

  it("should have valid Stripe secret key", () => {
    expect(process.env.STRIPE_SECRET_KEY).toBeDefined();
    expect(process.env.STRIPE_SECRET_KEY).toMatch(/^sk_test_/);
  });
});
