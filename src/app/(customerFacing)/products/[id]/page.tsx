// src/app/(customerFacing)/products/[id]/page.tsx
import Purchase from "./Purchase";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: `Product ${params.id}`,
  };
}

export default function Page({ params }: { params: { id: string } }) {
  return <Purchase id={params.id} />;
}
