import json
import math
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

from collector import (
    SNAPSHOT_KEYS,
    build_snapshot,
    create_output_path,
    serialize_snapshot,
    validate_cli_values,
)


CAPTURED_AT = datetime(2026, 9, 12, 1, 0, tzinfo=timezone.utc)


class CollectorTests(unittest.TestCase):
    def test_account_info_mock_builds_expected_snapshot(self):
        account = SimpleNamespace(balance=100000.0, equity=99975.5, profit=-24.5, margin=800.0, margin_free=99175.5)
        snapshot = build_snapshot(account, [object(), object()], 60, CAPTURED_AT)

        self.assertEqual(snapshot, {
            "capturedAt": "2026-09-12T01:00:00.000Z",
            "balance": 100000.0,
            "equity": 99975.5,
            "floatingPnl": -24.5,
            "margin": 800.0,
            "freeMargin": 99175.5,
            "openPositions": 2,
            "captureMode": "poll",
            "intervalMs": 60000,
            "source": "mt5",
        })

    def test_missing_fields_remain_null(self):
        snapshot = build_snapshot(SimpleNamespace(), [], 60, CAPTURED_AT)
        for field in ("balance", "equity", "floatingPnl", "margin", "freeMargin"):
            self.assertIsNone(snapshot[field])

    def test_nan_and_infinity_become_null(self):
        account = SimpleNamespace(balance=math.nan, equity=math.inf, profit=-math.inf, margin=1.0, margin_free=None)
        snapshot = build_snapshot(account, [], 60, CAPTURED_AT)
        self.assertIsNone(snapshot["balance"])
        self.assertIsNone(snapshot["equity"])
        self.assertIsNone(snapshot["floatingPnl"])
        self.assertEqual(snapshot["margin"], 1.0)

    def test_snapshot_contains_no_sensitive_fields(self):
        account = SimpleNamespace(
            balance=1.0,
            equity=1.0,
            profit=0.0,
            margin=0.0,
            margin_free=1.0,
            login=123456,
            server="SensitiveBroker-Server",
            name="Private Name",
            company="Private Broker",
        )
        snapshot = build_snapshot(account, [SimpleNamespace(ticket=999, comment="private")], 60, CAPTURED_AT)
        self.assertEqual(set(snapshot), SNAPSHOT_KEYS)
        serialized = serialize_snapshot(snapshot)
        for forbidden in ("login", "123456", "server", "SensitiveBroker", "Private Name", "ticket", "comment"):
            self.assertNotIn(forbidden, serialized)

    def test_jsonl_serialization_is_one_valid_line(self):
        snapshot = build_snapshot(SimpleNamespace(balance=0.0), [], 60, CAPTURED_AT)
        line = serialize_snapshot(snapshot)
        self.assertNotIn("\n", line)
        self.assertEqual(json.loads(line), snapshot)

    def test_cli_interval_and_duration_validation(self):
        with self.assertRaisesRegex(ValueError, "at least 5"):
            validate_cli_values(4, 30)
        with self.assertRaisesRegex(ValueError, "greater than zero"):
            validate_cli_values(60, 0)
        self.assertTrue(validate_cli_values(5, 10))
        self.assertEqual(validate_cli_values(60, 30), [])

    def test_output_path_does_not_overwrite_existing_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            first = create_output_path(root, CAPTURED_AT)
            first.touch()
            second = create_output_path(root, CAPTURED_AT)
            self.assertNotEqual(first, second)
            self.assertFalse(second.exists())


if __name__ == "__main__":
    unittest.main()
