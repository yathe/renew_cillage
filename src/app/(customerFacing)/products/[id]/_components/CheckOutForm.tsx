"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { userOrderExists } from "@/app/(customerFacing)/actions/orders";

// ✅ Define Razorpay types manually because the package doesn't export them
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }

  interface RazorpayInstance {
    open: () => void;
  }
}

type CheckoutFormProps = {
  product: {
    id: string;
    imagePath: string;
    name: string;
    priceInCents: number;
    description: string;
  };
  razorpayOrderId: string;
  amount: number;
  currency: string;
};

export function CheckoutForm({
  product,
  razorpayOrderId,
  amount,
  currency,
}: CheckoutFormProps) {
  const formattedPrice = (amount / 100).toLocaleString("en-IN", {
    style: "currency",
    currency,
  });

  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Load Razorpay Checkout script dynamically
  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);

      const existingScript = document.getElementById("razorpay-script");
      if (existingScript) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.id = "razorpay-script";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!email) {
      setErrorMessage("Please enter your email before continuing.");
      return;
    }

    setIsLoading(true);

    const orderExists = await userOrderExists(email, product.id);
    if (orderExists) {
      setErrorMessage(
        "You have already purchased this product. Try downloading it from the My Orders page."
      );
      setIsLoading(false);
      return;
    }

    const loaded = await loadRazorpay();
    if (!loaded) {
      setErrorMessage("Failed to load Razorpay. Please try again.");
      setIsLoading(false);
      return;
    }

    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_PUBLISHABLE_KEY || "",
      amount,
      currency,
      name: "Your Store Name",
      description: product.name,
      image: "/logo.png",
      order_id: razorpayOrderId,
      handler: function (response: RazorpayResponse) {
        window.location.href = `/razorpay/purchase-success?razorpay_payment_id=${response.razorpay_payment_id}`;
      },
      prefill: {
        email,
      },
      notes: {
        productId: product.id,
        buyerEmail: email,
      },
      theme: {
        color: "#6366f1",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col md:flex-row"
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            {product.name}
          </h2>
          <p className="text-lg font-semibold text-green-600 mb-3">
            {formattedPrice}
          </p>
          <p className="text-gray-600 text-center leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Payment Section */}
        <div className="md:w-1/2 p-6 bg-white">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Complete Your Purchase
          </h1>
          <p className="text-gray-500 text-center mb-6 text-sm">
            💳 Secure payment powered by{" "}
            <span className="font-medium text-gray-800">Razorpay</span>
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 border rounded-xl text-sm"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-white
                    bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500
                    hover:scale-[1.02] hover:shadow-xl active:scale-95
                    transition-all duration-300 ease-in-out"
                >
                  {isLoading ? "Processing..." : `Pay ${formattedPrice}`}
                </button>
                <p className="text-center text-xs text-gray-500">
                  🔒 Your payment is encrypted & secure.
                </p>
              </CardFooter>
            </Card>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
