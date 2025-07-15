"use client" // Enables client-side rendering for this component

// Importing reusable UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Utility to format currency nicely (e.g., ₹100.00)
import { formatCurrency } from "@/lib/formatters"

// React hooks for managing state
import { useState } from "react"
import { addProduct, updateProduct } from "../../_actions/products" // Function to handle product submission
import { useActionState } from "react" // Handles async action with error states
import { useFormStatus } from "react-dom" // Tracks form submit status
import { Product } from "@prisma/client" // Type definition for Product from database
import Image from "next/image"

// Main Product Form component, optionally receives a product (for edit mode)
export function ProductForm({ product }: { product?: Product | null }) {
  // useActionState returns errors (if any) and the action to be called on form submit
  const [error, action] = useActionState(product == null ? addProduct : updateProduct.bind(null, product.id), {})

  // priceInCents is controlled state, used to show live currency preview
  const [priceInCents, setPriceInCents] = useState(product?.priceInCents || "")
  const [selectedFileName, setSelectedFileName] = useState("")
const [selectedImageURL, setSelectedImageURL] = useState<string | null>(null)


  return (
    // Main form layout with styling
    <form action={action} className="space-y-8 max-w-md p-6 bg-white border border-gray-200 rounded-2xl shadow-sm font-serif">
      
      {/* -------- Product Name Input -------- */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-lg text-gray-700">
          Product Name
        </Label>
        <Input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={product?.name || ""}
          className="border border-gray-300 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
        />
        {/* Show error if name is missing or invalid */}
        {error.name && <div className="text-destructive">{error.name}</div>}
      </div>

      {/* -------- Price Input (in paise) -------- */}
      <div className="space-y-2">
        <Label htmlFor="priceInCents" className="text-lg text-gray-700">
          Price (in paise)
        </Label>
        <Input
          type="number"
          id="priceInCents"
          name="priceInCents"
          required
          value={priceInCents}
          onChange={(e) => setPriceInCents(e.target.value)} // Update state on change
        />
        {/* Show equivalent price in ₹ (e.g., ₹99.99) */}
        <div className="text-sm text-gray-500">
          {priceInCents
            ? `= ${formatCurrency(Number(priceInCents) / 100)}`
            : "Enter price to see value in ₹"}
        </div>
        {/* Show error if price is invalid */}
        {error.priceInCents && <div className="text-destructive">{error.priceInCents}</div>}
      </div>

      {/* -------- Description Input -------- */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-lg text-gray-700">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          required
          defaultValue={product?.description}
          className="border border-gray-300 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
        />
        {/* Show error if description is invalid */}
        {error.description && <div className="text-destructive">{error.description}</div>}
      </div>

      {/* -------- File Upload Input -------- */}
      <div className="space-y-2">
  <Label htmlFor="file" className="text-lg text-gray-700">
    File
  </Label>
  <Input
  type="file"
  id="file"
  name="file"
  required={!product?.filePath}
  onChange={(e) => {
    const file = e.target.files?.[0]
    setSelectedFileName(file?.name || "")
  }}
  className="border border-gray-300 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
/>

  {/* Show selected file name or previously uploaded file path */}
  {selectedFileName ? (
    <div className="text-sm text-gray-600">Selected: {selectedFileName}</div>
  ) : product != null ? (
    <div className="text-muted-foreground">{product.filePath}</div>
  ) : null}
  {error.file && <div className="text-destructive">{error.file}</div>}
</div>


      {/* -------- Image Upload Input -------- */}
      <div className="space-y-2">
  <Label htmlFor="image" className="text-lg text-gray-700">
    Image
  </Label>
  <Input
    type="file"
    id="image"
    name="image"
    accept="image/*"
    required={product == null}
    onChange={(e) => {
    const file = e.target.files?.[0] // 📂 Get the selected image file
if (file) {
  const imageUrl = URL.createObjectURL(file) // 🔗 Create a temporary URL to preview the image
  setSelectedImageURL(imageUrl) // 🖼️ Save the preview URL to show image on screen
}
 else {
        setSelectedImageURL(null)
      }
    }}
    className="border border-gray-300 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
  />
  {/* Show image preview or existing image */}
  {selectedImageURL ? (
    <Image src={selectedImageURL} height={400} width={400} alt="Preview" />
  ) : product != null ? (
    <Image src={product.imagePath} height={400} width={400} alt="Product Image" />
  ) : null}
  {error.image && <div className="text-destructive">{error.image}</div>}
</div>


      {/* -------- Submit Button -------- */}
      <SubmitButton />
    </form>
  )
}

// Separate component for submit button with dynamic loading text
function SubmitButton() {
  const { pending } = useFormStatus() // Detect if form is currently being submitted

  return (
    <Button
      type="submit"
      className="bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg px-6 py-2 rounded-xl border border-gray-700 transition duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 ml-[calc(50%-63px)] mt-4"
      disabled={pending} // Disable button while submitting
    >
      {pending ? "Saving.." : "Save"} {/* Show loading state */}
    </Button>
  )
}
