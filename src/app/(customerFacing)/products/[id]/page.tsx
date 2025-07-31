import Purchase from "./Purchase";
import { Metadata } from 'next';

// Use this exact type definition
type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Purchase Product ${params.id}`,
  };
}

export default function PurchasePage({ params }: PageProps) {
  return <Purchase id={params.id} />;
}
