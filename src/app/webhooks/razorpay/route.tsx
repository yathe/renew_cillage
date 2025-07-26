import db from "@/db/db"
import {  NextResponse } from "next/server"
import crypto from "crypto";
import { Resend } from "resend"
import PurchaseReceiptEmail from "@/email/PurchaseReceipt"

const resend = new Resend(process.env.RESEND_API_KEY as string);


export async function POST(request: Request) {
  const body = await request.text();

  const sig = request.headers.get("x-razorpay-signature") as string;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const digest = hmac.digest("hex");

  if (sig !== digest) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const eventType = event.event;

  if (eventType === "payment.captured") {
    const payment = event.payload.payment.entity;

    const { amount, notes, email } = payment;

    const productId = notes?.productId;
    const buyerEmail = notes?.buyerEmail || email;

    if (!productId || !buyerEmail) {
      return NextResponse.json({ message: "Missing productId or email" }, { status: 400 });
    }

    const product = await db.product.findUnique({ where: { id: productId } });

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 400 });
    }

    const userFields = {
      email: buyerEmail,
      orders: {
        create: {
          productId,
          pricePaidInCents: amount, // Razorpay amount is already in paise
        },
      },
    };

    const {
      orders: [order],
    } = await db.user.upsert({
      where: { email: buyerEmail },
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