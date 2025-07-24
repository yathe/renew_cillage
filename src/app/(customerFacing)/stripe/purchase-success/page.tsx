export const dynamic = "force-dynamic" // ✅ add this

import Image from "next/image"
import Stripe from "stripe"
import { notFound } from "next/navigation"
import db from "@/db/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string }>
}) {
  // ✅ Await searchParams first
  const params = await searchParams
  const paymentIntentId = params.payment_intent
  if (!paymentIntentId) return notFound()

  // ✅ Now safe to use
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (!paymentIntent.metadata.productId) return notFound()

  const product = await db.product.findUnique({
    where: { id: paymentIntent.metadata.productId },
  })
  if (!product) return notFound()

  const isSuccess = paymentIntent.status === "succeeded"
  const formattedPrice = (product.priceInCents / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* header */}
        <div className="bg-gradient-to-r from-green-400 to-indigo-500 text-white py-6 px-4 text-center">
          <h1 className="text-3xl font-extrabold">
            {isSuccess ? "✅ Payment Successful!" : "❌ Payment Failed"}
          </h1>
          <p className="text-sm mt-1 opacity-90">
            {isSuccess
              ? "Thank you for your purchase!"
              : "There was a problem with your payment."}
          </p>
        </div>

        {/* product section */}
        <div className="p-6 flex flex-col items-center text-center">
          <div className="relative w-40 h-40 mb-6">
            <Image
              src={product.imagePath}
              alt={product.name}
              fill
              className="object-contain rounded-xl border shadow-md"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h2>
          <p className="text-lg font-semibold text-green-600 mb-3">{formattedPrice}</p>
          <p className="text-gray-600 leading-relaxed max-w-md">{product.description}</p>
        </div>

        {/* footer */}
        <div className="p-6 border-t border-gray-100 flex justify-center">
          {isSuccess ? (
            <Button asChild className="text-lg px-6 py-3 rounded-xl">
              <a href={`/products/download/${await createDownloadVerification(product.id)}`}>
                Download Now
              </a>
            </Button>
          ) : (
            <Button asChild variant="secondary" className="text-lg px-6 py-3 rounded-xl">
              <Link href={`/products/${product.id}/purchase`}>Try Again</Link>
            </Button>
          )}
        </div>
      </div> 
    </div>
  )
}



async function createDownloadVerification(productId: string) {
  return (
    await db.downloadVerification.create({
      data: {
        productId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    })
  ).id
} 