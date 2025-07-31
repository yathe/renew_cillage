// src/app/(customerFacing)/products/[id]/page.tsx
import Purchase from "./Purchase";

// Remove all custom type extensions and use simple props
export default function Page({
  params,
}: {
  params: {
    id: string;
  };
}) {
  return <Purchase id={params.id} />;
}
