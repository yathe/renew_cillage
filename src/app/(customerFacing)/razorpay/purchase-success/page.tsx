export const dynamic = "force-dynamic"

import Razorpay from "razorpay"
import Image from "next/image"
import { notFound } from "next/navigation"
import db from "@/db/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_Razorpay_PUBLISHABLE_KEY as string,
  key_secret: process.env.Razorpay_secret_key as string,
})
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ razorpay_payment_id?: string }>
}) {
  const params = await searchParams
  const paymentId = params.razorpay_payment_id
  if (!paymentId) return notFound()

  // ✅ Fetch payment details from Razorpay
  const payment = await razorpay.payments.fetch(paymentId)
  const productId = payment.notes?.productId
  const buyerEmail = payment.email

  if (!productId || !buyerEmail) return notFound()

  const product = await db.product.findUnique({
    where: { id: productId },
  })
  if (!product) return notFound()

  const isSuccess = payment.status === "captured"
  const formattedPrice = (product.priceInCents / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  })

  // First, ensure the user exists
  const user = await db.user.upsert({
    where: { email: buyerEmail },
    create: {
      email: buyerEmail,
      name: buyerEmail.split('@')[0], // Default name from email
      clerkUserId: `razorpay_${paymentId}`, // Temporary ID
      imageUrl: '/default-user.png' // Default image
    },
    update: {}
  })

  // Then create the order
  const order = await db.order.create({
    data: {
      product: {
        connect: { id: productId }
      },
      pricePaidInCents: Number(payment.amount),
      user: { 
        connect: { id: user.id }
      },
    },
  })

  // const downloadVerification = await db.downloadVerification.create({
  //   data: {
  //     productId,
  //     expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  //   },
  // })

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
        <div className="p-6 border-t border-gray-100 flex flex-col gap-4 items-center">
          {isSuccess ? (
            <>
              <Button asChild className="text-lg px-6 py-3 rounded-xl">
                <a href={`/products/download/${await createDownloadVerification(product.id)}`}>
                  Download Now
                </a>
              </Button>
              <Button asChild variant="outline" className="text-lg px-6 py-3 rounded-xl">
                <Link href={`/track/${order.id}`}>
                  Track Your Delivery
                </Link>
              </Button>
            </>
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
