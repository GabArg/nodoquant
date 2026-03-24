const fs = require('fs');
const path = require('path');

function generateCSV(name, trades) {
    const header = "ticket,open_time,close_time,symbol,profit\n";
    let content = header;
    const start = new Date('2024-01-01T09:00:00Z');
    
    trades.forEach((profit, i) => {
        const open = new Date(start.getTime() + i * 2 * 60 * 60 * 1000);
        const close = new Date(open.getTime() + 1 * 60 * 60 * 1000);
        content += `${i+1},${open.toISOString().replace('T',' ').substring(0,19)},${close.toISOString().replace('T',' ').substring(0,19)},EURUSD,${profit.toFixed(2)}\n`;
    });
    
    fs.writeFileSync(path.join(__dirname, name), content);
    console.log(`Generated ${name}`);
}

// 1. Robust Strategy (Stable Edge)
const robustProfits = [];
for(let i=0; i<300; i++) {
    robustProfits.push(Math.random() < 0.55 ? 150 : -100);
}
generateCSV('intelligence_robust.csv', robustProfits);

// 2. Random Walk (No Edge)
const randomProfits = [];
for(let i=0; i<300; i++) {
    randomProfits.push(Math.random() < 0.50 ? 100 : -100);
}
generateCSV('intelligence_random.csv', randomProfits);

// 3. Decaying Edge (Good start, bad end)
const decayingProfits = [];
for(let i=0; i<150; i++) {
    decayingProfits.push(Math.random() < 0.60 ? 150 : -100); // Strong baseline
}
for(let i=0; i<50; i++) {
    decayingProfits.push(Math.random() < 0.40 ? 150 : -100); // Decaying recent
}
generateCSV('intelligence_decaying.csv', decayingProfits);
