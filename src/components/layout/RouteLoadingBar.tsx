import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

/**
 * Thin progress bar pinned to the top of the viewport while a Next.js page
 * transition is in flight (sidebar nav, redirects, etc). Pages router doesn't
 * show any built-in feedback between routeChangeStart and the new page
 * actually painting, which reads as the app being unresponsive on slower
 * connections -- this fills that gap.
 */
const RouteLoadingBar: React.FC = () => {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };

    const start = () => {
      clearTimers();
      setVisible(true);
      setProgress(12);
      intervalRef.current = setInterval(() => {
        setProgress((p) => (p < 85 ? p + Math.random() * 10 : p));
      }, 200);
    };

    const done = () => {
      clearTimers();
      setProgress(100);
      hideTimeoutRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    };

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError", done);

    return () => {
      clearTimers();
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError", done);
    };
  }, [router]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 2000,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "#1E3A8A",
          boxShadow: "0 0 8px rgba(30,58,138,0.6)",
          transition: "width 200ms ease, opacity 250ms ease",
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
};

export default RouteLoadingBar;
