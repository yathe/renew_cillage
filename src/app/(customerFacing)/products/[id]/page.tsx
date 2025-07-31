import Purchase from "./Purchase";

// Remove any custom PageProps interface
// Let Next.js infer the types automatically

export default function PurchasePage({
  params,
}: {
  params: { id: string };
}) {
  return <Purchase id={params.id} />;
}
