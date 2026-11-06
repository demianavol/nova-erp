# Компания в цифрах

The section preserves the four main and three secondary metrics. All seven use
`MetricDetails` in `src/components/company-metric-details.tsx`, coordinated by a
single provider. Floating UI handles positioning, portal rendering, hover travel,
keyboard focus, dismissal, and viewport collisions ([Floating UI documentation](https://floating-ui.com/docs/react)). The statistics panel stylesheet
owns light/dark tokens because the portal sits outside `.landing`.

Cards show all-time company figures by default (`periodKind: "all-time"`).
Their hover/focus state plays the original icons without opening a panel.
Only the 44px info target opens the 320px compact panel; click/tap pins it.
Positioning is anchored to the entire card, with right/left/bottom/top fallbacks,
so the active card's icon remains unobstructed. Escape and outside presses dismiss.

## Management approval

`src/data/company-metrics.ts` is the single source for the statistics section.
The approved-data definitions in `companyMetricDefinitions` have `value: null`
and `verification: "pending"`. No historical number is published as a verified aggregate.

At the user's request, `companyMetricsMode` is currently `"demo"`: the prototype
displays **synthetic test figures**, with an explicit section caption, individual
panel badges, demonstration periods, and a test source. This dataset is separate
from the pending definitions and historical observations. Set the mode to
`"pending"` to show em dashes again. Demo achievements use fictional brand names
and preserve each example's category, marketplace, period, and source. The main
achievement value counts three separate examples; it does not add their rankings.
The demo covers 2020 through 02.11.2026: 380,000 deduplicated customers, 717,000
orders, four historical brands (two active), 310,000 ratings and a weighted 4.8/5.
`demoYearlyActivity` is a complete synthetic series, separate from historical
evidence. 2026 is explicitly partial. Revenue growth compares the first and latest
completed full years, 2020 and 2025, with yearly comparisons in the panel.

To publish a company figure, supply the approved `value`, `unit`, `period`, `source`
and `explanation`, then set `verification: "verified"`. Record actual reporting
dates rather than the website update date. Keep the scope company-wide. Populate
`yearlyBreakdown` separately from the all-time value; it is explanatory, not a filter.

- Customers: deduplicate people across all brands, channels, and years. The yearly
  demo rows are **new** customers, not recurring annual audiences that can overlap.
- Orders: use a complete company-wide dataset and agreed cancellation/return rules.
- Brands: populate `brandCounts.historical` and `brandCounts.active` separately;
  `value` is the historical count alone. Use `detail` for the active count and include
  the snapshot date. Never format the main number as a historical/active ratio.
- Revenue growth: compare two explicitly dated, comparable periods from approved
  financial reports. The presentation's turnover range is not verified revenue growth.
- Achievements: populate `marketplaceAchievements` with individually verified records
  retaining their brand, category, marketplace, period and source. Use an approved
  descriptive summary for `value`; never add rankings together.
- Rating: require full coverage, compatible scales, rating counts as weights, and
  deduplication of grouped product variants. Do not average the available snapshots.
- Customer ratings: count ratings across all brands without duplicating shared
  counters. Written reviews require a separate definition; likes are neither.

The prototype caption should remain while any figure is pending or synthetic.
Every panel independently communicates its verification status.
Secondary footnotes state the all-time scope; yearly context lives in the info
panel. The section caption and panel footer retain demo labeling.
The original icon sequences replay on interaction: people, bag, brand cards,
growth chart, trophy, star and heart. Numbers remain stable, and reduced-motion
preferences disable these sequences and panel transitions.

## Historical evidence

`historicalMetricSources` retains presentation claims (2 млн+, 2,7 млн+, 3 brands,
50–100% turnover growth, top-5% Wildberries suppliers) as **unverified** observations.
The presentation does not establish the ranking's brand, category or date, so these
remain unknown; they must not be inferred from Enmoone's product snapshot.

Product observations retain their product/brand scope and 29.10.2026 snapshot:
4.9/5 and 25,943 ratings for the striped shirt, and 3,418 likes for Enmoone. They are
`source-observed`, not company aggregates. Other product records remain unchanged
in `src/data/product-evidence.ts`. The archive is not an aggregation input.
