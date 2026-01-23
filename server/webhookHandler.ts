import express from "express";
import { stripe, handleWebhookEvent } from "./stripe";

export function registerWebhookHandler(app: express.Application) {
  // Stripe webhook endpoint - MUST use raw body for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];

      if (!sig) {
        console.error("[Webhook] Missing stripe-signature header");
        return res.status(400).send("Missing signature");
      }

      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error("[Webhook] STRIPE_WEBHOOK_SECRET not configured");
        return res.status(500).send("Webhook secret not configured");
      }

      try {
        // Verify webhook signature
        const event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );

        // Handle the event
        const result = await handleWebhookEvent(event);
        
        res.json(result);
      } catch (err) {
        console.error("[Webhook] Error:", err);
        return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  );

  console.log("[Webhook] Stripe webhook handler registered at /api/stripe/webhook");
}
