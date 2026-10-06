import type { Metadata } from "next";
import { getUser } from "@/lib/server";
import { Discuss } from "@/components/dashboard/Discuss";

export const metadata: Metadata = { title: "Discuss" };

export default async function DiscussPage() {
  const user = await getUser();
  return <Discuss user={user} />;
}
