# MT5 Account Snapshot Collector — local PoC

This isolated tool samples the current state of an already connected MetaTrader 5 terminal and writes it to a local JSONL file. It does not connect to NodoQuant, Supabase or any web API.

## Requirements

- Windows.
- MetaTrader 5 desktop installed, open, connected and already authenticated.
- Python available on the same machine.
- The official MetaQuotes Python package:

```powershell
py -m pip install MetaTrader5
# If the Python launcher is unavailable:
python -m pip install MetaTrader5
```

The collector does not request or store a password. Do not add credentials to this directory or to command-line arguments.

## Run

From the repository root:

```powershell
py tools\mt5_snapshot_collector\collector.py --interval 60 --duration 30
# Equivalent when `py` is unavailable:
python tools\mt5_snapshot_collector\collector.py --interval 60 --duration 30
```

- `--interval` is seconds. Default: `60`; hard minimum: `5`.
- `--duration` is minutes. Default: `30`; recommended PoC window: `30–60`.
- `--output-dir` can select another local directory.

The first snapshot is captured immediately. By default, files are created under `tools\mt5_snapshot_collector\output` with names such as:

```text
mt5_snapshots_20260912T010000Z.jsonl
```

Files are opened exclusively and previous captures are never overwritten. Each JSON object is written on one line and flushed immediately.

Press `Ctrl+C` to stop. The file is closed, `mt5.shutdown()` is called, and the captured count is printed.

## Captured data

Each line contains only:

- UTC system capture time;
- observed MT5 balance and equity;
- MT5 current account profit as `floatingPnl`;
- margin and free margin;
- number of currently open positions;
- capture mode, interval and `mt5` source label.

Missing or non-finite numeric values are written as `null`, never as zero. `positions_get()` is used only for the count. Equity and account profit are read directly from `account_info()` and are not reconstructed by summing positions.

The tool does **not** write account login, holder name, password, broker/server, terminal paths, tickets, order IDs, position details or comments. A random session UUID is generated only for process logs and is not written into snapshot records.

## Synthetic format example

The following line is synthetic and demonstrates the format only. It is **not a real MT5 fixture**:

```json
{"capturedAt":"2026-09-12T01:00:00.000Z","balance":100000.0,"equity":99975.5,"floatingPnl":-24.5,"margin":800.0,"freeMargin":99175.5,"openPositions":2,"captureMode":"poll","intervalMs":60000,"source":"mt5"}
```

## Limitations

- This is periodic sampling, not continuous tick-by-tick monitoring.
- Equity can cross a loss threshold between samples without being observed.
- The terminal and collector must remain open and connected; downtime creates unrecoverable gaps.
- `capturedAt` is the collector machine's timezone-aware UTC clock. No broker timezone is inferred.
- A successful capture does not prove that account and position calls were transactionally simultaneous.
- This PoC stores data locally in plain JSONL. Treat real fixtures as private financial data.

## Tests

Tests use Python's standard library and mocks/simple objects; they do not require MT5 or the `MetaTrader5` package:

```powershell
py -m unittest discover -s tools\mt5_snapshot_collector -p "test_*.py"
# Equivalent when `py` is unavailable:
python -m unittest discover -s tools\mt5_snapshot_collector -p "test_*.py"
```

## After a real capture

Run the collector on a consenting demo/test account for 30–60 minutes, ideally including a safe interval with an open position. Do not commit the resulting JSONL. The next stage is to inspect and anonymize that real fixture, then design the parser, validator and compact codec before any NodoQuant integration.
