# MT5 as a source of intraday account snapshots

Consulted on **2026-09-12**. Only official MetaQuotes/MetaTrader/MQL5 documentation is used below. This is a research and applied-architecture document; it does not implement a connector, persistence, Prop Firm behavior or production code.

## Decision

MetaTrader 5 can provide a **real current account snapshot** containing balance, equity, current account profit, margin and free margin. It can also provide the current set of positions and a historical ledger of orders/deals. However, the documented Python and native MQL5 APIs do **not** expose a native time series of past `account_info()`/`AccountInfo*` states.

Accordingly:

- **Retrospective:** deals and orders are recoverable; a realized balance ledger can be reconstructed if all relevant financial deals are included. Historical observed account equity extrema are not recoverable from those records.
- **Current:** `account_info()` or `AccountInfo*` returns real account state at query time; `positions_get()` or `PositionGet*` returns real currently open positions.
- **Forward capture:** historical account snapshots must be created prospectively by sampling the current state. For a first fixture, use a local Python poller. For a future resilient connector, prefer an MQL5 EA using trade events plus a periodic heartbeat.

The claim **“MT5 does not expose a native historical account balance/equity series equivalent to `account_info()` over time” is confirmed for the officially documented Python and MQL5 APIs**, with one important qualification: MT5's trading report can retrospectively calculate and display equity fluctuations using historical prices. That is a platform reconstruction, not a documented API returning previously observed account snapshots.

## Official sources

### Python integration

- [`account_info()`](https://www.mql5.com/en/docs/python_metatrader5/mt5accountinfo_py) — current account data; returns the properties exposed by `AccountInfoInteger`, `AccountInfoDouble` and `AccountInfoString`.
- [`positions_get()`](https://www.mql5.com/en/docs/python_metatrader5/mt5positionsget_py) — currently open positions.
- [Python integration function inventory](https://www.mql5.com/en/docs/python_metatrader5) — includes current account/terminal state, current orders/positions, historical orders/deals and market bars/ticks; it documents no historical account-state/equity-series function.
- [`history_deals_get()`](https://www.mql5.com/en/docs/python_metatrader5/mt5historydealsget_py) — historical deals by interval, order ticket or position.
- [`history_orders_get()` overview and MQL5 equivalents](https://www.mql5.com/en/book/advanced/python/python_funcs_overview) — historical orders describe requests/lifecycle, not account equity observations.
- [`copy_ticks_range()`](https://www.mql5.com/en/docs/python_metatrader5/mt5copyticksrange_py) — historical symbol ticks and explicit Python/UTC guidance.
- [`terminal_info()`](https://www.mql5.com/en/docs/python_metatrader5/mt5terminalinfo_py) — connected terminal settings/status; the documented fields do not include an authoritative broker-server timezone.

### Native MQL5

- [`AccountInfoDouble`](https://www.mql5.com/en/docs/account/accountinfodouble) and [account property enumeration](https://www.mql5.com/en/docs/constants/environment_state/accountinformation) — current balance/equity/profit/margin properties.
- [Position properties](https://www.mql5.com/en/docs/constants/tradingconstants/positionproperties) — current position price, volume, profit, swap and millisecond timestamps.
- [Deal properties](https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties) — deal time, position ID, entry, profit, commission, swap, fee, volume and price.
- [`OnTradeTransaction`](https://www.mql5.com/en/docs/event_handlers/ontradetransaction) — server-originated changes to orders, deals, positions and trade requests.
- [Event handlers](https://www.mql5.com/en/docs/event_handlers) — `OnTick`, `OnTimer`, trade events and their queue behavior.
- [Date/time functions](https://www.mql5.com/en/docs/dateandtime) and [local/server-time semantics](https://www.mql5.com/en/book/common/timing/timing_local_server) — server, local and GMT clocks.

### Terminal and Strategy Tester reports

- [Current trading report](https://www.metatrader5.com/en/terminal/help/trading/report) — current balance/equity and retrospective report graphs; MetaTrader states that some graphs calculate floating-profit fluctuations from historical prices.
- [Classic HTML account report](https://www.metatrader5.com/en/terminal/help/trading_advanced/history_report) — orders, deals, current open positions, current summary and a balance graph based on deals.
- [Strategy Tester graph](https://www.metatrader5.com/en/terminal/help/algotrading/testing) — simulated balance changes and periodically sampled simulated equity during a tester run.
- [Strategy Tester report](https://www.metatrader5.com/en/terminal/help/algotrading/testing_report) — aggregate tester drawdowns and statistics.

## Capability matrix

| Mechanism | Past realized ledger | Past observed balance | Past observed equity | Current account state | Current positions | Prospective snapshots |
| --- | --- | --- | --- | --- | --- | --- |
| `history_deals_get` / `HistoryDeal*` | Yes | Derivable if the complete financial ledger and starting state are available | No | No | No | No |
| `history_orders_get` / `HistoryOrder*` | Order lifecycle only | No | No | No | No | No |
| `copy_ticks_*` | Market ticks only | No | No | No | No | No; ticks are valuation inputs, not account state |
| `account_info()` / `AccountInfo*` | No | Current value only | Current value only | Yes | No | Yes, if an external process/EA samples it |
| `positions_get()` / `PositionGet*` | No; current positions only | No | No | Partial | Yes | Yes, if sampled |
| `orders_get()` / `OrderGet*` | Current pending orders only | No | No | No | No | Can supplement a snapshot, but does not create equity |
| Terminal HTML/PDF report | Deals/orders and aggregates | Balance path may be represented/reconstructed | Report can calculate/display retrospective equity fluctuations; no documented machine-readable observed snapshot series | Summary at report generation | Current open positions in classic report | No automatic capture contract |
| Strategy Tester report | Simulated deals | Simulated | Simulated and periodically plotted | Tester state | Simulated | Not evidence from a live account |
| Python poller | Optional deal reconciliation | From start of capture | From start of capture | Yes | Yes | Yes |
| MQL5 EA | Optional deal/event reconciliation | From start of capture | From start of capture | Yes | Yes | Yes |

## Why deals, ticks and reports are not observed equity history

`history_deals_get()` supplies executions and financial operations. It can support a realized ledger and daily realized P/L. It does not state what total equity was between those events while positions were open.

`copy_ticks_*` supplies symbol market ticks. Replaying them into exact account equity would additionally require the complete position lifecycle, contract specifications, conversion symbols/rates, broker valuation rules, commissions/credit/blocked amounts, swaps and synchronized ticks for every exposure. Even a perfect reconstruction would be calculated equity, not proof that MT5 observed and recorded that exact account value at that instant.

The current trading report is more capable than the existing NodoQuant HTML parser: official documentation says the platform may load historical prices and calculate floating-profit fluctuations for report graphs. The export is suitable for human reporting, but official documentation does not define a stable machine-readable historical snapshot schema. The classic HTML report documents a deal-based balance graph and current summary. Neither should be treated as an `account_info()` history API.

Strategy Tester equity is generated inside a simulation. It is useful for testing an EA and its capture format, but it is not a real live-account fixture and must be labeled separately.

## Current `account_info()` evidence

The official Python example shows that `account_info()` returns all current account properties as a named tuple. Relevant fields include:

| Field | Meaning / use | Persistence decision |
| --- | --- | --- |
| `balance` | Current account balance in deposit currency | Persist in snapshots |
| `equity` | Current account equity | Persist; use directly rather than deriving it |
| `profit` | Current account profit in deposit currency | Persist as `floatingPnl` only with connector metadata stating it is MT5 `ACCOUNT_PROFIT`; do not assume it equals a sum of positions in every account model |
| `margin` | Current used margin | Optional but useful |
| `margin_free` | Current free margin | Optional but useful |
| `margin_level` | Equity/margin percentage where defined | Derivable from observed values; normally omit to minimize data |
| `currency` | Deposit currency | Persist once at series level, not per sample |
| `leverage` | Current leverage | Optional series metadata; not needed for Daily Loss snapshots |
| `trade_mode` / `margin_mode` | Demo/contest/real and margin/accounting modes | Optional capability metadata; avoid exposing it unless a rule requires it |
| `credit`, `commission_blocked`, assets/liabilities | Components that may explain why equity is not simply balance plus position P/L | Consider only if real fixtures prove they are necessary for validation |
| `login` | Account number | Sensitive and unnecessary; never persist/upload |
| `server`, `company`, `name` | Server/broker/client identity | Omit; server name is not authoritative timezone data |

MetaTrader documents equity as account state whose exact composition can include credit, blocked commission and floating P/L; broker/account settings may affect treatment of floating results. Consequently NodoQuant should trust the observed `equity` value rather than recompute it from `balance + positions.profit`.

## Current `positions_get()` evidence

The official position properties include:

- `symbol`, direction/type and `volume`;
- `price_open` and `price_current`;
- current `profit` and cumulative `swap`;
- `time`, `time_msc`, update timestamps;
- ticket/identifier, comments and external IDs.

For NodoQuant, a transient position snapshot can explain which exposures contributed to account risk and whether any position was open. The minimum useful transient fields are symbol, side, volume, open/update time, current price, profit and swap. Tickets can be replaced by an ephemeral in-process reference and discarded.

Summing `POSITION_PROFIT` must not be presented as exact account equity attribution. Account equity can include credit, blocked commissions, account-level charges and broker-specific calculation semantics; swaps and commissions may be represented separately. The authoritative account-level values remain `ACCOUNT_EQUITY` and `ACCOUNT_PROFIT` at capture time.

## Historical deals

Official deal properties expose `DEAL_TIME`, millisecond `DEAL_TIME_MSC`, `DEAL_POSITION_ID`, `DEAL_ENTRY`, `DEAL_PROFIT`, `DEAL_COMMISSION`, `DEAL_SWAP`, `DEAL_FEE`, `DEAL_VOLUME`, `DEAL_PRICE`, symbol and deal type. Financial deal types also cover balance, credit, charges, corrections, bonuses, commissions and interest.

This is sufficient, subject to complete history and correct account-mode handling, for:

- a realized account ledger;
- closed P/L including separately represented commission/swap/fee components;
- evaluation-day realized profit;
- Best Day rules defined solely from realized daily results;
- trading-day rules when the official rule can be mapped to entry deals/timestamps;
- reconciliation of observed balance snapshots.

It cannot recover:

- the lowest floating equity while a position was open;
- an intraday drawdown between deals;
- account equity at an arbitrary historical instant;
- missing historical price/valuation/account components;
- a proof of no Daily Loss breach between captured samples.

`history_orders_get()` adds setup/completion times and order lifecycle information but not financial account state. `orders_get()` similarly describes currently active orders, not equity.

## Capture strategies

| Strategy | Fidelity | Operational properties | Beta suitability |
| --- | --- | --- | --- |
| Python local poller | Periodic current state; no native MT5 event callbacks in the documented Python API | Fast to prototype; straightforward JSONL; requires Windows MT5 desktop terminal, Python process, logged-in/connected terminal and supervision; process/terminal restarts create gaps | Best first PoC and fixture generator |
| MQL5 EA | Can sample in `OnTimer`, react to `OnTradeTransaction`, optionally observe ticks in `OnTick` | Lives inside terminal; event-aware; installation/signing/versioning and secure outbound transport are more involved; it still stops when terminal/EA stops; event queues can coalesce/drop redundant timer/tick events under load | Better long-term capture agent |
| Hybrid event + heartbeat | Snapshot on trade/account events, at reset, and periodically while risk is open | Best coverage/volume compromise; resilient implementation needs local buffering, sequence numbers, reconnect handling and deduplication | Recommended production architecture after PoC |

`OnTick` is symbol-chart-driven and new tick events can be coalesced while one is already queued. It is not a reliable account-wide continuous sampler by itself. `OnTradeTransaction` detects account trade mutations but not adverse price movement between transactions. `OnTimer` supplies the necessary heartbeat. The combination is materially stronger than any handler alone.

## Cadence recommendation

| Cadence | Assessment for Daily Loss |
| --- | --- |
| Every tick | Highest volume, chart/symbol dependent, queue/coalescing concerns; still not a synchronized tick for every account exposure |
| 5 seconds | Strong sampled monitoring while positions are open; greater storage/network/terminal load |
| 30 seconds | Practical beta compromise; meaningful blind interval remains |
| 1 minute | Appropriate for the local fixture PoC and coarse retrospective analysis; insufficient to claim continuous breach detection |
| 5 minutes | Too coarse for credible Daily Loss minima when positions are open |
| Event-driven only | Misses equity movement between trade transactions |
| Events + adaptive heartbeat | Best compromise |

Recommended production candidate: snapshot on `OnTradeTransaction`, at each firm reset boundary, and every **30 seconds while positions are open**, relaxing to **1–5 minutes when flat**. A stricter monitoring product could use five seconds while exposed, but that should be decided after real terminal-load and payload measurements. All sampled equity remains `approximated` between observations; no cadence should be marketed as continuous exactness.

For the requested PoC, one minute for 30–60 minutes is appropriate because its purpose is to validate semantics and produce a fixture, not detect every transient breach.

## Clock and timezone

- Deal `time_msc` and position `time_msc` are documented as milliseconds since 1970-01-01. Retain the integer value before presentation conversions.
- Python tick documentation says MT5 stores tick/bar times in UTC and warns that Python `datetime` construction/printing can apply local timezone shifts. Use timezone-aware UTC datetimes.
- Native `TimeCurrent()` is the last known server time (last quote receipt), not necessarily a continuously advancing wall clock.
- `TimeTradeServer()` is a calculated current server time based on the last known difference between local and server clocks; it is an estimate.
- `TimeGMT()` and `TimeLocal()` describe terminal-machine clocks. `TimeGMTOffset()` is the local computer's offset, not the broker server's timezone.
- `terminal_info()` and `account_info()` document server identity/status but no authoritative IANA server timezone or historical offset schedule.

Snapshot capture should therefore store:

1. a timezone-aware local UTC capture instant from the collector;
2. optional `terminalTime`/`TimeCurrent` or `TimeTradeServer` as diagnostic metadata;
3. capture latency/uncertainty where the poller brackets the MT5 call;
4. `serverTimeZone` only when supplied authoritatively by a separate verified contract—never inferred from server name or clock comparison.

Authoritative absolute instants can be projected to FTMO `Europe/Prague` and FundingPips fixed `UTC+03:00` evaluation days. Unknown broker timezone does not prevent projection of an absolute capture instant. It does prevent treating ambiguous legacy terminal-local timestamps as exact instants, and it prevents proving what server-local time an old export intended.

## Proposed normalized contract

Conceptual only:

```ts
interface NormalizedAccountSnapshot {
  at: string; // collector UTC ISO instant
  balance?: number;
  equity?: number;
  floatingPnl?: number;
  margin?: number;
  freeMargin?: number;
}

interface NormalizedAccountSnapshotSeries {
  version: 1;
  source: "mt5";
  sourceId: string; // random ephemeral installation/session ID
  currency?: string;
  timeBasis: {
    kind: "collectorUtc";
    terminalTimeCaptured?: boolean;
    serverTimeZone?: string; // absent unless authoritative
  };
  capture: {
    mode: "poll" | "event" | "hybrid";
    sampleIntervalMs?: number;
  };
  quality: {
    accountStateObserved: true;
    equityObserved: boolean;
    positionsCaptured: boolean;
    completeFrom?: string;
    gapsDetected: boolean;
  };
  snapshots: NormalizedAccountSnapshot[];
}
```

Fields remain optional so an unavailable measurement stays unavailable rather than becoming zero. At least balance or equity must be observed. `floatingPnl` should map to MT5 account-level `profit` with that provenance retained; it should not be silently synthesized from positions. `terminalTime` belongs in optional diagnostic capture metadata or a fixture, not necessarily every persisted production sample.

## Privacy and security

Nothing in the proposed PoC needs trading permission. Use a terminal session with the least privilege supported by the user's broker and never log credentials.

Do not export or upload:

- password or investor password;
- account login/number;
- broker/server/company/client name unless a future verified calculation explicitly requires it;
- deal/order/position tickets after transient reconciliation;
- external IDs, magic numbers, comments or free-form broker metadata;
- terminal filesystem paths;
- raw `account_info()._asdict()` or position named tuples, because they include unnecessary identifiers.

Generate a random `sourceId` at PoC startup (or per fixture) with no account-derived input. It exists only to associate rows from one capture session and can be replaced during anonymization.

## Minimal local PoC

Use Python first because the goal is evidence collection, not a production daemon. The official `MetaTrader5` Python module connects to an installed MT5 terminal and exposes the exact current-state calls required.

PoC behavior:

1. User opens/logs into MT5 on a Windows machine.
2. A local script calls `mt5.initialize()` without embedding credentials.
3. Once per minute for 30–60 minutes, bracket the query with timezone-aware UTC timestamps, call `account_info()` and `positions_get()` and record errors/latency.
4. Write only the allowlisted account fields to local JSONL. Record position count and optionally an anonymized aggregate (`sumProfit`, `sumSwap`); keep raw positions in a separate temporary diagnostic file only if needed to validate semantics.
5. Flush each line, use a monotonic sequence number, and record explicit gap/error rows rather than filling missing samples.
6. Call `mt5.shutdown()` on exit. Do not upload anything to NodoQuant.

Minimal JSONL shape:

```json
{"version":1,"sequence":17,"at":"<UTC ISO instant>","balance":"<observed number>","equity":"<observed number>","floatingPnl":"<MT5 account profit>","margin":"<observed number>","freeMargin":"<observed number>","positionCount":"<integer>","captureLatencyMs":"<integer>"}
```

The placeholders above define a contract; they are not fabricated fixture values. The PoC should not be added to NodoQuant production yet. Once a real anonymized fixture exists, compare `equity`, `balance`, account `profit`, position aggregates, swaps and credit/blocked components to decide whether any additional observed field is required.

## Real fixture and anonymization contract

The minimum shareable fixture columns are:

```text
timestamp,balance,equity,floatingPnl,margin,freeMargin
```

To anonymize without destroying Daily Loss semantics:

- remove login, server, company, tickets, symbols, comments and paths;
- shift every timestamp by the same whole-day delta if calendar identity must be hidden, retaining intervals and reset-boundary relationships; document the shift and do not cross a DST regime when testing IANA reset behavior;
- either retain monetary values under access control or apply one constant positive scaling factor to **all** monetary fields; never independently normalize each column;
- preserve zeros, signs, ordering, gaps and decimal relationships;
- declare currency as a synthetic/omitted label after scaling;
- retain capture cadence, latency and provenance flags.

Do not manufacture rows. A tester-generated fixture must be labeled `mt5-strategy-tester`, not real account evidence.

## Risks

- Terminal, Python process or EA downtime produces irrecoverable equity gaps.
- Network disconnection can leave account state stale; connection state must be captured.
- Poll timing and call latency mean values are not simultaneous in a strict transactional sense.
- One-minute or 30-second sampling can miss brief drawdown breaches.
- `OnTick` covers the attached chart's tick events, not a synchronized account-wide market event stream.
- Broker/account models can change equity composition; observed account equity is authoritative.
- MT5 desktop/Python integration creates a Windows/terminal-open operational dependency.
- HTML report internals are not a documented stable snapshot API.
- An EA that uploads data introduces endpoint authentication, replay, buffering and user-consent work not appropriate for this PoC.

## Recommended next step

Run the local one-minute Python PoC for 30–60 minutes on a consenting MT5 demo account, including a period with an open position if safe. Produce one private raw fixture and one anonymized fixture. Validate timestamp monotonicity, disconnect behavior, balance/equity/account-profit relationships and file size. Only then finalize parser/codec tests and decide whether an EA hybrid collector is justified.

No historical equity backfill should be attempted. Existing `histogramApproximation` and `normalizedTradeSequence` paths remain the only fallbacks for reports without observed snapshot evidence.
