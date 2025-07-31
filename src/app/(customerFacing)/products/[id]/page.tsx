import Purchase from "./Purchase";
import { Metadata } from 'next';

interface Props {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Purchase Product ${params.id}`,
  };
}

export default function PurchasePage({ params }: Props) {
  return <Purchase id={params.id} />;
}
