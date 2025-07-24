import db from "@/db/db";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ downloadVerificationId: string }> }
) {
  const { downloadVerificationId } = await context.params;

  const data = await db.downloadVerification.findUnique({
    where: {
      id: downloadVerificationId,
      expiresAt: { gt: new Date() },
    },
    select: {
      product: {
        select: {
          filePath: true,
          name: true,
        },
      },
    },
  });

  if (data == null) {
    return NextResponse.redirect(new URL("/products/download/expired", req.url));
  }

  const { size } = await fs.stat(data.product.filePath);
  const file = await fs.readFile(data.product.filePath);
  const extension = data.product.filePath.split(".").pop();

  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
        data.product.name
      )}.${extension}`,
      "Content-Length": size.toString(),
    },
  });
}
