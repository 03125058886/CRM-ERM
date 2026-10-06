import type { Metadata } from "next";
import { getUser } from "@/lib/server";
import { SettingsForms } from "@/components/dashboard/SettingsForms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getUser();
  return <SettingsForms initialUser={user} />;
}
