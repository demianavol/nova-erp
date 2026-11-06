import type { CSSProperties } from "react";
import {
  metricDisplayUnit,
  metricDisplayValue,
  type CompanyMetricData,
} from "../data/company-metrics";
import { MetricDetails } from "./company-metric-details";
import { MetricMotion } from "./metric-motion";

export function CompanyMetric({
  metric,
  index,
}: {
  metric: CompanyMetricData;
  index: number;
}) {
  return (
    <MetricDetails
      metric={metric}
      className={`lp-metric lp-metric-kind-${index}${index === 3 ? " lp-metric-compact" : ""}`}
      style={{ "--metric-delay": `${index * 100}ms` } as CSSProperties}
    >
      {(engaged) => (
        <>
          <MetricMotion index={index} active={engaged} />
          <div className="lp-metric-number">
            <div className="lp-metric-value">
              <span>{metricDisplayValue(metric)}</span>
            </div>
            <span>{metricDisplayUnit(metric)}</span>
          </div>
          <h3>{metric.label}</h3>
          <p>{metric.detail}</p>
        </>
      )}
    </MetricDetails>
  );
}
