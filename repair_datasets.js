const fs = require('fs');
const path = require('path');

const dirs = ['risk', 'stability'];
const baseDate = new Date('2024-01-01T12:00:00Z');

dirs.forEach(dir => {
    const dirPath = path.join(__dirname, 'qa-datasets', dir);
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.csv'));
    
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        
        if (lines[0].includes('close_time')) return; // Already fixed

        const headers = lines[0].split(',');
        const profitIdx = headers.indexOf('profit');
        
        if (profitIdx === -1) return;

        const newLines = ['ticket,close_time,symbol,profit'];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            const ticket = cols[0];
            const profit = cols[profitIdx];
            const date = new Date(baseDate.getTime() + i * 3600000).toISOString().replace('T', ' ').substring(0, 19);
            newLines.push(`${ticket},${date},EURUSD,${profit}`);
        }
        
        fs.writeFileSync(filePath, newLines.join('\n') + '\n');
        console.log(`Repaired ${file}`);
    });
});
