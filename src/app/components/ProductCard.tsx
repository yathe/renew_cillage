import Link from "next/link"
import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ProductCardProps = {
  id: string
  name: string
  priceInCents: number
  description: string
  imagePath: string
}

export function ProductCard({
  id,
  name,
  priceInCents,
  description,
  imagePath,
}: ProductCardProps) {
  return (
    <Card
      className="
        flex flex-col overflow-hidden
        rounded-2xl shadow-lg
        /* ✨ Beautiful gradient background matching theme */
        bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100
        dark:from-gray-800 dark:via-gray-700 dark:to-gray-600
        hover:shadow-2xl hover:scale-[1.02] transition-all duration-300
      "
    >
      {/* 🌟 Product image with rounded top and auto height */}
      <div className="relative w-full aspect-video">
        <Image
          src={imagePath}
          fill
          alt={name}
          className="object-cover"
        />
      </div>

      {/* 🏷️ Product title and price section */}
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
          {name}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          ${priceInCents / 100}
        </CardDescription>
      </CardHeader>

      {/* ✍️ Product description section */}
      <CardContent className="flex-grow px-4 sm:px-6 pb-4 sm:pb-6">
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 line-clamp-4">
          {description}
        </p>
      </CardContent>

      {/* 🛒 Purchase button */}
      <CardFooter className="p-4 sm:p-6">
        <Button
          asChild
          size="lg"
          className="
            w-full rounded-xl text-base font-semibold
            bg-gradient-to-r from-purple-500 to-pink-500 text-white
            hover:from-pink-500 hover:to-purple-500
            transition-all duration-300
          "
        >
          <Link href={`/products/${id}`}>Purchase</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card
      className="
        overflow-hidden flex flex-col animate-pulse
        rounded-2xl
        /* ✨ Matching gradient skeleton background */
        bg-gradient-to-br from-gray-200 via-gray-100 to-gray-50
        dark:from-gray-700 dark:via-gray-800 dark:to-gray-900
      "
    >
      {/* 🖼️ Placeholder image area */}
      <div className="w-full aspect-video bg-gray-300 dark:bg-gray-600" />

      {/* 🏷️ Placeholder title and price */}
      <CardHeader className="p-4 sm:p-6 space-y-2">
        <CardTitle>
          <div className="w-3/4 h-6 rounded-full bg-gray-300 dark:bg-gray-600" />
        </CardTitle>
        <CardDescription>
          <div className="w-1/2 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
        </CardDescription>
      </CardHeader>

      {/* ✍️ Placeholder description */}
      <CardContent className="space-y-2 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="w-full h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
        <div className="w-full h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
        <div className="w-3/4 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
      </CardContent>

      {/* 🛒 Placeholder button */}
      <CardFooter className="p-4 sm:p-6">
        <Button
          className="w-full h-10 rounded-xl"
          disabled
          size="lg"
        ></Button>
      </CardFooter>
    </Card>
  )
}
