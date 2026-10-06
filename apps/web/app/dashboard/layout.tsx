import type { Metadata } from "next";
import { getUser } from "@/lib/server";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
