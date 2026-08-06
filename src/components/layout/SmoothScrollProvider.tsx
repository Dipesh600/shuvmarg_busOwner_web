"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Disable smooth scroll library on dashboard routes so web application containers scroll natively
    if (pathname?.startsWith("/dashboard")) {
      return;
    }

    let locomotiveScroll: any = null;

    (async () => {
      try {
        const LocomotiveScroll = (await import("locomotive-scroll")).default;
        
        locomotiveScroll = new LocomotiveScroll({
          lenisOptions: {
            smoothTouch: false,
          } as any,
        });
      } catch (error) {
        console.error("Failed to initialize Locomotive Scroll", error);
      }
    })();

    return () => {
      if (locomotiveScroll) locomotiveScroll.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
