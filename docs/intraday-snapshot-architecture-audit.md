# Intraday balance / equity snapshot architecture audit

Audited on 2026-09-12. This document is an architecture and compatibility assessment only. No parser, analyzer, persistence, database, Monte Carlo, scoring, fingerprinting, deduplication or UI behavior was changed as part of this stage.

## Executive conclusion

NodoQuant currently has ordered **closed-trade events**, not an intraday account-state series. None of the seven supported input paths produces genuine historical equity snapshots. MT4/MT5 formats can contain account-history rows or statement summaries, but the current adapters deliberately filter balance/deposit/withdrawal rows and do not parse an equity curve. Binance Spot queries current balances only to discover symbols; Binance Futures reads user trades, not account snapshots. Generic CSV exposes no mappings for account state.

Therefore equity must not be reconstructed or backfilled from trades. The recommended next abstraction is a provider-independent, optional `NormalizedAccountSnapshotSeries`, kept separate from `NormalizedTrade`. It should initially exist only as an in-memory connector contract with explicit timestamp provenance. Persistence should wait until a real connector supplies observed snapshots and representative payloads can be measured. Sparse/event-driven series may later fit an optional compact payload extension; dense series should use a separate compressed sidecar rather than enlarge every `full_metrics` row.

## 1. Current ingestion and loss points

Dedicated imports normalize into `lib/import/normalizedTrade.ts::NormalizedTrade`, then the analyzer converts them to its legacy `Trade`. `FullMetrics.simulationData` persists only compact tuples containing realized profit and optional close/open instants. The Prop Firm adapter prefers this normalized sequence and otherwise reconstructs outcomes from the histogram.

The transient import shape contains symbol, side, size, prices, commission and swap where the adapter can read them. Conversion to the analyzer shape currently drops commission, swap, import source, market type and external trade ID. The persisted simulation sequence deliberately retains only `profit`, `closedAt` and `openedAt`. It contains no balance, equity, floating P/L, margin, free margin, account size or positions.

Five separate concepts must remain distinct:

- **Trade event:** an execution or normalized closed trade, carrying realized outcome and trade timing. It does not describe total account state.
- **Balance event:** a ledger mutation such as realized posting, commission, swap, deposit or withdrawal. It is a delta/event, not necessarily the balance measured after it.
- **Equity snapshot:** equity observed at one instant. It captures floating effects at that instant but says nothing about extrema between samples.
- **Account snapshot:** a point-in-time measurement that may include balance, equity, floating P/L, margin and free margin.
- **Position snapshot:** the set or state of open positions at one instant. Positions alone cannot yield equity without complete cash state, contract specifications and contemporaneous mark prices.

## 2. Source capability matrix

`Available` below means the current supported parser actually emits the field. `Derivable` is used only where the derivation is defensible from current output. A value present somewhere in a provider export but ignored by NodoQuant is not marked available.

| Source | Timestamp / timezone | Realized P/L and costs | Balance / equity / floating | Margin / positions / account size | Daily opening / closing balance |
| --- | --- | --- | --- | --- | --- |
| MT4 CSV | Open and close time when columns exist; parsed platform-local text is coerced to a `Date`, but server timezone/offset is unavailable | Profit, commission and swap are parsed; symbol, side and size are available | Balance ledger rows are explicitly filtered; equity and floating P/L unavailable | Margin, free margin, open-position snapshots and account size unavailable | Unavailable. A synthetic cumulative closed path is possible only with an external starting balance and no cash flows, neither of which is supplied |
| MT4 HTML | Open/close time when present; some layouts fall back to open time as close time; timezone/offset unavailable | Profit, commission and swap parsed from the detected trade table | Balance/credit rows filtered; statement summary fields outside that table are not parsed; no equity/floating series | Unavailable | Unavailable |
| MT5 CSV | Deal time available; no reliable position open/close reconstruction; dotted platform timestamps are interpreted as UTC without retaining server zone | Profit available. Although format detection recognizes commission/swap headers, the legacy parser drops them and the adapter emits default zero, which is **not evidence of observed zero cost** | A `Balance` header can be required for format detection, but its values and balance/deposit/withdrawal rows are discarded; equity/floating unavailable | Volume may exist; margin, free margin, position snapshots and account size unavailable | Unavailable |
| MT5 HTML | Deal time, with entry legs filtered and no reconstructed open time; server zone/offset unavailable | Profit, commission and swap available; symbol, direction, volume and deal price may be available | Balance/cash rows filtered and no equity/floating series parsed | No margin, free margin, position snapshots or account size | Unavailable |
| Binance Futures | Absolute epoch-millisecond trade time | Per-fill `realizedPnl` and commission available; symbol, side, quantity and fill price available | No historical wallet balance, account equity or unrealized-P/L series is requested | `/fapi/v1/userTrades` supplies executions, not open-position/account snapshots; margin/free margin/account size unavailable | Unavailable |
| Binance Spot | Absolute epoch-millisecond fill time; grouped order uses its last fill time for both normalized open and close | Commission available. Current `profit_loss` is signed quote cash flow, **not paired realized P/L**, so it cannot be treated as account profit | Current `free`/`locked` balances are queried only for symbol discovery and are neither returned nor historical; equity/floating unavailable | No historical positions, margin or account size | Unavailable |
| Generic CSV | Close/date column; optional mapped entry time. ISO offsets are honored when supplied, but ambiguous local strings have no retained source zone | Profit is direct or price-derived; commissions and swaps have no mapping and adapters emit defaults | No mappings for balance, equity or floating P/L | Symbol, side and size can be mapped; margin, free margin, positions and account size cannot | Unavailable |

The repository samples confirm only trade-level fields: MT4 and MT5 samples contain timestamps, trade attributes and profit; the Binance sample contains date, market, side, price, amount and realized P/L. There are no MT4/MT5 HTML fixtures or snapshot-series fixtures, so broader broker-export capabilities cannot be claimed as supported behavior.

## 3. Fidelity levels and minimum datasets

| Level | Minimum trustworthy dataset | Daily loss | Maximum/trailing loss | Daily opening/closing state and reset |
| --- | --- | --- | --- | --- |
| 1 — closed balance only | Ordered closed outcomes; timestamps when available | Balance-only path is approximated. Equity-based and balance-or-equity rules remain approximated/unsupported for intraday breaches | Static and trailing checks are valid only against the simulated closed-balance path; an intratrade equity breach can be missed | Trading-day grouping improves with absolute timestamps. Actual account opening balance is unavailable unless observed; do not infer it from a preset account size |
| 2 — intraday balance events | Complete ordered balance ledger, initial balance, and deposits/withdrawals distinguished from trading P/L | Exact for a purely balance-based rule if the ledger is complete; equity observation still unsupported | Exact for balance-only thresholds; equity-based thresholds remain unsupported | Opening/closing balance can be exact at the evaluation reset if the ledger and time basis are complete |
| 3 — intraday equity snapshots | Level 2 plus observed balance/equity samples | Approximated between samples; exact only at observed instants. A reset-time snapshot makes the daily reference substantially stronger | Equity drawdown and trailing behavior become sampled approximations; missed extrema remain possible | Opening equity is exact only if observed at reset. Carry-forward or nearest-sample values must be labeled approximations |
| 4 — positions + floating P/L | Complete account ledger, open-position state, floating P/L or sufficient valuation inputs, and event-dense timestamps | Potentially near-exact when every relevant state transition/price event is observed; periodic sampling alone is still not continuous | Potentially near-exact for equity-based static/trailing rules | Supports rule-specific intraday replay, but only with complete valuation semantics and known clock provenance |

The minimum worthwhile improvement is Level 2 for balance-only rules and Level 3 for equity-aware rules. One snapshot per trade is not sufficient to prove absence of a breach while a position was open. A snapshot every minute is stronger evidence than every five minutes, but neither is mathematically continuous.

## 4. Proposed normalized model

Use one account-state snapshot type rather than separate balance and equity snapshot types because these values are commonly observed atomically and must share a timestamp. Keep ledger events and positions separate because their semantics, cardinality and validation differ.

Conceptual public model (not implemented):

```ts
interface NormalizedAccountSnapshot {
  at: string;              // ISO instant only when it is genuinely resolved
  balance?: number;        // observed account balance
  equity?: number;         // observed account equity
  floatingPnl?: number;    // observed, not silently derived
  margin?: number;
  freeMargin?: number;
}

interface NormalizedAccountSnapshotSeries {
  version: 1;
  timeBasis:
    | { kind: "absolute"; sourceTimeZone?: string; sourceOffsetMinutes?: number }
    | { kind: "assumed"; reason: "missingSourceZone" | "ambiguousLocalTime" };
  snapshots: NormalizedAccountSnapshot[];
}
```

Validation should require a valid timestamp, at least one observed numeric state field, stable chronological ordering, and finite numbers. Missing values stay absent; they must never become zero. `balance`, `equity` and `floatingPnl` need not satisfy an identity unless the source documents identical valuation/currency semantics. Series-level provenance avoids repeating timezone metadata per sample.

Future optional concepts:

- `NormalizedBalanceEvent`: `at`, event kind, amount, optional `balanceAfter`; deposits/withdrawals must not be confused with trading P/L.
- `NormalizedPositionSnapshot`: separate versioned series keyed only by an internal ephemeral position reference if required. It should not persist broker tickets.

For compact storage, the validated model can serialize to positional tuples such as `[epochMs, balance?, equity?, floatingPnl?, margin?, freeMargin?]`. That representation is a codec, not the domain API. Optional tuple holes must decode as missing, not zero.

## 5. Timezone and clock provenance

An ISO string or epoch is an absolute instant only if the source timestamp originally had an offset/zone or arrived as epoch time. Binance satisfies this. Current MT4/MT5 platform timestamps usually lack an offset; adapters coerce them into UTC, and the original server timezone is lost. Generic CSV varies by input and has the same ambiguity for local timestamps.

Future connectors should retain, at series level when known:

- source IANA timezone;
- original numeric offset where supplied;
- whether the instant is source-authoritative or assumed;
- server timezone separately from the user's display timezone.

NodoQuant can then project authoritative instants to FTMO's `Europe/Prague` reset, including DST, or FundingPips' fixed `UTC+03:00` reset. An assumed MT timestamp may still be grouped, but its temporal fidelity must remain degraded because projection cannot repair an unknown source clock. No timezone should be guessed from broker name, locale or file name.

## 6. Persistence alternatives

### A. Add snapshots to `full_metrics` v2

- **Advantages:** simplest read path, optional fields preserve historical compatibility, one-row retrieval.
- **Costs/risks:** every report fetch carries the series; large JSONB values are TOASTed by PostgreSQL but still increase network, serialization and client memory; anonymous payload currently has a 100 KiB transport guard; dense snapshots quickly exceed it.
- **Fit:** only a bounded sparse series or daily/reset checkpoints. Not recommended for dense intraday data without a new envelope/version and hard limits.

### B. Separate database storage

- **Advantages:** snapshots are loaded only for simulations, lifecycle and retention can differ from report metrics, indexing/range reads become possible.
- **Costs/risks:** schema/RLS/API work, more reads, consistency/orphan handling. One row per minute creates unnecessary row/RLS overhead.
- **Fit:** if database persistence is selected later, prefer one versioned compressed series blob per analysis (or coarse chunks), not one row per snapshot.

### C. Compressed object/sidecar

- **Advantages:** best payload economics for dense numeric time series; does not inflate routine report reads.
- **Costs/risks:** codec/versioning, private-object authorization, decompression and corruption handling, no direct SQL inspection, base64 adds roughly 33% when embedded in JSON.
- **Fit:** recommended eventual shape for dense connector data, either private object storage or a separate blob record referenced by analysis ID.

### D. Do not persist yet

- **Advantages:** prevents cementing a schema around data no current source genuinely supplies; zero historical/backfill risk.
- **Costs:** no improvement until a real snapshot-producing connector exists.
- **Recommendation now:** choose D. Define and test the ingestion contract only when the first authoritative source is selected. Then benchmark real series and choose A for strictly bounded sparse snapshots or C/B for dense series. Do not modify v2 or the database during the current stage.

Historical histogram and normalized-trade reports must continue unchanged. Never derive or backfill equity from an equity curve aggregate, histogram, cumulative realized P/L or preset account size.

## 7. Size estimates

Representative compact tuples `[epochMs,balance,equity,floatingPnl,margin,freeMargin]` were serialized as JSON with realistic decimal values. These are architecture estimates, not measurements of a live broker feed.

| Scenario | Samples | Raw compact JSON | gzip | gzip + base64 |
| --- | ---: | ---: | ---: | ---: |
| 500 trades, 1 snapshot per trade | 500 | ~29 KiB | ~9.7 KiB | ~12.9 KiB |
| 500 trades, 5 snapshots per trade | 2,500 | ~142 KiB | ~47 KiB | ~63 KiB |
| Every minute for 8 hours | 480 | ~27 KiB | ~9.3 KiB | ~12.4 KiB |
| Every 5 minutes for 8 hours | 96 | ~5.4 KiB | ~1.9 KiB | ~2.6 KiB |

For context, the measured existing v2 payload is about 84,750 bytes for 500 trades. Adding 500 raw compact snapshots would put it near 114 KiB; 2,500 would put it near 227 KiB, before other envelope growth. Object-form snapshots can be roughly 1.5–3× larger depending on field names and sparsity. A full trading month at one-minute cadence is orders of magnitude larger than the single-day row above. This makes unconditional embedding in `full_metrics` a poor default.

## 8. Prop Firm rule map

| Program/rule | Trades/timestamps needed | Account snapshots needed | Positions/floating needed | Result with trustworthy snapshots |
| --- | --- | --- | --- | --- |
| FTMO 2-Step — Daily Loss | Closed outcomes and day ordering help attribution | Balance at Prague reset plus intraday equity | Floating equity or sufficiently dense observed equity | Reference balance becomes exact when observed; breach remains sampled unless continuous/event-complete |
| FTMO 2-Step — Maximum Loss | Trade path helps closed balance | Intraday equity | Open-position effect is material | Detects observed equity breaches; gaps remain approximate |
| FTMO 2-Step — Trading Day | Position **open** timestamp and Prague day | Not required | Not required | Snapshots do not fix missing/ambiguous open timestamps |
| FundingPips 2 Step Standard — Daily Loss | Day ordering | Opening balance **and** opening equity at fixed UTC+3, plus intraday equity | Floating P/L is material | Correct higher-of-opening reference and observed intraday checks |
| FundingPips — Maximum Loss | Closed path | Intraday balance/equity | Floating effect material where equity is tested | Improves from closed-only to sampled-equity fidelity |
| FTMO 1-Step — Daily/trailing | Day ordering and daily closed balance | Reset balance and intraday equity | Floating effect material | Enables rule-aware sampled replay, not automatic exactness |
| FTMO 1-Step — Best Day | Complete closed realized P/L, fees and evaluation-day timestamps | Not inherently required | Not required for a closed-profit definition | Snapshot work alone does not enable the rule; daily trade completeness does |
| The5ers — profitable day | Complete realized daily profit and authoritative rule definition | Not inherently required | Depends on official definition | Primarily a trade/timestamp problem, not an equity-snapshot problem |
| The5ers — Daily Loss | Day reference and ordered activity | Balance/equity at the applicable reset and intraday equity | Floating effect likely material when equity is used | Improves only after the exact program rule is unambiguous |

Official-rule metadata remains separate from simulation evidence: a verified rule does not make a sampled result official or exact.

## 9. Fidelity model

Replace the mental model of one global quality label with four independently computed dimensions (UI changes are outside this audit):

- **Temporal fidelity:** synthetic / assumed-clock / absolute timestamps / authoritative source zone and reset alignment.
- **Balance fidelity:** reconstructed closed path / complete ledger / observed reset and intraday balances.
- **Equity fidelity:** unavailable / sparse sampled / periodic sampled with cadence / event-complete or continuous broker evidence.
- **Rule coverage:** for each rule, exact, approximated or unsupported, with the required evidence and actual evidence recorded.

Overall quality may summarize these dimensions but must be capped by the weakest material requirement. For example, normalized trades with authoritative timestamps and one-minute equity samples can have high temporal fidelity, exact reset grouping, strong sampled equity fidelity, but an equity-based Daily Loss rule remains `approximated` because a between-sample trough can be missed.

## 10. Privacy and minimization

Persist only timestamp, required account-state values, series version/provenance and minimal quality metadata. Do not persist:

- broker/exchange account IDs, login names or personal names;
- trade/order/deal tickets or external position IDs;
- API keys, secrets, credentials or session identifiers;
- broker comments, notes, tags or free-form metadata;
- exact broker/server identity unless operationally required and disclosed;
- positions, symbols, prices or volumes when account snapshots alone satisfy the rule;
- redundant raw responses or fields unused by simulation.

Retention and deletion must follow the parent analysis. Values should use account currency without persisting unnecessary asset balances. If multi-currency valuation becomes necessary, store only the normalized valuation currency and documented conversion basis, not the complete wallet.

## 11. Provider-independent future compatibility

The proposed snapshot contract depends on measurements and clock provenance, not MT4, MT5, cTrader, NinjaTrader, TradingView, Binance, Bybit or any broker API shape. Each connector must publish a capability declaration: observed fields, sampling/event cadence, clock basis, completeness window and whether values are account-wide.

CSV/charting sources such as TradingView may remain trade-only unless users explicitly export account-state columns with documented semantics. API-based MT5/cTrader/broker connectors may provide account snapshots. Exchange connectors must normalize wallet balance, margin balance and unrealized P/L carefully; those concepts are not interchangeable with broker `balance`/`equity`. Provider adapters own that translation, while Prop Firm consumes only the normalized contract.

## 12. Recommended roadmap

### Phase 1 — contract and evidence fixtures

Select one real snapshot-producing connector/export. Capture privacy-scrubbed fixtures; document field semantics, clock basis, cadence and gaps. Add the normalized in-memory series, strict validation and capability metadata. Do not persist and do not route it into Prop Firm until fixtures prove the meaning of balance/equity.

### Phase 2 — rule-aware replay behind fallback

Add an adapter that prefers trustworthy snapshots but preserves `normalizedTradeSequence` and `histogramApproximation` fallbacks. Implement reset interpolation policy explicitly: only exact reset observations are exact; last-known values are approximations. Evaluate Daily Loss/static/trailing against observed states, expose per-rule evidence/fidelity, and keep general Monte Carlo unchanged.

### Phase 3 — bounded persistence

Measure real 500-trade and multi-day feeds. Persist sparse, bounded account snapshots only if they fit a versioned optional payload budget; otherwise store a compressed private sidecar/chunk per analysis with explicit retention and integrity checks. Add no historical equity backfill. Consider position snapshots only when a verified rule cannot be supported by account snapshots and a connector supplies complete valuation inputs.

## What is not worth implementing yet

- Equity reconstruction from realized trades, histograms or aggregate equity curves.
- One snapshot per trade presented as intraday coverage.
- Position replay without complete mark prices, contract specifications and cash ledger.
- A generic high-frequency database table before a real connector and cadence exist.
- Parsing MT statement summary labels as a time series.
- Persisting dense snapshots inside every v2 `full_metrics` payload.
- Enabling FTMO 1-Step or The5ers rules solely because this snapshot model has been designed.
