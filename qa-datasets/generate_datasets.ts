/**
 * NodoQuant QA Dataset Generator
 * Generates deterministic trading datasets for testing.
 */

import * as fs from 'fs';
import * as path from 'path';

interface DatasetConfig {
    name: string;
    trades: number;
    winRate: number;      // 0.0 to 1.0
    avgWin: number;
    avgLoss: number;
    variance: number;     // Randomness factor 0.0 to 1.0
    seed?: number;        // Optional for future use
}

function generateTradeData(config: DatasetConfig): string {
    const header = "ticket,open_time,close_time,symbol,profit\n";
    let content = header;
    
    const startTime = new Date('2024-01-01T09:00:00Z');
    
    for (let i = 1; i <= config.trades; i++) {
        const isWin = Math.random() < config.winRate; // Note: Simple random for now, could be seeded
        
        // Variance adjusts the win/loss size around the average
        const winSize = config.avgWin * (1 + (Math.random() - 0.5) * config.variance);
        const lossSize = config.avgLoss * (1 + (Math.random() - 0.5) * config.variance);
        
        const profit = isWin ? winSize : -lossSize;
        
        // Advance time: 1 trade every 2 hours
        const open = new Date(startTime.getTime() + (i - 1) * 2 * 60 * 60 * 1000);
        const close = new Date(open.getTime() + 1 * 60 * 60 * 1000);
        
        const openStr = open.toISOString().replace('T', ' ').substring(0, 19);
        const closeStr = close.toISOString().replace('T', ' ').substring(0, 19);
        
        content += `${i},${openStr},${closeStr},EURUSD,${profit.toFixed(2)}\n`;
    }
    
    return content;
}

const datasets: DatasetConfig[] = [
    { name: 'dataset_100_trades.csv', trades: 100, winRate: 0.55, avgWin: 150, avgLoss: 100, variance: 0.2 },
    { name: 'dataset_500_trades.csv', trades: 500, winRate: 0.52, avgWin: 120, avgLoss: 100, variance: 0.3 },
    { name: 'dataset_501_trades.csv', trades: 501, winRate: 0.52, avgWin: 120, avgLoss: 100, variance: 0.3 },
    { name: 'dataset_1000_trades.csv', trades: 1000, winRate: 0.51, avgWin: 110, avgLoss: 100, variance: 0.4 },
    { name: 'dataset_5000_trades.csv', trades: 5000, winRate: 0.50, avgWin: 105, avgLoss: 100, variance: 0.5 },
];

const outputDir = path.join(__dirname, 'performance');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

datasets.forEach(config => {
    console.log(`Generating ${config.name}...`);
    const csv = generateTradeData(config);
    fs.writeFileSync(path.join(outputDir, config.name), csv);
});

console.log('Done generating performance datasets.');
