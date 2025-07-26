import db from "@/db/db"
import { notFound } from "next/navigation"
import razorpay from "@/lib/razorpay"
import { CheckoutForm } from "./_components/CheckOutForm"

interface PageProps {
  params: { id: string }
}

export default async function PurchasePage({ params }: PageProps) {
  const id = params?.id

  if (!id) return notFound()

  // Fetch product from DB
  const product = await db.product.findUnique({
    where: { id },
  })

  if (!product) return notFound()

  // Generate a receipt with <= 40 characters
  const shortReceipt = `p_${id.slice(0, 20)}_${Date.now().toString(36)}`

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount: product.priceInCents, // Razorpay expects paise
    currency: "INR",
    receipt: shortReceipt,
    notes: {
      productId: product.id,
    },
  })

  if (!order || !order.id) {
    throw new Error("Razorpay failed to create order")
  }

  return (
    <CheckoutForm
      product={product}
      razorpayOrderId={order.id}
      amount={order.amount}
      currency={order.currency}
    />
  )
}
