import Purchase from "./Purchase";

interface PageProps {
  params: {
    id: string;
  };
}

export default function PurchasePage({ params }: PageProps) {
  return <Purchase id={params.id} />;
}
