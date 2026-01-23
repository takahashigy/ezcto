#!/usr/bin/env node
/**
 * 创建Stripe产品和价格
 * 运行: node scripts/create-stripe-products.mjs
 */

import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const products = [
  {
    name: 'Website Deployment',
    description: '一键部署到生产环境 + 下载所有资产 + 终身访问',
    price: 29900, // $299.00 in cents
    currency: 'usd',
    priceKey: 'STRIPE_PRICE_DEPLOYMENT',
  },
  {
    name: 'Launch Standard',
    description: '10分钟生成完整启动资产包：Logo、Banner、PFP、海报、文案、网站',
    price: 9900, // $99.00 in cents
    currency: 'usd',
    priceKey: 'STRIPE_PRICE_LAUNCH_STANDARD',
  },
  {
    name: 'Launch Pro',
    description: 'Standard + 社交分发网络 + 数据分析 + 优先支持',
    price: 29900, // $299.00 in cents
    currency: 'usd',
    priceKey: 'STRIPE_PRICE_LAUNCH_PRO',
  },
  {
    name: 'Merch Design Service',
    description: 'AI效果图生成 + 专业设计师优化',
    price: 4900, // $49.00 in cents
    currency: 'usd',
    priceKey: 'STRIPE_PRICE_MERCH_DESIGN',
  },
];

async function createProducts() {
  console.log('🚀 Creating Stripe products and prices...\n');

  for (const productData of products) {
    try {
      // 创建产品
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
      });

      console.log(`✅ Created product: ${product.name} (${product.id})`);

      // 创建价格
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.price,
        currency: productData.currency,
      });

      console.log(`   💰 Created price: ${price.id} ($${productData.price / 100})`);
      console.log(`   📝 Add to .env: ${productData.priceKey}=${price.id}\n`);
    } catch (error) {
      console.error(`❌ Error creating ${productData.name}:`, error.message);
    }
  }

  console.log('\n✨ Done! Copy the price IDs above to your .env file or set them as environment variables.');
}

createProducts().catch(console.error);
