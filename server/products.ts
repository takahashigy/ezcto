/**
 * EZCTO产品和价格定义
 * 集中管理所有Stripe产品和价格ID
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  currency: string;
  type: "one_time" | "subscription";
  interval?: "month" | "year";
}

/**
 * Launch自动化引擎产品
 */
export const LAUNCH_STANDARD: Product = {
  id: "launch_standard",
  name: "Launch Standard",
  description: "10分钟生成完整启动资产包：Logo、Banner、PFP、海报、文案、网站",
  priceId: process.env.STRIPE_PRICE_LAUNCH_STANDARD || "price_launch_standard",
  price: 99,
  currency: "USD",
  type: "one_time",
};

export const LAUNCH_PRO: Product = {
  id: "launch_pro",
  name: "Launch Pro",
  description: "Standard + 社交分发网络 + 数据分析 + 优先支持",
  priceId: process.env.STRIPE_PRICE_LAUNCH_PRO || "price_launch_pro",
  price: 299,
  currency: "USD",
  type: "one_time",
};

/**
 * 周边设计服务
 */
export const MERCH_DESIGN: Product = {
  id: "merch_design",
  name: "Merch Design Service",
  description: "AI效果图生成 + 专业设计师优化",
  priceId: process.env.STRIPE_PRICE_MERCH_DESIGN || "price_merch_design",
  price: 49,
  currency: "USD",
  type: "one_time",
};

/**
 * 部署服务
 */
export const DEPLOYMENT: Product = {
  id: "deployment",
  name: "Website Deployment",
  description: "一键部署到生产环境 + 下载所有资产 + 终身访问",
  priceId: process.env.STRIPE_PRICE_DEPLOYMENT || "price_deployment",
  price: 299,
  currency: "USD",
  type: "one_time",
};

/**
 * 订阅计划
 */
export const SUBSCRIPTION_STANDARD: Product = {
  id: "subscription_standard",
  name: "Standard Subscription",
  description: "每月3个Launch项目 + 基础周边设计",
  priceId: process.env.STRIPE_PRICE_SUBSCRIPTION_STANDARD || "price_subscription_standard",
  price: 199,
  currency: "USD",
  type: "subscription",
  interval: "month",
};

export const SUBSCRIPTION_PRO: Product = {
  id: "subscription_pro",
  name: "Pro Subscription",
  description: "无限Launch项目 + 社交分发网络 + 优先周边生产",
  priceId: process.env.STRIPE_PRICE_SUBSCRIPTION_PRO || "price_subscription_pro",
  price: 499,
  currency: "USD",
  type: "subscription",
  interval: "month",
};

/**
 * 获取所有产品
 */
export const ALL_PRODUCTS: Product[] = [
  LAUNCH_STANDARD,
  LAUNCH_PRO,
  MERCH_DESIGN,
  DEPLOYMENT,
  SUBSCRIPTION_STANDARD,
  SUBSCRIPTION_PRO,
];

/**
 * 根据ID获取产品
 */
export function getProductById(id: string): Product | undefined {
  return ALL_PRODUCTS.find(p => p.id === id);
}

/**
 * 根据Price ID获取产品
 */
export function getProductByPriceId(priceId: string): Product | undefined {
  return ALL_PRODUCTS.find(p => p.priceId === priceId);
}
