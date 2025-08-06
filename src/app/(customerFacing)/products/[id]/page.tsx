
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckoutForm } from "./_components/CheckOutForm";
import type { Product } from "@prisma/client";

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [order, setOrder] = useState<RazorpayOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Product ID missing");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/create-order/${id}`, { method: "POST" });
        if (!res.ok) {
          setError("Failed to create order");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProduct(data.product);
        setOrder(data.order);
      } catch  {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!product || !order) return <p>Something went wrong. Please try again.</p>;

  return (
    <CheckoutForm
      product={product}
      razorpayOrderId={order.id}
      amount={order.amount}
      currency={order.currency}
    />
  );

// src/app/(customerFacing)/products/[id]/page.tsx


// Use inline type definition without extending anything
}
