import fs from 'fs';
import path from 'path';
import { parseTrades, type Trade } from '../../lib/analyzer/parser';

/**
 * Loads a CSV dataset from the qa-datasets directory and parses it into Trade objects.
 * @param relativePath Path relative to the project root (e.g., 'qa-datasets/baseline/baseline_strategy_profitable.csv')
 */
export function loadDataset(relativePath: string): Trade[] {
    const fullPath = path.resolve(process.cwd(), relativePath);
    
    if (!fs.existsSync(fullPath)) {
        throw new Error(`Dataset not found at path: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const fileName = path.basename(fullPath);
    
    try {
        const result = parseTrades(content, fileName);
        return result.trades;
    } catch (error) {
        console.error(`Error parsing dataset ${fileName}:`, error);
        throw error;
    }
}

/**
 * Lists all CSV files in a given directory within qa-datasets.
 */
export function listDatasets(dirPath: string): string[] {
    const fullPath = path.resolve(process.cwd(), dirPath);
    if (!fs.existsSync(fullPath)) return [];
    
    return fs.readdirSync(fullPath)
        .filter(file => file.endsWith('.csv'))
        .map(file => path.join(dirPath, file));
}
