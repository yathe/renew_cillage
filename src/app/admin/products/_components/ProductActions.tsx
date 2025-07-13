"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTransition } from "react";
import { deleteProduct, toggleProductAvailability } from "../../_actions/products";
import { useRouter } from "next/navigation";

//  Toggle product's active/inactive state from dropdown
export function ActiveToggleDropdownItem({
  id,
  isAvailableForPurchase
}: { id: string, isAvailableForPurchase: boolean }) {
  //  Track pending async action for UI feedback
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <DropdownMenuItem
      disabled={isPending} //  Disable while updating
      onClick={() => {
        //  Async toggle on background thread
        startTransition(async () => {
          await toggleProductAvailability(id, !isAvailableForPurchase);
          router.refresh(); 
          // refresh page after toggling
          // this will update the product list
          // with the new availability state
        });
      }}
    >
      {/*  Dynamic label */}
      {isAvailableForPurchase ? "Deactivate" : "Activate"}
    </DropdownMenuItem>
  );
}

//  Delete product from dropdown menu
export function DeleteDropdownItem({
  id,
  disabled //  If product has orders, deletion is blocked
}: {
  id: string,
  disabled: boolean
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <DropdownMenuItem
    variant="destructive"
      disabled={disabled || isPending} //  Prevent action if already disabled or loading
      onClick={() => {
        //  Perform delete in background
        startTransition(async () => {
          await deleteProduct(id);
          router.refresh(); // refresh the page after deletion
        });
      }}
    >
      Delete
    </DropdownMenuItem>
  );
}
