import Stripe from "stripe";

let stripe: Stripe | undefined;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  stripe ??= new Stripe(key, { apiVersion: "2023-10-16" });
  return stripe;
}
