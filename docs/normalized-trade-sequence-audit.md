# Normalized trade sequence audit and design

Audited on 2026-09-12 before implementation.

## Current flow

All dedicated import adapters produce `lib/import/normalizedTrade.ts::NormalizedTrade`, a rich transient import shape. `AnalyzerWizard` immediately converts that shape to the legacy analyzer `Trade`, deduplicates it, calculates `FullMetrics`, and discards the imported array. Generic CSV follows the same legacy `Trade` path directly. The v2 payload persists `FullMetrics` plus compatibility projections, but no real trade sequence. Consequently, saved reports can currently supply Prop Firm only with a histogram reconstruction.

## Fields actually available

| Input | Closed time | Open time | Profit | Symbol | Side | Size | Prices / SL / TP | Commission / swap | Balance / equity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Generic CSV / mapped CSV | Required column, but invalid values currently fall back to current time | Only manual mapping | Direct profit or price-derived result | Optional | Manual mapping only | Optional | Optional through mapping | Not parsed | Not parsed |
| MT5 CSV through legacy parser | Deal time | Not reconstructed from Deals rows | Profit | Optional | Entry/exit leg metadata is filtered; side is not retained reliably | Optional | Price only in rich HTML adapter | CSV wrapper currently sets commission/swap to zero; HTML reads them | Export may contain balance, but it is currently discarded; no equity snapshots |
| MT4 CSV/HTML | Close time (or open time fallback in HTML variants) | Available when supplied | Profit | Available | Available | Available | Available when supplied | Available transiently | Not parsed |
| Binance Futures | API trade time | Same API trade time | Realized P&L | Available | Available | Available | Fill price; no exit pairing | Commission transiently available | Account balances are queried for discovery only, not per-trade snapshots; no equity |
| Binance Spot | Order fill time | Same order fill time | Signed quote cash flow, not paired realized P&L | Available | Available | Available | Average fill price | Commission transiently available | No per-trade balance/equity |

External IDs, broker tickets, account IDs and source metadata exist transiently in some paths. They are used for import/deduplication where applicable and must not be persisted for simulation. Comments and broker notes are not parsed.

Broker/platform timestamps are normalized to JavaScript `Date`, frequently as UTC, but the originating server timezone is not persisted. Therefore calendar grouping is higher fidelity than synthetic grouping but cannot claim exact alignment with every firm's reset timezone.

## Chosen stable simulation model

The analyzer will expose an independent minimal `NormalizedSimulationTrade` with `index`, `profit`, optional `closedAt`, and optional `openedAt`. Balance/equity, symbol, side and size are deliberately absent because the current persisted simulation does not consume them consistently and no real intraday equity series exists.

The v2 `FullMetrics` payload will receive optional `simulationData: { version: 1, trades: [...] }`. On disk, trades use compact tuples `[profit, closedAtEpochMs?, openedAtEpochMs?]`; array position is the stable order/index. This avoids a DB migration, keeps historical payloads valid, and avoids persisting identifiers or broker metadata.

## Compatibility and simulation

New analyses build the sequence directly from the deduplicated parsed trades. Historical payloads without `simulationData` continue through `histogramApproximation`; no synthetic backfill is performed. The Prop Firm adapter prefers a valid sequence and otherwise uses the existing histogram.

Real timestamps enable UTC calendar-day blocks and real observed trades-per-day for Prop Firm bootstrap paths. Missing timestamps keep the existing synthetic `tradesPerDayEstimate`. Static and trailing loss operate on closed cumulative outcomes. Daily loss remains approximate because there is no floating/intraday equity and source timezone may differ from firm reset timezone. General Monte Carlo remains unchanged.

## Measured payload size

Measured with complete `calcFullMetrics`/v2 payloads and hourly timestamped trades:

| Trades | Before sequence | With compact sequence | Delta |
| --- | ---: | ---: | ---: |
| 140 | 50,333 bytes | 52,965 bytes | 2,632 bytes |
| 500 | 75,458 bytes | 84,750 bytes | 9,292 bytes |

The sequence itself is compact; the majority of the payload already comes from existing metrics. Because the anonymous transport guard was 51,200 bytes, it could already reject larger v2 analyses and would reject the new 140-trade example. The guard is raised to 102,400 bytes; beta trade-count limits and persistence schema remain unchanged. A test enforces that a representative 500-trade payload stays below this transport budget.
