"use server" // ✅ This file runs on the server side in Next.js (app router feature)

import db from "@/db/db";
import z from "zod"; // ✅ Library for runtime validation of inputs
import fs from "fs/promises"; // ✅ For file operations (create, write, delete)
import { notFound, redirect } from "next/navigation"; // ✅ Next.js helpers to handle routing and errors
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------
// 📝 SCHEMAS FOR VALIDATION
// ---------------------------------------------------------

// ✅ File must exist and not be empty
const fileSchema = z.instanceof(File, { message: "Required" }).refine(
  file => file.size > 0,
  { message: "Required" }
);

// ✅ Image must be a file AND must be an image type
const imageSchema = fileSchema.refine(
  file => file.type.startsWith("image/"),
  { message: "Must be an image" }
);

// ✅ Full schema for adding a product
const addSchema = z.object({
  name: z.string().min(1),                         // 🔤 Product name is required
  description: z.string().min(1),                  // 📘 Description is required
  priceInCents: z.coerce.number().int().min(1),    // 💵 Price must be positive integer
  file: fileSchema,                                // 📎 File is required
  image: imageSchema                               // 🖼️ Image is required
});

// ---------------------------------------------------------
// ✨ ADD PRODUCT
// ---------------------------------------------------------
export async function addProduct(prevState: unknown, formData: FormData) {
  // 🔄 Extract raw form values from FormData
  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
    priceInCents: formData.get("priceInCents"),
    file: formData.get("file"),
    image: formData.get("image")
  }

  // ✅ Validate inputs using zod
  const result = addSchema.safeParse(raw);
  if (!result.success) {
    // ❌ If validation fails, return error messages for fields
    return result.error.flatten().fieldErrors;
  }

  // ✅ Destructure validated data
  const data = result.data;

  // 📁 Save uploaded file to server folder "products"
  await fs.mkdir("products", { recursive: true });
  const filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
  await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));

  // 🖼️ Save uploaded image to public folder "public/products"
  await fs.mkdir("public/products", { recursive: true });
  const imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
  await fs.writeFile(`public${imagePath}`, Buffer.from(await data.image.arrayBuffer()));

  // 💾 Store product record in the database
  await db.product.create({
    data: {
      isAvailableForPurchase: false, // new product is hidden by default
      name: data.name,
      description: data.description,
      priceInCents: data.priceInCents,
      filePath,
      imagePath
    }
  });
 revalidatePath("/")
 revalidatePath("/products")
  // 🔙 Redirect admin back to product list
  redirect("/admin/products");
}

// ---------------------------------------------------------
// ✨ UPDATE PRODUCT
// ---------------------------------------------------------

// 🔧 Schema for editing: file/image optional
const editSchema = addSchema.extend({
  file: fileSchema.optional(),
  image: imageSchema.optional()
});

export async function updateProduct(id: string, prevState: unknown, formData: FormData) {
  // 🔄 Extract raw form data
  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    description: formData.get("description"),
    priceInCents: formData.get("priceInCents"),
    file: formData.get("file"),
    image: formData.get("image")
  };

  // 🧹 Clean invalid file/image values (empty files)
  if (!(raw.file instanceof File) || raw.file.size === 0) {
    delete raw.file;
  }
  if (!(raw.image instanceof File) || raw.image.size === 0) {
    delete raw.image;
  }

  // ✅ Validate edited inputs
  const result = editSchema.safeParse(raw);
  if (!result.success) {
    return result.error.flatten().fieldErrors; // ❌ Return validation errors
  }

  const data = result.data;

  // 🔎 Get current product from database
  const product = await db.product.findUnique({ where: { id }});
  if (product == null) return notFound(); // ❌ If product not found

  // 🔄 File update logic
  let filePath = product.filePath;
  if (data.file != null && data.file.size > 0) {
    await fs.unlink(product.filePath); // 🗑️ Delete old file
    filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
    await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer())); // 💾 Save new file
  }

  // 🔄 Image update logic
  let imagePath = product.imagePath;
  if (data.image != null && data.image.size > 0) {
    await fs.unlink(`public${product.imagePath}`); // 🗑️ Delete old image
    imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
    await fs.writeFile(`public${imagePath}`, Buffer.from(await data.image.arrayBuffer())); // 💾 Save new image
  }

  // 💾 Update product in database
  await db.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      priceInCents: data.priceInCents,
      filePath,
      imagePath
    }
  });
 revalidatePath("/")
 revalidatePath("/products")
  // 🔙 Redirect admin back to product list
  redirect("/admin/products");
}

// ---------------------------------------------------------
// ✨ TOGGLE PRODUCT AVAILABILITY
// ---------------------------------------------------------
export async function toggleProductAvailability(id: string, isAvailableForPurchase: boolean) {
  // ✅ Update visibility field in database
  await db.product.update({
    where: { id },
    data: { isAvailableForPurchase }
  });
  revalidatePath("/")
 revalidatePath("/products")
}

// ---------------------------------------------------------
// ✨ DELETE PRODUCT
// ---------------------------------------------------------
export async function deleteProduct(id: string) {
  // 🔎 Delete product from database
  const product = await db.product.delete({ where: { id }});
  if (product == null) return notFound();

  // 🗑️ Delete associated files from storage
  await fs.unlink(product.filePath);
  await fs.unlink(`public${product.imagePath}`);
  revalidatePath("/")
 revalidatePath("/products")
}
