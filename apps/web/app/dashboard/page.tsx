import { Suspense } from "react";
import { getUser } from "@/lib/server";
import { HomeMenu } from "@/components/dashboard/HomeMenu";
import { InstallPrompt } from "@/components/dashboard/InstallPrompt";

export default async function DashboardPage() {
  const user = await getUser();
  return (
    <>
      <HomeMenu user={user} />
      <Suspense><InstallPrompt /></Suspense>
    </>
  );
}
