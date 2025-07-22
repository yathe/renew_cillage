import db from "@/db/db"
import { notFound } from "next/navigation"
import { stripe } from "@/lib/stripe"
import { CheckoutForm } from "./_components/CheckOutForm"

interface PageProps {
  params: {
    id: string
  }
}

export default async function PurchasePage({ params }: PageProps) {
  const { id } = params

  const product = await db.product.findUnique({ where: { id } })
  if (product == null) return notFound()

  const paymentIntent = await stripe.paymentIntents.create({
    amount: product.priceInCents,
    currency: 'inr',
    metadata: { productId: product.id },
  })

  if (!paymentIntent.client_secret) {
    throw new Error('Stripe failed to create payment')
  }

  return (
    <CheckoutForm
      product={product}
      clientSecret={paymentIntent.client_secret}
    />
  )
}
