import Purchase from "./Purchase";

export default function Page({
  params,
}: {
  params: { id: string };
}) {
  return <Purchase id={params.id} />;
}
