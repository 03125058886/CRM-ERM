import type { Metadata } from "next";
import { Suspense } from "react";
import { getUser } from "@/lib/server";
import { AppStore } from "@/components/dashboard/AppStore";

export const metadata: Metadata = { title: "Apps" };

export default async function AppsPage() {
  const user = await getUser();
  return (
    <Suspense fallback={<div className="h-64 shimmer rounded-2xl" />}>
      <AppStore initialUser={user} />
    </Suspense>
  );
}
