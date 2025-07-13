"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/formatters"
import { useState } from "react"
import { addProduct } from "../../_actions/products"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"


export function ProductForm() {
  const [error, action] = useActionState(addProduct, {})
 const [priceInCents, setPriceInCents] = useState("");

  return (
    <form action={action}className="space-y-8 max-w-md p-6 bg-white border border-gray-200 rounded-2xl shadow-sm font-serif">
      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-lg text-gray-700">
          Product Name
        </Label>
        <Input
          type="text"
          id="name"
          name="name"
          required
          className="border border-gray-300 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
        />
        {error.name && <div className="text-destructive">{error.name}</div>
        }
      </div>

      {/* Price in Rupees */}
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
  onChange={(e) => setPriceInCents(e.target.value)}
/>
<div className="text-sm text-gray-500">
  {priceInCents
    ? `= ${formatCurrency(Number(priceInCents) / 100)}`
    : "Enter price to see value in ₹"}
</div>
{error.priceInCents && <div className="text-destructive">{error.priceInCents}</div>
        }
      </div>
       <div className="space-y-2">
       <Label htmlFor="description" className="text-lg text-gray-700">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          required
          className="border border-gray-300 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
        />
        {error.description && <div className="text-destructive">{error.description}</div>
        }
        </div>
         <div className="space-y-2">
        <Label htmlFor="file" className="text-lg text-gray-700">
          File
        </Label>
        <Input
          type="file"
          id="file"
          name="file"
          required
          className="border border-gray-300 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
        />
        {error.file && <div className="text-destructive">{error.file}</div>
        }
      </div>
       <div className="space-y-2">
        <Label htmlFor="image" className="text-lg text-gray-700">
          Image
        </Label>
        <Input
          type="file"
          id="image"
          name="image"
          required
          className="border border-gray-300 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
        />
        {error.image && <div className="text-destructive">{error.image}</div>
        }
      </div>
     <SubmitButton/>

    </form>
  )
}
function SubmitButton(){
  const { pending } = useFormStatus()
  return <Button type="submit" className="bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg px-6 py-2 rounded-xl border border-gray-700 transition duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 ml-[calc(50%-63px)] mt-4" disabled={pending}>{pending ? "Saving.." : "Save"}</Button>
}
