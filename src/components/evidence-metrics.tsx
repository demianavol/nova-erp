import { useSiteLanguage } from "../lib/site-language";
import {
  type CompanyMetricData,
  metricDisplayUnit,
  metricDisplayValue,
} from "../data/company-metrics";
import { MetricDetails } from "./company-metric-details";

import { MetricEmblem } from "./metric-emblem";

export function EvidenceMetrics({
  metrics,
}: {
  metrics: readonly CompanyMetricData[];
}) {
  const { t } = useSiteLanguage();
  return (
    <div
      className="lp-results-evidence"
      role="group"
      aria-label={t("Достижения и обратная связь по всем брендам компании")}
    >
      {metrics.map((metric) => {
        return (
          <MetricDetails
            key={metric.id}
            metric={metric}
            className={`lp-evidence-item evidence-${metric.icon}`}
          >
            {(engaged) => (
              <span className="evidence-motion">
                <MetricEmblem kind={metric.icon} active={engaged} />
                <span className="evidence-copy">
                  <strong>
                    {t(metricDisplayValue(metric))}{" "}
                    {t(metricDisplayUnit(metric))}
                  </strong>
                  <span className="lp-evidence-label">{t(metric.label)}</span>
                </span>
              </span>
            )}
          </MetricDetails>
        );
      })}
    </div>
  );
}
