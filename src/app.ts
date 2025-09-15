import 'module-alias/register';
import { log, debug, error } from '@etek.com.au/logger';
import { WebSocketController } from '@/controllers/webSocketController';
import { CounterService } from '@/services/counterService';
import { WinchController } from '@/controllers/winchController';
import { trace } from 'console';

// Disable debug logs in production
if (process.env.NODE_ENV === "production") {
    console.debug = () => { };
}

class WinchApplication {
    private webSocketController: WebSocketController;
    private counterService: CounterService;
    private winchController: WinchController;

    constructor() {
        // Initialize the counter service
        this.counterService = CounterService.getInstance();

        // Initialize the winch controller
        this.winchController = new WinchController();

        // Initialize the WebSocket controller with the winch controller
        this.webSocketController = new WebSocketController(this.winchController);
    }

    public async start(): Promise<void> {
        try {
            log("--------------- 🚀 WebSocket Server ----------------");

            // Start the WebSocket server
            this.webSocketController.start();

            log(`🔢 Startup counter: ${this.counterService.incrementAndGet()}`);

        } catch (err) {
            error('❌ Failed to start WebSocket Server:', err);
            process.exit(1);
        }
    }

    public async stop(): Promise<void> {
        try {
            log('🛑 Stopping WebSocket Server...');

            // Stop the WebSocket controller
            await this.webSocketController.stop();

            log('✅ WebSocket Server stopped successfully');

        } catch (err) {
            error('❌ Error stopping WebSocket Server:', err);
        }
    }

    private setupGracefulShutdown(): void {
        // Handle SIGINT (Ctrl+C) - simple and direct
        // Global error handling
        process.on('uncaughtException', (err) => {
            error('💥 Uncaught Exception:', err);
            error('Stack trace:', err.stack);
            // Don't exit immediately, let the application handle it
        });

        process.on('unhandledRejection', (reason, promise) => {
            error('💥 Unhandled Rejection at:', promise);
            error('Reason:', reason);
            trace('📍 Unhandled rejection stack trace:');
        });

        process.on('SIGINT', () => {
            log('\n🛑 SIGINT received - starting shutdown...');
            
            // Force exit after a timeout if graceful shutdown fails
            const forceExit = setTimeout(() => {
                log('⚠️ Force exit after timeout...');
                process.exit(1);
            }, 3000);
            
            this.stop().then(() => {
                log('✅ Graceful shutdown completed');
                clearTimeout(forceExit);
                process.exit(0);
            }).catch((error) => {
                error('❌ Error during shutdown:', error);
                clearTimeout(forceExit);
                process.exit(1);
            });
        });

        // Handle SIGTERM
        process.on('SIGTERM', () => {
            log('🛑 Shutting down...');
            
            // Force exit after a timeout if graceful shutdown fails
            const forceExit = setTimeout(() => {
                log('⚠️ Force exit after timeout...');
                process.exit(1);
            }, 3000);
            
            this.stop().then(() => {
                clearTimeout(forceExit);
                process.exit(0);
            }).catch((error) => {
                error('❌ Error during shutdown:', error);
                clearTimeout(forceExit);
                process.exit(1);
            });
        });

        // Handle process exit to ensure cleanup
        process.on('exit', (code) => {
            log(`🔄 Process exiting with code: ${code}`);
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            error('❌ Uncaught Exception:', err);
            this.stop().then(() => process.exit(1)).catch(() => process.exit(1));
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            this.stop().then(() => process.exit(1)).catch(() => process.exit(1));
        });
    }


    public getWebSocketController(): WebSocketController {
        return this.webSocketController;
    }

    public getCounterService(): CounterService {
        return this.counterService;
    }

    public getWinchController(): WinchController {
        return this.winchController;
    }
}

// Export the main class
export { WinchApplication };

// Main execution block - only run when this file is executed directly
if (import.meta.main) {    
    const app = new WinchApplication();
    app.start().catch((error) => {
        error('❌ Failed to start application:', error);
        process.exit(1);
    });
}
