import type { Metadata } from "next";
import { getUser } from "@/lib/server";
import { CalendarView } from "@/components/dashboard/CalendarView";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  await getUser();
  return <CalendarView />;
}
