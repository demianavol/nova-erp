import type { CSSProperties } from "react";
import {
  metricDisplayUnit,
  metricDisplayValue,
  type CompanyMetricData,
} from "../data/company-metrics";
import { MetricDetails } from "./company-metric-details";
import { MetricEmblem } from "./metric-emblem";
import { useSiteLanguage } from "../lib/site-language";

export function CompanyMetric({
  metric,
  index,
}: {
  metric: CompanyMetricData;
  index: number;
}) {
  const { t } = useSiteLanguage();
  const unit = t(metricDisplayUnit(metric));
  return (
    <MetricDetails
      metric={metric}
      className={`lp-metric lp-metric-kind-${index}`}
      style={{ "--metric-delay": `${index * 100}ms` } as CSSProperties}
    >
      {(engaged) => (
        <>
          <MetricEmblem kind={metric.icon} active={engaged} />
          <div className="lp-metric-number">
            <div className="lp-metric-value">{metricDisplayValue(metric)}</div>
            {unit && <span className="lp-metric-unit">{unit}</span>}
          </div>
          <h3>{t(metric.label)}</h3>
        </>
      )}
    </MetricDetails>
  );
}
