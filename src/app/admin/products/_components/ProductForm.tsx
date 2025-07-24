"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/formatters"
import { Product } from "@prisma/client"
import Image from "next/image"
import { addProduct, updateProduct } from "../../_actions/products"

// 🛠️ A form for creating or updating a product
export function ProductForm({ product }: { product?: Product | null }) {
  // 📦 Form state: pre-fill with product data if editing
  const [name, setName] = useState(product?.name || "")
  const [priceInCents, setPriceInCents] = useState(product?.priceInCents || "")
  const [description, setDescription] = useState(product?.description || "")
  const [file, setFile] = useState<File | null>(null)
  const [image, setImage] = useState<File | null>(null)

  // 🎨 For showing selected image/file names
  const [selectedImageURL, setSelectedImageURL] = useState<string | null>()
  const [selectedFileName, setSelectedFileName] = useState(product?.filePath || "")

  // ⚠️ Validation errors go here
  const [error, setError] = useState<Record<string, string>>({})

  // 🚦 useTransition handles async actions smoothly
  const [isPending, startTransition] = useTransition()

  // 🚀 Save button handler: collect form data and send to server
  const handleSubmit = () => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("priceInCents", priceInCents.toString())
      formData.append("description", description)
      if (file) formData.append("file", file)
      if (image) formData.append("image", image)

      // ✨ Decide whether to add or update product
      const action = product == null ? addProduct : updateProduct.bind(null, product.id)
      const result = await action({}, formData)

      // 🕵️‍♂️ If server returns errors, show them
      if (result && typeof result === "object" && !Array.isArray(result)) {
        setError(result as Record<string, string>)
      } else {
        setError({})
      }
    })
  }

  return (
    <div className="space-y-8 max-w-md p-6 bg-white border border-gray-200 rounded-2xl shadow-sm font-serif">
      {/* ✏️ --- Product Name Field --- */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-lg text-gray-700">Product Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        {error.name && <div className="text-destructive">{error.name}</div>}
      </div>

      {/* 💰 --- Price Field --- */}
      <div className="space-y-2">
        <Label htmlFor="price" className="text-lg text-gray-700">Price (in paise)</Label>
        <Input
          id="price"
          type="number"
          value={priceInCents}
          onChange={(e) => setPriceInCents(e.target.value)}
        />
        {/* 👀 Live currency preview */}
        <div className="text-sm text-gray-500">
          {priceInCents
            ? `${formatCurrency(Number(priceInCents) / 100)}`
            : "Enter price to see "}
        </div>
        {error.priceInCents && <div className="text-destructive">{error.priceInCents}</div>}
      </div>

      {/* 📝 --- Description Field --- */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-lg text-gray-700">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        {error.description && <div className="text-destructive">{error.description}</div>}
      </div>

      {/* 📄 --- File Upload (PDF / etc.) --- */}
      <div className="space-y-2">
        <Label htmlFor="file" className="text-lg text-gray-700">File</Label>
        <Input
          type="file"
          id="file"
          onChange={(e) => {
            const selected = e.target.files?.[0]
            setFile(selected || null)
            setSelectedFileName(selected?.name || "")
          }}
        />
        {selectedFileName && (
          <div className="text-sm text-gray-600">Selected: {selectedFileName}</div>
        )}
        {error.file && <div className="text-destructive">{error.file}</div>}
      </div>

      {/* 🖼️ --- Image Upload with Preview --- */}
      <div className="space-y-2">
        <Label htmlFor="image" className="text-lg text-gray-700">Image</Label>
        <Input
          type="file"
          id="image"
          accept="image/*"
          onChange={(e) => {
            const img = e.target.files?.[0]
            setImage(img || null)
            setSelectedImageURL(img ? URL.createObjectURL(img) : null)
          }}
        />
        {/* 🎨 Show preview if available */}
        {selectedImageURL ? (
          <Image src={selectedImageURL} alt="Preview" height={400} width={400} />
        ) : product?.imagePath && (
          <Image src={product.imagePath} alt="Product" height={400} width={400} />
        )}
        {error.image && <div className="text-destructive">{error.image}</div>}
      </div>

      {/* ✅ --- Submit Button --- */}
      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg px-6 py-2 rounded-xl border border-gray-700 transition duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 ml-[calc(50%-63px)] mt-4"
      >
        {isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  )
}
