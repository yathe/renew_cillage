import Purchase from "./Purchase";

// Remove any PageProps imports or declarations
// Keep it simple with inline types

export default function Page({
  params,
}: {
  params: {
    id: string;
  };
}) {
  return <Purchase id={params.id} />;
}
