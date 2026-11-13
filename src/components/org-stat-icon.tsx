import { useEffect, useRef, useState } from "react";

const layers = {
  employees: [],
  departments: ["departments-teal", "departments-violet", "departments-blue"],
  leaders: ["leaders-star"],
  vacancies: ["vacancies-chair", "vacancies-plus"],
} as const;

type StatIcon = keyof typeof layers;

export function OrgStatIcon({ icon }: { icon: StatIcon }) {
  const [ready, setReady] = useState(layers[icon].length === 0);
  const scene = useRef<HTMLSpanElement>(null);
  const assetRoot = `${import.meta.env.BASE_URL}media/org-stat-icons/`;

  useEffect(() => {
    const images = Array.from(scene.current?.querySelectorAll("img") ?? []);
    if (!images.length) return;
    let mounted = true;
    void Promise.all(images.map((image) => image.decode()))
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [icon]);

  return (
    <span
      className="erp-org-stat-icon"
      data-icon={icon}
      data-ready={ready}
      aria-hidden="true"
    >
      <img
        className="erp-org-stat-poster"
        src={`${assetRoot}${icon}.webp`}
        width={36}
        height={36}
        alt=""
      />
      {layers[icon].length > 0 && (
        <span className="erp-org-stat-scene" ref={scene}>
          {layers[icon].map((layer) => (
            <img
              key={layer}
              className={`erp-org-stat-${layer}`}
              src={`${assetRoot}${layer}.webp`}
              width={36}
              height={36}
              alt=""
            />
          ))}
          {icon === "leaders" && <span className="erp-org-stat-spark" />}
        </span>
      )}
    </span>
  );
}
