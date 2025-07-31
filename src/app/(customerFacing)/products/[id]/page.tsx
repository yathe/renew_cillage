// src/app/(customerFacing)/products/[id]/page.tsx
import Purchase from "./Purchase";

// Use inline type definition without extending anything
export default function Page({
  params,
}: {
  params: {
    id: string;
  };
}) {
  return <Purchase id={params.id} />;
}
