// src/app/(customerFacing)/products/[id]/page.tsx
import Purchase from "./Purchase";

interface ProductPageParams {
  id: string;
}

export default function Page({ params }: { params: ProductPageParams }) {
  return <Purchase id={params.id} />;
}
