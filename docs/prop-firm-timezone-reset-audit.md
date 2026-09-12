# Prop Firm timezone and daily-reset audit

Checked on 2026-09-12. Only official firm sources were used.

## Previous behavior

`strategySimulationDataFromPersistedMetrics` validated whether every normalized trade had a `closedAt`. `runPropFirmMonteCarlo` then called `groupNormalizedTradesByUtcDay`, whose key was the first ten characters of the ISO timestamp. All firms therefore shared UTC midnight. Daily-loss baselines, simulated trading-day counts, minimum-day gates and duration percentiles all inherited that UTC grouping. Historical histogram inputs had no timestamps and used synthetic groups of `tradesPerDayEstimate`.

Normalized sequence persistence stores `closedAt` and optional `openedAt` as epoch milliseconds, so they are absolute instants. It does not store the source timezone. Several parsers interpret platform-style timestamps as UTC because the source file carries no offset; those instants can therefore remain ambiguous even though their serialized form is ISO/epoch.

## Official rules confirmed

### FTMO · 2-Step

- Source: [FTMO Trading Objectives](https://ftmo.com/en/trading-objectives/).
- Corroborating DST source: [FTMO Trading Update — 28 Sep 2023](https://ftmo.com/en/blog/trading-updates/trading-update-28-sep-2023/).
- Daily reset: 00:00 CE(S)T, explicitly described by FTMO as Prague time.
- Implementation timezone: IANA `Europe/Prague`, 00:00. It follows CET (UTC+1) and CEST (UTC+2) transitions through the runtime timezone database.
- Reference balance: account balance recorded at 00:00 CE(S)T.
- Breach observation: account equity, including open P/L, swaps and commissions.
- Trading-day definition: a CE(S)T day in which at least one position is opened. NodoQuant currently groups closed trades for simulation blocks, so its minimum-day modeling remains approximate even when `openedAt` is available on some imports.

### FundingPips · 2 Step Standard

- Source: [FundingPips 2 Step Standard](https://help.fundingpips.com/hc/en-us/articles/34501809112081-2-Step-Standard).
- Corroborating source: [FundingPips Terms and Conditions](https://fundingpips.com/legal/terms-and-conditions).
- Daily reset: 00:00 Platform Time, stated explicitly as UTC+3 in the current product help page.
- Implementation timezone: fixed `UTC+03:00`, with no DST. The terms use the wording “CEST/server time”, but the current product page supplies the unambiguous numeric platform offset used for this preset.
- Reference: the higher of opening balance or opening equity for the day.
- Breach observation: equity including floating P/L and closed positions.

## Implementation decision

`DailyResetConfig` distinguishes IANA zones from fixed offsets and includes hour, minute and `evaluationDayStart` semantics. `groupTradesByEvaluationDay` projects each absolute close instant into the configured zone, shifts dates before a non-midnight reset to the preceding evaluation day, and preserves sequence order. IANA projection uses native `Intl.DateTimeFormat`; no date library was added.

Reference templates and fresh custom configurations use the internal synthetic default `00:00 UTC`. That value is not presented as an official rule. When timestamps are incomplete or the input is a historical histogram, the simulator does not apply the firm's timezone and retains synthetic daily grouping.

## Fidelity boundary

Correct reset boundaries improve closed-balance daily loss, day blocks, minimum-day gates and duration. They do not create floating equity. FTMO equity observation and FundingPips balance-or-equity observation remain approximated; `intradayEquity` remains unsupported. Static maximum loss and closed-balance trailing behavior are unchanged. Timestamp imports without an original offset remain a disclosed source ambiguity.
