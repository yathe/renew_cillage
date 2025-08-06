import db from "@/db/db";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
 
  req: NextRequest,
  context:{ params: Promise<{ id: string }> }
) {
 
  const { id } = await context.params;

  const product = await db.product.findUnique({
    where: { id },
    select: { filePath: true, name: true },
  });

  if (!product) {
    return new NextResponse("Product not found", { status: 404 });
  }

  const filePath = path.resolve(product.filePath);
  const { size } = await fs.stat(filePath);
  const file = await fs.readFile(filePath);
  const extension = product.filePath.split(".").pop();

  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${product.name}.${extension}"`,
      "Content-Length": size.toString(),
    },
  });
}
