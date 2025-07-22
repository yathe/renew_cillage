import { ProductCard, ProductCardSkeleton } from "@/app/components/ProductCard"
import db from "@/db/db"
import { cache } from "@/lib/cache"
import { Suspense } from "react"

//  Fetch products that are available for purchase, sorted alphabetically
const getProducts = cache(()=> {
  return db.product.findMany({
    where: { isAvailableForPurchase: true }, //  Only active products
    orderBy: { name: "asc" },                //  Sort them A → Z
  })
},["/products","getProducts"])

//  Products page: shows all products in a grid
export default function ProductsPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/*  Suspense is like a curtain—while data loads, show skeletons */}
      <Suspense
        fallback={
          <>
            <ProductCardSkeleton /> {/*  Placeholder #1 */}
            <ProductCardSkeleton /> {/*  Placeholder #2 */}
            <ProductCardSkeleton /> {/*  Placeholder #3 */}
            <ProductCardSkeleton /> 
            <ProductCardSkeleton /> 
            <ProductCardSkeleton /> 
          </>
        }
      >
        {/*  Once data arrives, render the real product cards */}
        <ProductSuspense />
      </Suspense>
    </div>
  )
}

//  Async component: fetch products then map them to cards
async function ProductSuspense() {
  const products = await getProducts() //  Wait for products from DB
  //  Transform each product into a beautiful card
  return products.map(product => <ProductCard key={product.id} {...product} />)
}