// src/app/(customerFacing)/products/[id]/page.tsx
import Purchase from "./Purchase";

// Simple interface without extending Next.js types
interface ProductPageProps {
  params: {
    id: string;
  };
}

export default function Page({ params }: ProductPageProps) {
  return <Purchase id={params.id} />;
}

// Remove any custom type declarations from next.d.ts
