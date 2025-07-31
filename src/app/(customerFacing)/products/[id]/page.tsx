// src/app/(customerFacing)/products/[id]/page.tsx
import Purchase from "./Purchase";

// Simple object destructuring without custom types
export default function Page({ params }: { params: { id: string } }) {
  return <Purchase id={params.id} />;
}
