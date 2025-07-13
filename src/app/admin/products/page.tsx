import { Button } from "@/components/ui/button";
import { PageHeader } from "../_components/PageHeader";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import db from "@/db/db";
import { CheckCircle2, MoreVertical, XCircle } from "lucide-react";
import { formatNumber } from "@/lib/formatters";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  ActiveToggleDropdownItem,
  DeleteDropdownItem
} from "./_components/ProductActions";

//  Admin Products Page
export default function AdminProductPage() {
  return (
    <>
      {/*  Header with CTA */}
      <div className="flex items-center justify-between mb-6">
        <PageHeader>Products</PageHeader>
        <Button
          asChild
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2 shadow-sm transition"
        >
          <Link href="/admin/products/new">+ Add Product</Link>
        </Button>
      </div>

      {/* 📋 Product table */}
      <ProductsTable />
    </>
  );
}

//  Product listing table
async function ProductsTable() {
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      priceInCents: true,
      isAvailableForPurchase: true,
      _count: { select: { orders: true } }
    },
    orderBy: { name: "asc" }
  });

  if (products.length === 0) {
    return (
      <div className="mt-8 text-center text-gray-500 text-sm">
        No products found. Try adding one.
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-0 text-center">
              <span className="sr-only">Status</span>
            </TableHead>
            <TableHead className="text-gray-600 text-sm font-medium">Name</TableHead>
            <TableHead className="text-gray-600 text-sm font-medium">Price</TableHead>
            <TableHead className="text-gray-600 text-sm font-medium">Orders</TableHead>
            <TableHead className="w-0 text-center">
              <span className="sr-only">Actions</span>
            </TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              className="hover:bg-gray-50 transition"
            >
              {/*  Availability Icon */}
              <TableCell className="text-center">
                {product.isAvailableForPurchase ? (
                  <CheckCircle2 className="text-green-500 w-5 h-5 mx-auto" />
                ) : (
                  <XCircle className="text-red-500 w-5 h-5 mx-auto" />
                )}
              </TableCell>

              {/*  Name */}
              <TableCell className="font-medium text-gray-800">
                {product.name}
              </TableCell>

              {/*  Price */}
              <TableCell className="text-gray-700">
                ₹{product.priceInCents}
              </TableCell>

              {/*  Orders */}
              <TableCell className="text-gray-600">
                {formatNumber(product._count.orders)}
              </TableCell>

              {/*  Actions dropdown */}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 transition focus:outline-none">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                    <span className="sr-only">Actions</span>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-44 rounded-lg shadow-lg">
                    {/* ⬇ Download */}
                    <DropdownMenuItem asChild>
                      <a
                        href={`/admin/products/${product.id}/download`}
                        download
                        className="cursor-pointer"
                      >
                        Download
                      </a>
                    </DropdownMenuItem>

                    {/*  Edit */}
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        Edit
                      </Link>
                    </DropdownMenuItem>

                    {/*  Toggle Active/Inactive */}
                    <ActiveToggleDropdownItem
                      id={product.id}
                      isAvailableForPurchase={product.isAvailableForPurchase}
                    />

                    <DropdownMenuSeparator />

                    {/*  Delete */}
                    <DeleteDropdownItem
                      id={product.id}
                      disabled={product._count.orders > 0}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
