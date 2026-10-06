import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { APP_BY_ID } from "@nexora/shared";
import { getUser } from "@/lib/server";
import { Workspace } from "@/components/dashboard/Workspace";

export async function generateMetadata({ params }: { params: Promise<{ app: string }> }): Promise<Metadata> {
  const { app } = await params;
  return { title: APP_BY_ID[app]?.name ?? "App" };
}

export default async function AppPage({ params }: { params: Promise<{ app: string }> }) {
  const { app: appId } = await params;
  const app = APP_BY_ID[appId];
  if (!app) notFound();
  const user = await getUser();
  if (!user.apps.includes(appId)) redirect(`/dashboard?install=${appId}`);
  return (
    <Suspense fallback={<div className="h-64 shimmer rounded-2xl" />}>
      <Workspace app={app} />
    </Suspense>
  );
}
