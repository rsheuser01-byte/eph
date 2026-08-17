import { RestoreCartClient } from "./RestoreCartClient";

export default async function RestoreCartPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <RestoreCartClient token={token} />;
}
