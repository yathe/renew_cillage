import { NextResponse,NextRequest } from "next/server";
import db from "@/db/db";
import razorpay from "@/lib/razorpay";

export async function POST(
   req: NextRequest,
    context:{ params: Promise<{ id: string }> }
  ) {
   
    const { id } = await context.params;

  const product = await db.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const shortReceipt = `p_${id.slice(0, 20)}_${Date.now().toString(36)}`;

  const order = await razorpay.orders.create({
    amount: product.priceInCents,
    currency: "INR",
    receipt: shortReceipt,
    notes: { productId: product.id },
  });

  return NextResponse.json({ product, order });
}
