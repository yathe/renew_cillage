import Purchase from "./Purchase";

export default function PurchasePage({ params }: { params: { id: string } }) {
  return <Purchase id={params.id} />;
}
