"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_BY_ID } from "@zuvora/shared";
import { useToast } from "@/components/Toast";

/** /dashboard?install=crm → send the user to the Apps store with that app highlighted. */
export function InstallPrompt() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  useEffect(() => {
    const id = params.get("install");
    if (id && APP_BY_ID[id]) {
      toast(`${APP_BY_ID[id].name} is not installed yet. Install it from Apps.`, "info");
      router.replace(`/dashboard/apps?highlight=${id}`);
    }
  }, [params, router, toast]);
  return null;
}
