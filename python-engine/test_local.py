import json
from main import analyze_trades, AnalysisRequest, Trade
import csv
from datetime import datetime

with open('test_medium.csv', 'r') as f:
    reader = csv.DictReader(f)
    trades = []
    for i, row in enumerate(reader):
        trades.append(Trade(
            trade_id=f"test_{i}",
            entry_time=datetime.strptime(row['EntryTime'], '%Y-%m-%d %H:%M:%S'),
            exit_time=datetime.strptime(row['Datetime'], '%Y-%m-%d %H:%M:%S'),
            profit_loss=float(row['Profit']),
            symbol=row['Symbol'],
            position_size=float(row['Volume']),
            direction=row['Direction'],
            entry_price=float(row['EntryPrice']),
            exit_price=float(row['ExitPrice']),
            stop_loss=float(row['StopLoss']),
            take_profit=float(row['TakeProfit'])
        ))

req = AnalysisRequest(trades=trades)
try:
    res = analyze_trades(req)
    print("Success:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
