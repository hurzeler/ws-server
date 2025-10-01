// Simple custom logger with clickable file locations

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

function getCallerLocation(): string {
    try {
        const stack = new Error().stack;
        if (stack) {
            const lines = stack.split('\n');
            // Skip first 3 lines: Error, getCallerLocation, log method
            for (let i = 3; i < lines.length; i++) {
                const line = lines[i];
                const pathMatch = line.match(/\((.+?):(\d+):(\d+)\)/) || line.match(/at\s+(.+?):(\d+):(\d+)/);
                
                if (pathMatch) {
                    const [, fullPath, lineNum, colNum] = pathMatch;
                    
                    // Skip node_modules and logger files
                    if (fullPath.includes('node_modules')) continue;
                    if (fullPath.includes('logger')) continue;
                    
                    // Look for /src/ files and extract from the last occurrence
                    if (fullPath.includes('/src/')) {
                        const lastSrcIndex = fullPath.lastIndexOf('/src/');
                        const relativePath = fullPath.substring(lastSrcIndex + 1);
                        return `${relativePath}:${lineNum}:${colNum}`;
                    }
                }
            }
        }
    } catch (error) {
        // Ignore errors
    }
    return '';
}

export function createLogger(componentName: string, minLevel: LogLevel = 'info') {
    const minLevelValue = LOG_LEVELS[minLevel];

    const log = (level: LogLevel, ...args: any[]) => {
        if (LOG_LEVELS[level] < minLevelValue) return;

        // Only show location for debug and error logs
        const showLocation = level === 'debug' || level === 'error';
        const location = showLocation ? getCallerLocation() : '';
        
        // Color codes
        const RESET = '\x1b[0m';
        const BG_RESET = '\x1b[49m';
        const BG_WHITE = '\x1b[47m';
        const DIM = '\x1b[2m';
        
        const colors: Record<LogLevel, string> = {
            debug: '\x1b[34m', // Blue
            info: '\x1b[32m',  // Green
            warn: '\x1b[33m',  // Yellow
            error: '\x1b[31m', // Red
        };
        
        const color = colors[level];
        const locationStr = location ? ` ${DIM}(${location})${RESET}` : '';
        const prefix = `${BG_WHITE}${color} ${level.toUpperCase()} ${BG_RESET}  [${componentName}]${locationStr}:`;
        
        console.log(prefix, ...args);
    };

    return {
        debug: (...args: any[]) => log('debug', ...args),
        info: (...args: any[]) => log('info', ...args),
        warn: (...args: any[]) => log('warn', ...args),
        error: (...args: any[]) => log('error', ...args),
    };
}

