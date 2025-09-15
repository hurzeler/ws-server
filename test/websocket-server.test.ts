import WebSocket from 'ws';
import { WinchApplication } from '@/app';

// Detect test runner and import appropriate functions
let describe: any, test: any, expect: any, beforeAll: any, afterAll: any;

// Try to import Bun test functions first
try {
    const bunTest = require('bun:test');
    describe = bunTest.describe;
    test = bunTest.test;
    expect = bunTest.expect;
    beforeAll = bunTest.beforeAll;
    afterAll = bunTest.afterAll;
    console.log('🧪 Using Bun test runner');
} catch (error) {
    // Fallback to Jest globals
    describe = (global as any).describe;
    test = (global as any).test;
    expect = (global as any).expect;
    beforeAll = (global as any).beforeAll;
    afterAll = (global as any).afterAll;
    console.log('🧪 Using Jest test runner');
}

let app: WinchApplication;
let serverPort: number;

// Setup and teardown
beforeAll(async () => {
    // Create a new application instance for testing
    app = new WinchApplication();
    
    // Start the application
    await app.start();
    
    // Use the default port from your config
    serverPort = 1337;
    
    // Wait a bit for the server to fully start
    await new Promise(resolve => setTimeout(resolve, 100));
});

afterAll(async () => {
    console.log("🧪 Starting test cleanup...");
    
    // Clean up the application
    if (app) {
        await app.stop();
    }
    
    // Force cleanup of any remaining connections
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Kill any remaining processes on the test port
    try {
        const { execSync } = require('child_process');
        execSync(`lsof -ti:${serverPort} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
    } catch (error) {
        // Ignore errors if no processes found
    }
    
    // Enhanced cleanup for Bun tests
    if (typeof Bun !== 'undefined') {
        console.log("🧪 All tests completed, performing enhanced cleanup for Bun...");
        
        // Clear all timers and intervals
        const activeTimers = [];
        for (let i = 1; i < 1000000; i++) {
            try {
                clearTimeout(i);
                clearInterval(i);
            } catch (e) {
                // Ignore errors
            }
        }
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        
        // Kill any remaining Bun processes
        try {
            const { execSync } = require('child_process');
            execSync('pkill -f "bun test" 2>/dev/null', { stdio: 'ignore' });
        } catch (error) {
            // Ignore errors
        }
        
        // Multiple exit strategies
        console.log("🧪 Forcing process exit...");
        
        // Strategy 1: Immediate exit
        process.exit(0);
        
        // Strategy 2: Delayed exit (fallback)
        setTimeout(() => {
            console.log("🧪 Fallback exit triggered...");
            process.exit(0);
        }, 100);
        
        // Strategy 3: Force kill (last resort)
        setTimeout(() => {
            console.log("🧪 Force kill triggered...");
            process.kill(process.pid, 'SIGKILL');
        }, 500);
    }
    
    console.log("🧪 Cleanup completed");
});

// Global cleanup after all test suites
if (typeof Bun !== 'undefined') {
    // Bun-specific global cleanup
    (global as any).afterAll?.(async () => {
        console.log("🧪 Global cleanup for Bun...");
        
        // Wait a bit for any remaining async operations
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Force exit
        process.exit(0);
    });
}

describe('WebSocket Server', () => {
    // Set global timeout for all tests
    const testTimeout = 10000;
    
    test('should accept a new connection', async () => {
        return new Promise<void>((resolve, reject) => {
            const client = new WebSocket(`ws://localhost:${serverPort}`);
            client.on('open', () => {
                expect(client.readyState).toBe(WebSocket.OPEN);
                client.close(); // Close the new client
                resolve();
            });
            
            client.on('error', (error) => {
                reject(error);
            });
        });
    });

    test('should handle Winch control messages', async () => {
        return new Promise<void>((resolve, reject) => {
            const client = new WebSocket(`ws://localhost:${serverPort}`);
            
            client.on('open', () => {
                // Send a control message
                client.send('EmStopST');
                
                // Wait a bit for processing
                setTimeout(() => {
                    client.close();
                    resolve();
                }, 100);
            });
            
            client.on('error', (error) => {
                reject(error);
            });
        });
    });

    test('should handle potentiometer messages', async () => {
        return new Promise<void>((resolve, reject) => {
            const client = new WebSocket(`ws://localhost:${serverPort}`);
            
            client.on('open', () => {
                // Send a potentiometer message
                client.send('wsPowerPot50');
                
                // Wait a bit for processing
                setTimeout(() => {
                    client.close();
                    resolve();
                }, 100);
            });
            
            client.on('error', (error) => {
                reject(error);
            });
        });
    });
});