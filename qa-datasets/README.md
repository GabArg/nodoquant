# NodoQuant QA Dataset Suite

This directory contains a collection of synthetic trading datasets designed to test and validate the Strategy Analyzer's parsing, metrics calculation, and visualization capabilities.

## Directory Structure

- `/baseline`: Core datasets with varying profitability (Profitable, Breakeven, Negative).
- `/risk`: Strategies with specific risk profiles (Martingale, High Variance, High RR).
- `/stability`: Datasets testing performance changes over time (Improving, Deteriorating).
- `/import-formats`: Sample exports from MT4, MT5, and Binance.
- `/errors`: Edge cases to test parser resilience (Missing columns, corrupted data, empty files).
- `/performance`: Large datasets (up to 5,000 trades) to test chart performance and plan limits.

## Testing Workflow

1. **Upload**: Select a dataset from any category.
2. **Verify Parsing**: Ensure the "Mapping" step detects columns correctly (Symbol, Profit, Time).
3. **Verify Metrics**:
   - `profitable`: Expect a high Strategy Score and green metrics.
   - `risk/martingale`: Verify if the Risk Analysis section flags high risk of ruin.
   - `baseline_small`: Check for statistical reliability warnings.
4. **Verify Plan Limits**:
   - `performance/dataset_500_trades.csv`: Should be allowed for Free users.
   - `performance/dataset_501_trades.csv`: Should trigger the Pro upgrade prompt.
5. **Verify Charts**:
   - `performance/dataset_5000_trades.csv`: Verify the Equity Curve renders smoothly with downsampling.

## Dataset Generator
Use `node qa-datasets/generate_datasets.js` to regenerate performance datasets or create custom ones by editing the configuration array in the script.

---
*Professional Quantitative Testing Infrastructure for NodoQuant*
