import db from "@/db/db"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { Resend } from "resend"
import PurchaseReceiptEmail from "@/email/PurchaseReceipt"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const resend = new Resend(process.env.RESEND_API_KEY as string)

export async function POST(req: NextRequest) {
  const event = await stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get("stripe-signature") as string,
    process.env.STRIPE_WEBHOOK_SECRET as string
  )

if (event.type === "checkout.session.completed") {
  const session = event.data.object as Stripe.Checkout.Session

  const productId = session.metadata?.productId
  const email = session.customer_details?.email

  if (!productId || !email) return new NextResponse("Bad Request", { status: 400 })

  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) return new NextResponse("Bad Request", { status: 400 })

  const userFields = {
    email,
    orders: { create: { productId, pricePaidInCents: product.priceInCents } },
  }

  const {
    orders: [order],
  } = await db.user.upsert({
    where: { email },
    create: userFields,
    update: userFields,
    select: { orders: { orderBy: { createdAt: "desc" }, take: 1 } },
  })

  const downloadVerification = await db.downloadVerification.create({
    data: {
      productId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  })

  await resend.emails.send({
    from: `Support <${process.env.SENDER_EMAIL}>`,
    to: email,
    subject: "Order Confirmation",
    react: (
      <PurchaseReceiptEmail
        order={order}
        product={product}
        downloadVerificationId={downloadVerification.id}
      />
    ),
  })
}


  return new NextResponse()
}