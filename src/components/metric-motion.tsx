export function MetricMotion({ index }: { index: number }) {
  return (
    <svg
      viewBox="0 0 96 58"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lp-metric-motion lp-metric-motion-${index}`}
      aria-hidden="true"
    >
      {index === 0 && (
        <>
          <g className="mm-person mm-person-left">
            <circle cx="24" cy="22" r="6" />
            <path d="M13 44v-5a11 11 0 0 1 22 0v5" />
          </g>
          <g className="mm-person mm-person-right">
            <circle cx="72" cy="22" r="6" />
            <path d="M61 44v-5a11 11 0 0 1 22 0v5" />
          </g>
          <g className="mm-person mm-person-center">
            <circle cx="48" cy="18" r="8" />
            <path d="M34 46v-7a14 14 0 0 1 28 0v7" />
          </g>
        </>
      )}
      {index === 1 && (
        <>
          <g className="mm-shopping-bag">
            <path d="M31 21h34l3 29H28Z" />
            <path d="M39 24V16a9 9 0 0 1 18 0v8" />
            <path
              className="mm-order-confirm"
              pathLength="1"
              d="m41 36 5 5 10-11"
            />
          </g>
        </>
      )}
      {index === 2 && (
        <>
          <rect
            className="mm-brand mm-brand-one"
            x="25"
            y="9"
            width="32"
            height="40"
            rx="4"
          />
          <rect
            className="mm-brand mm-brand-two"
            x="32"
            y="9"
            width="32"
            height="40"
            rx="4"
          />
          <g className="mm-brand mm-brand-three">
            <rect x="39" y="9" width="32" height="40" rx="4" />
            <path d="M48 20h14M48 27h9M48 38h14" />
          </g>
        </>
      )}
      {index === 3 && (
        <>
          <path className="mm-grid" d="M12 11v37h71M12 35h71M12 22h71" />
          <path
            className="mm-growth"
            pathLength="1"
            d="m18 40 17-10 14 4 25-23"
          />
          <path className="mm-growth-tip" d="M63 11h11v11" />
          <circle className="mm-growth-point" cx="74" cy="11" r="3" />
        </>
      )}
    </svg>
  );
}
