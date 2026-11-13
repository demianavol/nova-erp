import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export function ThoughtLine({ label }: { label: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((performance.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="erp-thought-line" role="status">
      <Sparkles size={17} aria-hidden="true" />
      <span>{label}</span>
      {elapsed > 0 && (
        <time aria-hidden="true" dateTime={`PT${elapsed}S`}>
          {elapsed} с
        </time>
      )}
    </div>
  );
}
