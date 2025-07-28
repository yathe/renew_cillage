// src/app/(customerFacing)/track/[orderId]/page.tsx
import { Suspense } from 'react'
import { use } from 'react'
import TrackOrderClient from './TrackOrderClient'

export default function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  // Using the use hook to unwrap the promise
  const { orderId } = use(params)

  return (
    <Suspense fallback={<div>Loading tracking information...</div>}>
      <TrackOrderClient orderId={orderId} />
    </Suspense>
  )
}