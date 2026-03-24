import os
import csv
import random
from datetime import datetime, timedelta

def generate_dataset(filename, rules):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['trade_id', 'date', 'symbol', 'side', 'profit'])
        
        current_date = datetime(2024, 1, 1)
        
        for rule in rules:
            count = rule['count']
            winrate = rule['winrate']
            rr = rule['rr']
            base_risk = rule.get('base_risk', 50)  # $50 risk per trade
            streak = rule.get('streak', False)
            
            if streak:
                # Force consecutive losses for streak
                results = [-base_risk] * count
            else:
                wins = int(count * winrate)
                losses = count - wins
                results = [base_risk * rr] * wins + [-base_risk] * losses
                random.shuffle(results)
            
            for index, profit in enumerate(results):
                side = random.choice(['BUY', 'SELL'])
                # add some noise
                noise = random.uniform(-0.1, 0.1) * abs(profit)
                final_profit = round(profit + noise, 2)
                
                writer.writerow([index + 1, current_date.strftime('%Y-%m-%d'), 'EURUSD', side, final_profit])
                
                # Advance 1-3 days
                current_date += timedelta(days=random.randint(1, 3))

# Dataset A: High Drawdown (200 trades, 55% WR, 1.4 RR, long losing streaks)
# Let's break it down:
# 80 trades normal
# 20 trades consecutive loss streak (simulating high DD)
# 100 trades normal
generate_dataset('c:/Users/Admin/Desktop/Proyectos/NodoQuant/tests/datasets/dataset_a_high_dd.csv', [
    {'count': 80, 'winrate': 0.55, 'rr': 1.4},
    {'count': 20, 'winrate': 0.0, 'rr': 1.4, 'streak': True}, # big drawdown
    {'count': 100, 'winrate': 0.58, 'rr': 1.4} # slightly better to recover 55% average
])

# Dataset B: Overfitted (80 trades, 65% WR, 1.2 RR)
generate_dataset('c:/Users/Admin/Desktop/Proyectos/NodoQuant/tests/datasets/dataset_b_overfitted.csv', [
    {'count': 80, 'winrate': 0.65, 'rr': 1.2}
])

# Dataset C: Edge Decay (150 trades, first 75 profitable, last 75 losing)
generate_dataset('c:/Users/Admin/Desktop/Proyectos/NodoQuant/tests/datasets/dataset_c_decay.csv', [
    {'count': 75, 'winrate': 0.60, 'rr': 1.5},
    {'count': 75, 'winrate': 0.35, 'rr': 0.8}
])

print("Datasets generated successfully in tests/datasets/")
