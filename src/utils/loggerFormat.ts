import { format } from 'winston';

/**
 * Creates a custom logger format with colored log levels on white background
 * and normal formatting for the rest of the message
 * @param prefix Optional prefix. If not provided, will try to infer from caller's filename
 */
export function createColoredLoggerFormat(prefix?: string) {
    return format.printf(({ level, message }) => {
        const RESET = '\x1b[0m';
        const BG_RESET = '\x1b[49m';
        const BG_WHITE = '\x1b[47m';
        
        // Define colors for different log levels
        let levelColor = '';
        switch (level.toLowerCase()) {
            case 'info':
                levelColor = '\x1b[32m'; // Green
                break;
            case 'debug':
                levelColor = '\x1b[34m'; // Blue
                break;
            case 'error':
                levelColor = '\x1b[31m'; // Red
                break;
            case 'warn':
            case 'warning':
                levelColor = '\x1b[33m'; // Yellow
                break;
            default:
                levelColor = '\x1b[37m'; // White
        }
        
        // If no prefix provided, try to infer from caller's filename
        let finalPrefix = prefix;
        if (!finalPrefix) {
            try {
                const stack = new Error().stack;
                if (stack) {
                    const lines = stack.split('\n');
                    // Look for the caller (skip the first few lines which are this function and format.printf)
                    for (let i = 4; i < lines.length; i++) {
                        const line = lines[i];
                        // Look for TypeScript/JavaScript files in the stack trace
                        const match = line.match(/[/\\]([^/\\]+)\.(ts|js):\d+/);
                        if (match) {
                            const filename = match[1];
                            // Skip internal winston/logform files and this utility file
                            if (!filename.includes('logform') && 
                                !filename.includes('winston') && 
                                !filename.includes('loggerFormat') &&
                                !filename.includes('format') &&
                                filename !== 'combine') {
                                finalPrefix = filename.charAt(0).toUpperCase() + filename.slice(1);
                                break;
                            }
                        }
                    }
                }
            } catch (error) {
                // Fallback to no prefix if stack trace parsing fails
                finalPrefix = '';
            }
        }
        
        const prefixText = finalPrefix ? `[${finalPrefix}]: ` : '';
        return `${BG_WHITE}${levelColor} ${level.toUpperCase()} ${BG_RESET}  ${prefixText}${message}`;
    });
}
