"use client"
import { Elements, LinkAuthenticationElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { motion } from "framer-motion"
import Image from "next/image"
import { FormEvent, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { userOrderExists } from "@/app/(customerFacing)/actions/orders"

type CheckoutFormProps = {
  product: {
    id: string
    imagePath: string
    name: string
    priceInCents: number
    description: string
  }
  clientSecret: string
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string)

export function CheckoutForm({ product, clientSecret }: CheckoutFormProps) {
  const formattedPrice = (product.priceInCents / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  })

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="
          w-full max-w-4xl
          bg-white rounded-2xl shadow-2xl border border-gray-200
          overflow-hidden
          flex flex-col md:flex-row
        "
      >
        {/* Product Section */}
        <div className="md:w-1/2 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center">
          <div className="relative w-40 h-40 mb-4">
            <Image
              src={product.imagePath}
              alt={product.name}
              fill
              className="object-contain rounded-xl"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">{product.name}</h2>
          <p className="text-lg font-semibold text-green-600 mb-3">{formattedPrice}</p>
          <p className="text-gray-600 text-center leading-relaxed">{product.description}</p>
        </div>

        {/* Payment Section */}
        <div className="md:w-1/2 p-6 bg-white">
          <Elements options={{ clientSecret }} stripe={stripePromise}>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Complete Your Purchase</h1>
            <p className="text-gray-500 text-center mb-6 text-sm">
              💳 Secure payment powered by <span className="font-medium text-gray-800">Stripe</span>
            </p>
            <Form priceInCents={product.priceInCents} productId={product.id} />
          </Elements>
        </div>
      </motion.div>
    </div>
  )
}

function Form({ priceInCents,productId }: { priceInCents: number,productId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [email, setEmail] = useState<string>()
  const formattedPrice = (priceInCents / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || !email) return

    setIsLoading(true)
    setErrorMessage(undefined)
     // Check for existing order
    userOrderExists(email, productId)
    const orderExists = await userOrderExists(email,productId)
    if (orderExists){
      setErrorMessage("You have already purchased this product.Try downloading it from the My Orders page")
      setIsLoading(false)
      return
    }
   

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/stripe/purchase-success`,
      },
    })

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setErrorMessage(error.message)
      } else {
        setErrorMessage("An unknown error occurred")
      }
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border border-gray-200 shadow-inner">
        <CardHeader>
          <CardTitle className="text-gray-800">Checkout</CardTitle>
          {errorMessage && (
            <CardDescription className="text-red-500 font-medium">
              {errorMessage}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <PaymentElement />
            <LinkAuthenticationElement onChange={e => setEmail(e.value.email)}/>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <button
            type="submit"
            disabled={!stripe || !elements || isLoading}
            className="
              w-full py-3 px-4 rounded-xl font-semibold text-white
              bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500
              hover:scale-[1.02] hover:shadow-xl active:scale-95
              transition-all duration-300 ease-in-out
            "
          >
            {isLoading ? "Processing..." : `Pay ${formattedPrice}`}
          </button>
          <p className="text-center text-xs text-gray-500">
            🔒 Your payment is encrypted & secure.
          </p>
        </CardFooter>
      </Card>
    </form>
  )
}
