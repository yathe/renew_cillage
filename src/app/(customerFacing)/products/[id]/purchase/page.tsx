import db from "@/db/db";
import { notFound } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { CheckoutForm } from "./_components/CheckOutForm";

export default async function PurchasePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // Fetch product from DB
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return notFound();

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: product.priceInCents,
    currency: "inr",
    metadata: { productId: product.id },
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Stripe failed to create payment");
  }

  // Render CheckoutForm component
  return (
    <CheckoutForm
      product={product}
      clientSecret={paymentIntent.client_secret}
    />
  );
}
