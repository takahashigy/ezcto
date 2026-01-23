import Stripe from "stripe";
import * as db from "./db";
import { getProductByPriceId } from "./products";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
});

/**
 * 创建Checkout Session（一次性支付）
 */
export async function createCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName?: string;
  priceId: string;
  projectId?: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    customer_email: params.userEmail,
    client_reference_id: params.userId.toString(),
    metadata: {
      user_id: params.userId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName || "",
      project_id: params.projectId?.toString() || "",
      ...params.metadata,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
  });

  return session;
}

/**
 * 创建订阅Checkout Session
 */
export async function createSubscriptionCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    customer_email: params.userEmail,
    client_reference_id: params.userId.toString(),
    metadata: {
      user_id: params.userId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName || "",
      ...params.metadata,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
  });

  return session;
}

/**
 * 处理Webhook事件
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  // 检测测试事件
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return { verified: true };
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }

  return { received: true };
}

/**
 * 处理Checkout Session完成
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = parseInt(session.metadata?.user_id || "0");
  const projectId = session.metadata?.project_id ? parseInt(session.metadata.project_id) : undefined;

  if (!userId) {
    console.error("[Webhook] Missing user_id in session metadata");
    return;
  }

  // 创建订单记录
  const product = getProductByPriceId(session.line_items?.data[0]?.price?.id || "");
  
  await db.createOrder({
    userId,
    projectId,
    orderType: product?.id as any || "launch_standard",
    totalAmount: ((session.amount_total || 0) / 100).toString(),
    currency: session.currency?.toUpperCase() || "USD",
    status: "completed",
    orderDetails: {
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent,
      product_id: product?.id,
      product_name: product?.name,
    },
  });

  // 创建支付记录
  await db.createPayment({
    userId,
    orderId: 0, // Will be updated after order creation
    transactionId: session.payment_intent as string,
    amount: ((session.amount_total || 0) / 100).toString(),
    currency: session.currency?.toUpperCase() || "USD",
    status: "succeeded",
    paymentMethod: session.payment_method_types?.[0] || "card",
    metadata: {
      stripe_session_id: session.id,
    },
  });

  console.log(`[Webhook] Order created for user ${userId}`);
}

/**
 * 处理支付成功
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}`);
  // 支付记录已在checkout.session.completed中创建
}

/**
 * 处理发票支付（订阅）
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = parseInt(subscription.metadata?.user_id || "0");

  if (!userId) {
    console.error("[Webhook] Missing user_id in subscription metadata");
    return;
  }

  // 更新订阅记录
  await db.upsertSubscription({
    userId,
    plan: subscription.metadata?.plan as any || "standard",
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    status: subscription.status === "active" ? "active" : "cancelled",
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  console.log(`[Webhook] Subscription updated for user ${userId}`);
}

/**
 * 处理订阅更新
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = parseInt(subscription.metadata?.user_id || "0");
  if (!userId) return;

  await db.upsertSubscription({
    userId,
    plan: subscription.metadata?.plan as any || "standard",
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    status: subscription.status === "active" ? "active" : "cancelled",
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  console.log(`[Webhook] Subscription updated for user ${userId}`);
}

/**
 * 处理订阅取消
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = parseInt(subscription.metadata?.user_id || "0");
  if (!userId) return;

  await db.updateSubscriptionStatus(userId, "cancelled");
  console.log(`[Webhook] Subscription cancelled for user ${userId}`);
}
