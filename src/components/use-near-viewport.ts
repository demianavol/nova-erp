import { useEffect, useState, type RefObject } from "react";

export function useNearViewport(ref: RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "480px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return near;
}
