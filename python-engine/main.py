from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from datetime import datetime

app = FastAPI(title="NodoQuant Analytics Engine")

class Trade(BaseModel):
    trade_id: Optional[str] = None
    symbol: Optional[str] = None
    direction: Optional[str] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    position_size: Optional[float] = None
    entry_time: Optional[datetime] = None
    exit_time: Optional[datetime] = None
    profit_loss: float
    risk_reward: Optional[float] = None
    duration_minutes: Optional[float] = None

class AnalysisRequest(BaseModel):
    trades: List[Trade]

class AnalyticsMetrics(BaseModel):
    total_trades: int
    win_rate: float
    profit_factor: float
    expectancy_r: float
    average_r: float
    max_drawdown_r: float
    strategy_score: float

@app.get("/")
def health_check():
    return {"status": "ok", "service": "NodoQuant Analytics Engine"}

def calculate_r_multiple(trade, avg_loss):
    """
    Calculate R multiple for a single trade.
    If stop_loss is available, 1R = |entry - stop_loss| * position_size (or equivalent risk cash)
    Fallback: use average loss as 1R.
    """
    # Check if we can compute risk accurately
    if trade.get('stop_loss') and trade.get('entry_price') and trade.get('position_size') and trade['entry_price'] != trade['stop_loss']:
        # This is a simplification. Actual risk depends on point value, lot size etc.
        # R = Profit / Risk
        # Try to infer risk from prices if we assume base currency risk
        risk_per_unit = abs(trade['entry_price'] - trade['stop_loss'])
        total_risk = risk_per_unit * trade['position_size']
        if total_risk > 0:
            return trade['profit_loss'] / total_risk
            
    # Fallback to average loss
    if avg_loss < 0:
        return trade['profit_loss'] / abs(avg_loss)
    return trade['profit_loss'] # Fallback if no losses (1 profit = 1R effectively)

@app.post("/analyze", response_model=AnalyticsMetrics)
def analyze_trades(request: AnalysisRequest):
    if not request.trades or len(request.trades) < 2:
        raise HTTPException(status_code=400, detail="Not enough trades to analyze")

    # Convert to DataFrame
    df = pd.DataFrame([t.dict() for t in request.trades])
    
    total_trades = len(df)
    
    # Win rate
    wins = df[df['profit_loss'] > 0]
    losses = df[df['profit_loss'] <= 0]
    win_rate = len(wins) / total_trades if total_trades > 0 else 0
    
    # Profit Factor
    gross_profit = wins['profit_loss'].sum()
    gross_loss = abs(losses['profit_loss'].sum())
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
    
    # Calculate R Multiples
    avg_loss = losses['profit_loss'].mean() if len(losses) > 0 else -1.0
    
    # Apply R calculation function
    df['r_multiple'] = df.apply(lambda row: calculate_r_multiple(row, avg_loss), axis=1)
    
    expectancy_r = df['r_multiple'].mean() if total_trades > 0 else 0
    average_r = df['r_multiple'].mean() # Same in simple terms, but can differ if weighted
    
    # Drawdown in R
    df['cumulative_r'] = df['r_multiple'].cumsum()
    df['peak_r'] = df['cumulative_r'].cummax()
    df['drawdown_r'] = df['cumulative_r'] - df['peak_r']
    max_drawdown_r = abs(df['drawdown_r'].min()) if total_trades > 0 else 0
    
    # Strategy Score Calculation
    # Profitability (30%): Scaled expectancy and profit factor
    prof_score = min(max((expectancy_r * 50) + (min(profit_factor, 3.0) / 3.0 * 50), 0), 100) * 0.30
    
    # Consistency (25%): Win rate stability (closer to 50% is solid, >40% is good)
    cons_score = min(max((win_rate * 100), 0), 100) * 0.25
    
    # Risk Control (20%): Max Drawdown in R (inverse)
    risk_score = max(100 - (max_drawdown_r * 10), 0) * 0.20
    
    # Sample Confidence (15%): Up to 100 trades scales to 15%
    samp_score = min(total_trades / 100.0 * 100, 100) * 0.15
    
    # Risk Reward Quality (10%): average R > 1.5 is perfect
    avg_win_r = df[df['r_multiple'] > 0]['r_multiple'].mean() if len(wins) > 0 else 0
    rr_score = min(avg_win_r / 2.0 * 100, 100) * 0.10
    
    strategy_score = prof_score + cons_score + risk_score + samp_score + rr_score
    
    return AnalyticsMetrics(
        total_trades=total_trades,
        win_rate=win_rate,
        profit_factor=profit_factor,
        expectancy_r=expectancy_r,
        average_r=average_r,
        max_drawdown_r=max_drawdown_r,
        strategy_score=strategy_score
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
