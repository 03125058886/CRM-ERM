import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { APP_BY_ID, moduleFor } from "@nexora/shared";
import { getUser } from "@/lib/server";
import { RecordForm } from "@/components/dashboard/RecordForm";

export async function generateMetadata({ params }: { params: Promise<{ app: string; recordId: string }> }): Promise<Metadata> {
  const { app, recordId } = await params;
  const a = APP_BY_ID[app];
  return { title: a ? `${recordId === "new" ? `New ${moduleFor(app).noun.toLowerCase()}` : moduleFor(app).noun} · ${a.name}` : "Record" };
}

export default async function RecordPage({ params }: { params: Promise<{ app: string; recordId: string }> }) {
  const { app: appId, recordId } = await params;
  const app = APP_BY_ID[appId];
  if (!app) notFound();
  if (recordId !== "new" && !/^\d+$/.test(recordId)) notFound();
  const user = await getUser();
  if (!user.apps.includes(appId)) redirect(`/dashboard?install=${appId}`);
  return (
    <Suspense fallback={<div className="h-64 shimmer rounded-2xl" />}>
      <RecordForm app={app} recordId={recordId === "new" ? null : Number(recordId)} />
    </Suspense>
  );
}
