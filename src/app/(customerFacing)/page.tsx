import { Button } from "@/components/ui/button"
import db from "@/db/db"
import { Product } from "@prisma/client"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard"
import { cache } from "@/lib/cache"

//  Grab the most-loved products (sorted by order count)
const getMostPopularProducts = cache(() => {
  // await wait(1000) //  Pretend we’re waiting for a real server
  return db.product.findMany({
    where: { isAvailableForPurchase: true }, //  Only show products you can actually buy
    orderBy: { orders: { _count: "desc" } }, //  Rank them by popularity (most orders first)
    take: 6, //  Show only top 6
  })
}, ["/","getMostPopularProducts"], 
{ revalidate: 60 * 60 * 24}) // cache the result for 24 hours // to avoid hitting the database to often


//  Grab the freshest products (sorted by creation date)
const getNewestProducts= cache(() => {
  // await wait(2000) //  Slightly longer wait to simulate API latency
  return db.product.findMany({
    where: { isAvailableForPurchase: true }, // ✅ Only show active products
    orderBy: { createdAt: "desc" }, //  Newest first
    take: 6, //  Show only top 6
  })
}, ["/","getNewestProducts"])

//  A tiny helper to pause execution (to demo loading states)
// function wait(duration: number) {
//   return new Promise(resolve => setTimeout(resolve, duration))
// }

//  The homepage orchestrator
export default function HomePage() {
  return (
    <main className="space-y-12">
      {/*  First section: top-selling products */}
      <ProductGridSection
        title="Most Popular"
        productsFetcher={getMostPopularProducts}
      />

      {/*  Second section: latest arrivals */}
      <ProductGridSection
        title="Newest"
        productsFetcher={getNewestProducts}
      />
    </main>
  )
}

type ProductGridSectionProps = {
  title: string
  productsFetcher: () => Promise<Product[]>
}

//  A reusable product showcase section
function ProductGridSection({ productsFetcher, title }: ProductGridSectionProps) {
  return (
    <div className="space-y-4 px-8">
      {/*  Section heading + quick link to see everything */}
      <div className="flex gap-4">
        <h2 className="text-3xl font-bold">{title}</h2>
        {/*  Button magically behaves as a Link (thanks to asChild) */}
        <Button variant="outline" asChild>
          <Link href="/products" className="space-x-2">
            <span>View All</span>
            <ArrowRight className="size-4" /> {/*  Cute little arrow */}
          </Link>
        </Button>
      </div>

      {/*  Responsive grid that adapts to screen size */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/*  Suspense is like a stage curtain—shows skeletons while real data loads */}
        <Suspense
          fallback={
            <>
              <ProductCardSkeleton /> {/*  Skeleton #1 */}
              <ProductCardSkeleton /> {/*  Skeleton #2 */}
              <ProductCardSkeleton /> {/*  Skeleton #3 */}
            </>
          }
        >
          {/*  Once data arrives, paint the cards on screen */}
          <ProductSuspense productsFetcher={productsFetcher} />
        </Suspense>
      </div>
    </div>
  )
}

//  Fetch products then render them as cards
async function ProductSuspense({
  productsFetcher,
}: {
  productsFetcher: () => Promise<Product[]>
}) {
  //  Call the fetcher, then map each product into a beautiful card
  return (await productsFetcher()).map(product => (
    <ProductCard key={product.id} {...product} />
  ))
}
