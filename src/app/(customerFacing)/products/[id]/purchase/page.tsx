import db from "@/db/db";
import { notFound } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { CheckoutForm } from "./_components/CheckOutForm";

interface PageProps {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function PurchasePage({ params }: PageProps) {
  const { id } = params;

  // Rest of your existing code
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return notFound();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: product.priceInCents,
    currency: "inr",
    metadata: { productId: product.id },
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Stripe failed to create payment");
  }

  return (
    <CheckoutForm
      product={product}
      clientSecret={paymentIntent.client_secret}
    />
  );
}
