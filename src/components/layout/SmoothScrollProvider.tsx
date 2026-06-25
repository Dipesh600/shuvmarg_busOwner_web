"use client";

import { useEffect } from "react";

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    (async () => {
      try {
        const LocomotiveScroll = (await import("locomotive-scroll")).default;
        
        // Initialize Locomotive Scroll
        // We only instantiate it if it hasn't been instantiated yet
        const locomotiveScroll = new LocomotiveScroll({
          lenisOptions: {
            smoothTouch: false,
          },
        });
        
        return () => {
          if (locomotiveScroll) locomotiveScroll.destroy();
        };
      } catch (error) {
        console.error("Failed to initialize Locomotive Scroll", error);
      }
    })();
  }, []);

  return <>{children}</>;
}
