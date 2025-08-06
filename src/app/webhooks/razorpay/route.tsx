import db from "@/db/db";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import PurchaseReceiptEmail from "@/email/PurchaseReceipt";
import type { Order, Product, User } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY as string);

export async function POST(request: Request) {
  try {
    const body = await request.text();

    // ✅ Validate Razorpay signature
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
      const payment = event.payload.payment.entity as {
        amount: number;
        notes?: { productId?: string; buyerEmail?: string };
        email?: string;
      };

      const { amount, notes, email } = payment;
      const productId = notes?.productId;
      const buyerEmail = notes?.buyerEmail || email;

      if (!productId || !buyerEmail) {
        return NextResponse.json(
          { message: "Missing productId or email" },
          { status: 400 }
        );
      }

      const product: Product | null = await db.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json({ message: "Product not found" }, { status: 404 });
      }

      const userFields = {
  email: buyerEmail,
  name: "Unknown", // Or derive from Razorpay or your business logic
  clerkUserId: crypto.randomUUID(), // Or pass actual Clerk ID if available
  imageUrl: "/default-avatar.png", // Some default image
  orders: {
    create: {
      productId,
      pricePaidInCents: amount,
    },
  },
};

      // ✅ Upsert user and include latest order
      const user: User & { orders: Order[] } = await db.user.upsert({
  where: { email: buyerEmail },
  create: userFields, // must contain all required fields
  update: userFields, // you can decide if you want to update name or image here
  include: {
    orders: {
      orderBy: { createdAt: "desc" },
      take: 1,
    },
  },
});

      const [order] = user.orders;

      if (!order) {
        return NextResponse.json({ message: "Order creation failed" }, { status: 500 });
      }

      // ✅ Create download verification record
      const downloadVerification = await db.downloadVerification.create({
        data: {
          productId,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hrs expiry
        },
      });

      // ✅ Send confirmation email
      await resend.emails.send({
        from: `Support <${process.env.SENDER_EMAIL}>`,
        to: buyerEmail,
        subject: "Order Confirmation",
        react: (
          <PurchaseReceiptEmail
            order={order}
            product={product}
            downloadVerificationId={downloadVerification.id}
          />
        ),
      });
    }

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { message: "Internal server error", error },
      { status: 500 }
    );
  }
}
