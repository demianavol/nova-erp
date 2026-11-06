import {
  companyMetrics,
  metricDisplayUnit,
  metricDisplayValue,
} from "../data/company-metrics";
import { MetricDetails } from "./company-metric-details";

function EvidenceIcon({ kind }: { kind: string }) {
  return (
    <svg
      className="evidence-icon"
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "trophy" ? (
        <>
          <g className="evidence-cup">
            <path
              pathLength="1"
              d="M11 6h18v10a9 9 0 0 1-18 0V6ZM11 9H5v5c0 5 3 7 8 7M29 9h6v5c0 5-3 7-8 7"
            />
            <path pathLength="1" d="M20 25v8M13 34h14" />
          </g>
          <path
            className="evidence-glint"
            d="m31 2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"
          />
        </>
      ) : kind === "star" ? (
        <path
          className="evidence-star"
          pathLength="1"
          d="m20 4 4.8 10 11 1.6-8 7.8 1.9 11L20 29.2l-9.7 5.2 1.9-11-8-7.8 11-1.6Z"
        />
      ) : (
        <path
          className="evidence-heart"
          pathLength="1"
          d="M20 34 6 20C-4 8 11-1 20 10 29-1 44 8 34 20Z"
        />
      )}
    </svg>
  );
}

export function EvidenceMetrics() {
  return (
    <div
      className="lp-results-evidence"
      role="group"
      aria-label="Достижения и обратная связь по всем брендам компании"
    >
      {companyMetrics.slice(4).map((metric) => {
        return (
          <MetricDetails
            key={metric.id}
            metric={metric}
            className={`lp-evidence-item evidence-${metric.icon}`}
          >
            <span className="evidence-motion">
              <EvidenceIcon kind={metric.icon} />
              <span className="evidence-copy">
                <strong>
                  {metricDisplayValue(metric)} {metricDisplayUnit(metric)}
                </strong>
                <span className="lp-evidence-label">{metric.label}</span>
                <small>{metric.detail}</small>
              </span>
            </span>
          </MetricDetails>
        );
      })}
    </div>
  );
}
