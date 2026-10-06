import { getUser } from "@/lib/server";
import { AppsManager } from "@/components/dashboard/AppsManager";

export default async function DashboardPage() {
  const user = await getUser();
  return <AppsManager initialUser={user} />;
}
