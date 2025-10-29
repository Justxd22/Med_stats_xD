"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { analytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";

export function FirebaseAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    const logPageView = async () => {
      const analyticsInstance = await analytics;
      if (analyticsInstance) {
        logEvent(analyticsInstance, "page_view", {
          page_path: pathname,
          page_title: document.title,
          device_type: window.innerWidth < 768 ? "mobile" : "desktop",
        });
      }
    };
    logPageView();
  }, [pathname]);

  return null;
}
