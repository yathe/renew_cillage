import Purchase from "./Purchase";
import { PageProps } from 'next/app';

export default function PurchasePage({
  params,
}: {
  params: { id: string };
}) {
  return <Purchase id={params.id} />;
}
