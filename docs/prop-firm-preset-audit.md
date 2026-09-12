# Prop Firm preset source audit

Checked on 2026-09-12. Only official product, help-center, FAQ and terms pages were treated as sources of truth.

## Included

- **FTMO · 2-Step** — 10% then 5% profit targets; 5% maximum daily loss based on the balance recorded at 00:00 CE(S)T and tested against equity; static 10% maximum loss; four trading days per phase; unlimited trading period. Sources: FTMO 2-Step Challenge and Trading Objectives.
- **FundingPips · 2 Step Standard** — 8% then 5% targets; 5% daily loss from the higher of opening balance/equity at 00:00 platform time (UTC+3); static 10% maximum loss; three trading days per phase; no phase time limit. Sources: FundingPips help center and current Terms and Conditions.

## Audited but excluded

- **FTMO · 1-Step** — official rules currently state a 10% target, 3% daily loss, 10% end-of-day trailing maximum loss, unlimited period and a 50% Best Day Rule. The Best Day Rule materially affects passing and cannot be reconstructed faithfully from the persisted histogram, so publishing a pass percentage that omits it would be misleading.
- **FundingPips · 2 Step Pro** — the official product help page says that new/reset accounts require two minimum trading days per phase from 2026-08-26, while the official Terms and Conditions still state one minimum trading day for both phases. The 6%/6% targets, 3% daily loss and static 6% maximum loss agree, but the official minimum-day contradiction prevents verified publication.
- **The5ers · High Stakes** — the official FAQ now distinguishes New High Stakes (10%/5%) from Classic High Stakes (8%/5%), while both use a 5% daily limit, 10% absolute maximum loss and three profitable days of at least 0.5% per phase. Older official product-page snapshots presented only the 8% Classic target and the current page exposes both variants dynamically. No preset is included in this batch; the profitable-day definition is not representable by the current simulator.

## Fidelity boundary

Targets and phase structure are configured directly. Daily and maximum loss checks are approximations because persisted histogram data has neither real trade ordering nor floating intraday equity. Trading-day timing is synthetic. Inactivity, news/conduct restrictions, position or lot limits, and other special rules are unsupported and are never encoded as zero.
