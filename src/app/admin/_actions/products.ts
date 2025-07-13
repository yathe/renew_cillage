"use server"

import db from "@/db/db";
import z from "zod"; //  Secure input validation
import fs from "fs/promises";
import { notFound, redirect } from "next/navigation";

//  Checks file exists and isn't empty
const fileSchema = z.instanceof(File, { message: "Required" }).refine(
  file => file.size > 0,
  { message: "Required" }
);

//  Ensures it's a real image file
const imageSchema = fileSchema.refine(
  file => file.type.startsWith("image/"),
  { message: "Must be an image" }
);

//  Full product input rules
const addSchema = z.object({
  name: z.string().min(1),                         // 🔤 Name needed
  description: z.string().min(1),                  // 📘 Description needed
  priceInCents: z.coerce.number().int().min(1),    // 💵 Must be valid price
  file: fileSchema,                                // 📎 Requires any file
  image: imageSchema                               // 🖼️ Requires image file
});

//  Handles product creation
export async function addProduct(prevState: unknown, formData: FormData) {
  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
    priceInCents: formData.get("priceInCents"),
    file: formData.get("file"),
    image: formData.get("image")
  }

  const result = addSchema.safeParse(raw);
  if (!result.success) {
    return result.error.flatten().fieldErrors; //  Return errors
  }

  const data = result.data;

  //  Save file securely
  await fs.mkdir("products", { recursive: true });
  const filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
  await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));

  //  Save image to public folder
  await fs.mkdir("public/products", { recursive: true });
  const imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
  await fs.writeFile(`public${imagePath}`, Buffer.from(await data.image.arrayBuffer()));

  //  Save product in DB
  await db.product.create({
    data: {
      isAvailableForPurchase: false,
      name: data.name,
      description: data.description,
      priceInCents: data.priceInCents,
      filePath,
      imagePath
    }
  });

  redirect("/admin/products"); //  Go back to admin page
}

//  Toggle product visibility
export async function toggleProductAvailability(id: string, isAvailableForPurchase: boolean) {
  await db.product.update({
    where: { id },
    data: { isAvailableForPurchase }
  });
}
export async function deleteProduct(id: string){
  const product = await db.product.delete({ where: {id}})
  if(product == null) return notFound()

    await fs.unlink(product.filePath);// delete the file from server
     await fs.unlink(`public${product.imagePath}`);// delete the image from public folder
}
