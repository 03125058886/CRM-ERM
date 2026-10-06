import type { Metadata } from "next";
import { Suspense } from "react";
import { getUser } from "@/lib/server";
import { Dashboards } from "@/components/dashboard/Dashboards";

export const metadata: Metadata = { title: "Dashboards" };

export default async function DashboardsPage() {
  const user = await getUser();
  return (
    <Suspense fallback={<div className="h-64 shimmer rounded-2xl" />}>
      <Dashboards installed={user.apps} />
    </Suspense>
  );
}
