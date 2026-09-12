#!/usr/bin/env python3
"""Local, isolated MetaTrader 5 account snapshot collector PoC."""

from __future__ import annotations

import argparse
import importlib
import json
import math
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Sequence


SOURCE = "mt5"
CAPTURE_MODE = "poll"
DEFAULT_INTERVAL_SECONDS = 60
DEFAULT_DURATION_MINUTES = 30
MIN_INTERVAL_SECONDS = 5

SNAPSHOT_KEYS = {
    "capturedAt",
    "balance",
    "equity",
    "floatingPnl",
    "margin",
    "freeMargin",
    "openPositions",
    "captureMode",
    "intervalMs",
    "source",
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_utc(value: datetime) -> str:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("capturedAt must be timezone-aware")
    return value.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def optional_finite_number(value: Any) -> int | float | None:
    if value is None or isinstance(value, bool):
        return None
    if not isinstance(value, (int, float)):
        return None
    if not math.isfinite(value):
        return None
    return value


def build_snapshot(
    account_info: Any,
    positions: Sequence[Any],
    interval_seconds: int,
    captured_at: datetime | None = None,
) -> dict[str, Any]:
    if account_info is None:
        raise ValueError("account_info is required")
    if positions is None:
        raise ValueError("positions are required")
    if interval_seconds < MIN_INTERVAL_SECONDS:
        raise ValueError(f"interval must be at least {MIN_INTERVAL_SECONDS} seconds")

    snapshot = {
        "capturedAt": iso_utc(captured_at or utc_now()),
        "balance": optional_finite_number(getattr(account_info, "balance", None)),
        "equity": optional_finite_number(getattr(account_info, "equity", None)),
        "floatingPnl": optional_finite_number(getattr(account_info, "profit", None)),
        "margin": optional_finite_number(getattr(account_info, "margin", None)),
        "freeMargin": optional_finite_number(getattr(account_info, "margin_free", None)),
        "openPositions": len(positions),
        "captureMode": CAPTURE_MODE,
        "intervalMs": interval_seconds * 1000,
        "source": SOURCE,
    }
    validate_snapshot(snapshot)
    return snapshot


def validate_snapshot(snapshot: dict[str, Any]) -> None:
    if set(snapshot) != SNAPSHOT_KEYS:
        raise ValueError("snapshot contains missing or unexpected fields")

    parsed_at = datetime.fromisoformat(snapshot["capturedAt"].replace("Z", "+00:00"))
    if parsed_at.tzinfo is None or parsed_at.utcoffset() is None:
        raise ValueError("capturedAt must be a valid timezone-aware ISO timestamp")

    for field in ("balance", "equity", "floatingPnl", "margin", "freeMargin"):
        value = snapshot[field]
        if value is not None and optional_finite_number(value) is None:
            raise ValueError(f"{field} must be finite or null")

    positions = snapshot["openPositions"]
    if isinstance(positions, bool) or not isinstance(positions, int) or positions < 0:
        raise ValueError("openPositions must be a non-negative integer")
    interval_ms = snapshot["intervalMs"]
    if isinstance(interval_ms, bool) or not isinstance(interval_ms, int) or interval_ms < MIN_INTERVAL_SECONDS * 1000:
        raise ValueError("intervalMs is invalid")
    if snapshot["captureMode"] != CAPTURE_MODE or snapshot["source"] != SOURCE:
        raise ValueError("snapshot provenance is invalid")


def serialize_snapshot(snapshot: dict[str, Any]) -> str:
    validate_snapshot(snapshot)
    return json.dumps(snapshot, ensure_ascii=False, allow_nan=False, separators=(",", ":"))


def validate_cli_values(interval_seconds: int, duration_minutes: int) -> list[str]:
    if interval_seconds < MIN_INTERVAL_SECONDS:
        raise ValueError(f"--interval must be at least {MIN_INTERVAL_SECONDS} seconds")
    if duration_minutes <= 0:
        raise ValueError("--duration must be greater than zero minutes")

    warnings: list[str] = []
    if interval_seconds < 30:
        warnings.append("Intervals below 30 seconds increase terminal and disk activity; 5 seconds is the hard minimum.")
    if duration_minutes < 30 or duration_minutes > 60:
        warnings.append("The recommended PoC duration is 30 to 60 minutes.")
    return warnings


def create_output_path(output_dir: Path, now: datetime | None = None) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    stamp = (now or utc_now()).astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    candidate = output_dir / f"mt5_snapshots_{stamp}.jsonl"
    if not candidate.exists():
        return candidate
    return output_dir / f"mt5_snapshots_{stamp}_{uuid.uuid4().hex[:8]}.jsonl"


def mt5_error_code(mt5: Any) -> str:
    try:
        error = mt5.last_error()
        if isinstance(error, (tuple, list)) and error:
            return str(error[0])
    except Exception:
        pass
    return "unknown"


def load_mt5() -> Any:
    try:
        return importlib.import_module("MetaTrader5")
    except ImportError as exc:
        raise RuntimeError("MetaTrader5 is not installed. Run: pip install MetaTrader5") from exc


def run_collector(
    mt5: Any,
    interval_seconds: int,
    duration_minutes: int,
    output_path: Path,
    *,
    sleep: Callable[[float], None] = time.sleep,
    monotonic: Callable[[], float] = time.monotonic,
    now: Callable[[], datetime] = utc_now,
) -> int:
    validate_cli_values(interval_seconds, duration_minutes)
    initialized = False
    captured = 0
    session_id = uuid.uuid4()

    try:
        if not mt5.initialize():
            raise RuntimeError(f"Could not connect to the open MT5 terminal (error code {mt5_error_code(mt5)}).")
        initialized = True

        output_path.parent.mkdir(parents=True, exist_ok=True)
        deadline = monotonic() + duration_minutes * 60
        next_capture = monotonic()

        print(f"Collector session {session_id} started.")
        print(f"Writing local snapshots to: {output_path}")

        with output_path.open("x", encoding="utf-8", newline="\n") as output:
            while monotonic() < deadline:
                remaining = next_capture - monotonic()
                if remaining > 0:
                    sleep(min(remaining, max(0.0, deadline - monotonic())))
                if monotonic() >= deadline:
                    break

                account = mt5.account_info()
                if account is None:
                    print(f"Warning: account snapshot unavailable (error code {mt5_error_code(mt5)}); sample skipped.", file=sys.stderr)
                    next_capture += interval_seconds
                    continue

                positions = mt5.positions_get()
                if positions is None:
                    print(f"Warning: positions unavailable (error code {mt5_error_code(mt5)}); sample skipped.", file=sys.stderr)
                    next_capture += interval_seconds
                    continue

                snapshot = build_snapshot(account, positions, interval_seconds, now())
                output.write(serialize_snapshot(snapshot) + "\n")
                output.flush()
                captured += 1
                print(f"Captured snapshot {captured} at {snapshot['capturedAt']}")
                next_capture += interval_seconds
    finally:
        if initialized:
            mt5.shutdown()
        print(f"Collector session {session_id} stopped. Snapshots captured: {captured}")

    return captured


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Capture local MT5 account snapshots to JSONL.")
    parser.add_argument("--interval", type=int, default=DEFAULT_INTERVAL_SECONDS, help="Polling interval in seconds (minimum: 5; default: 60).")
    parser.add_argument("--duration", type=int, default=DEFAULT_DURATION_MINUTES, help="Capture duration in minutes (recommended: 30-60; default: 30).")
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parent / "output", help="Local output directory.")
    args = parser.parse_args(argv)
    try:
        args.warnings = validate_cli_values(args.interval, args.duration)
    except ValueError as exc:
        parser.error(str(exc))
    return args


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    for warning in args.warnings:
        print(f"Warning: {warning}", file=sys.stderr)

    try:
        mt5 = load_mt5()
        output_path = create_output_path(args.output_dir)
        run_collector(mt5, args.interval, args.duration, output_path)
        return 0
    except KeyboardInterrupt:
        print("Interrupted by user. Local output was flushed.")
        return 0
    except (OSError, RuntimeError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
