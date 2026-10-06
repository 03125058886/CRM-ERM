import type { Metadata } from "next";
import { getUser } from "@/lib/server";
import { ContactsView } from "@/components/dashboard/ContactsView";

export const metadata: Metadata = { title: "Contacts" };

export default async function ContactsPage() {
  await getUser();
  return <ContactsView />;
}
