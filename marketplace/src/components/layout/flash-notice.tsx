"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";

/** Messages shown after a redirect, keyed by the `?notice=` query parameter. */
const NOTICES: Record<string, string> = {
  "welcome-client":
    "Welcome! Your client account is ready. Post a project to start receiving proposals.",
  "welcome-freelancer":
    "Welcome! Set up your profile so clients can find you and you can send proposals.",
  "signed-out": "You've been logged out.",
  "project-posted": "Your project is live. Freelancers can now send proposals.",
  "project-updated": "Project updated.",
  "proposal-sent": "Proposal sent! You can track its status from your dashboard.",
};

export function FlashNotice() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const code = params.get("notice");

  useEffect(() => {
    if (!code) return;
    const message = NOTICES[code];
    if (message) toast(message, code === "signed-out" ? "info" : "success");
    // Remove the parameter so a refresh doesn't repeat the message.
    const next = new URLSearchParams(params.toString());
    next.delete("notice");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [code, params, pathname, router, toast]);

  return null;
}
