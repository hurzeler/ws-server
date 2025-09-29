import { WebSocketServer, WebSocket } from 'ws';
import * as os from 'os';
import { Mode } from '@/types/winchEnums';
import { ZeroConfService } from '@/services/zeroConfService';
import { createLogger, format, transports } from 'winston';
import { createColoredLoggerFormat } from '@/utils/loggerFormat';

const logger = createLogger({
    level: 'debug',
    format: format.combine(
        createColoredLoggerFormat('WebSocketController')
    ),
    transports: [
        new transports.Console()
    ]
});
import { WinchController } from '@/controllers/winchController';
import { networkConfig } from '@/config/network';
import { getCommandsByState } from '@/config/commands';

export class WebSocketController {
    private wss!: WebSocketServer;
    private readonly WS_PORT = networkConfig.port;
    private winchController: WinchController;
    private zeroConfService: ZeroConfService;
    private intervalId: ReturnType<typeof setInterval> | null = null;

    constructor(winchController: WinchController) {
        this.winchController = winchController;
        this.zeroConfService = new ZeroConfService({
            port: this.WS_PORT,
            serviceName: networkConfig.serviceName,
            serviceType: networkConfig.serviceType,
            ssid: networkConfig.ssid,
            password: networkConfig.password
        });
        this.setupStateListeners();
    }

    public start(): void {

        this.setupWebSocket();

        // Wait a bit before starting simulation to ensure WebSocket is ready
        setTimeout(() => {
            this.setupIntervalLoop();
        }, 100);

        if (this.winchController.getState().mode === Mode.SAFE) {
            logger.info("✅ Set winch safe");
        } else {
            logger.error("Set winch unsafe");
        }

        // log("✅ initPreferences end");
        // log("🔒 The SS button is on");
    }

    public stop(): Promise<void> {
        return new Promise((resolve) => {

            // Stop simulation through the winch controller
            this.winchController.stopSimulation();

            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }

            // Stop ZeroConf service
            this.zeroConfService.stopService();

            if (this.wss) {
                // Close all client connections first
                this.wss.clients.forEach((client) => {
                    client.close();
                });

                // Close the WebSocket server with timeout
                const closeTimeout = setTimeout(() => {
                    logger.warn('WebSocket server close timeout, forcing resolve');
                    resolve();
                }, 2000);

                this.wss.close(() => {
                    clearTimeout(closeTimeout);
                    logger.info('🛑 WebSocket server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    private setupStateListeners(): void {
        // Set state change callback to handle WebSocket broadcasting
        this.winchController.setStateChangeCallback((property: string, value: number | string | Date) => {
            // Find commands that use this state property
            const commands = getCommandsByState(property);

            if (commands.length > 0) {
                // Use the first command's format (there should typically be only one)
                const command = commands[0];
                if (command.response) {
                    let formattedValue = String(value);

                    // Apply formatting options if available
                    if (command.formatOptions?.decimalPlaces !== undefined) {
                        formattedValue = Number(value).toFixed(command.formatOptions.decimalPlaces);
                    }

                    const message = command.response.replace('{value}', formattedValue);
                    //logger.debug(`🔧 State change: ${property}=${value} → ${message} (command: ${command.action})`);
                    this.broadcastMessage(message);
                } else {
                    // Fallback to raw format if no format defined
                    //logger.debug(`🔧 State change: ${property}=${value} → ${property}${value} (no format)`);
                    this.broadcastMessage(`${property}${value}`);
                }
            } else {
                // Fallback to raw format if no command mapping found
                //logger.debug(`🔧 State change: ${property}=${value} → ${property}${value} (no command)`);
                this.broadcastMessage(`${property}${value}`);
            }
        });

        // Set broadcast callback for direct message broadcasting
        this.winchController.setBroadcastCallback((message: string) => {
            this.broadcastMessage(message);
        });
    }

    private setupWebSocket(): void {
        try {
            logger.debug(`🔌 Setting up WebSocket server on port ${this.WS_PORT}...`);

            // Check if server already exists
            if (this.wss) {
                logger.warn('⚠️ WebSocket server already exists, closing previous instance');
                this.wss.close();
            }

            logger.debug(`🔌 Creating WebSocket server on port ${this.WS_PORT}...`);

            // Create WebSocket server bound to all network interfaces
            this.wss = new WebSocketServer({
                port: this.WS_PORT,
                host: '0.0.0.0' // Bind to all interfaces for network access
            });

            logger.debug(`✅ WebSocket server created successfully on port ${this.WS_PORT}`);

            // Advertise service via ZeroConf
            this.zeroConfService.advertiseService();

        } catch (err) {
            logger.error('❌ Error setting up WebSocket server:', err);
            throw err;
        }

        this.wss.on('connection', (ws: WebSocket, req) => {
            const clientIP = req.socket.remoteAddress;
            const forwardedFor = req.headers['x-forwarded-for'];
            const realIP = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : clientIP;

            logger.info(`🔗 Client connected from IP: ${realIP}`);
            this.sendInitialStates(ws);

            // Set up ping/pong heartbeat via messages
            const pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send('ping');
                } else {
                    clearInterval(pingInterval);
                }
            }, 30000); // Ping every 30 seconds

            ws.on('message', (message) => {
                const msg = message.toString();
                logger.debug(`🔄 handleMessage(): Received message: ${msg}`);

                // Handle pong response
                if (msg === 'pong') {
                    logger.info(`💓 Pong received from ${realIP}`);
                    return;
                }

                // Handle regular messages
                this.handleWebSocketMessage(msg, ws);
            });

            ws.on('close', (code, reason) => {
                logger.info(`🔌 Client disconnected from IP: ${realIP}`);
                logger.debug(`   Close Code: ${code}`);
                logger.debug(`   Close Reason: ${reason || 'No reason provided'}`);
                logger.debug(`   Was Clean: ${code === 1000}`);
                clearInterval(pingInterval);
            });

            ws.on('error', (error) => {
                logger.info(`❌ WebSocket error from ${realIP}:`, error);
                logger.info(`   Error Message: ${error.message || 'No message'}`);
                clearInterval(pingInterval);
            });
        });

        // Get local IP for display purposes
        const localIP = this.getLocalIP();
        logger.info(`🌐 WebSocket server is listening on:`);
        logger.info(`   Local: ws://127.0.0.1:${this.WS_PORT}`);
        logger.info(`   Network: ws://${localIP}:${this.WS_PORT}`);
    }

    private sendInitialStates(ws: WebSocket): void {

        // Send only essential initial states that aren't handled by simulation
        this.winchController.setState('mode', Mode.SAFE);
        this.winchController.setState('WPowerPotVal', 0);
        this.winchController.setState('WRegenPotVal', 0);
        this.winchController.setState('hallRPM', 0);
        this.winchController.setState('VBAT', 0);
        this.winchController.setState('serverTime', new Date());

    }

    private handleWebSocketMessage(message: string, ws: WebSocket): void {
        // Delegate Winch-specific message handling to the dedicated handler
        this.winchController.processMessage(message, ws);
    }

    private setupIntervalLoop(): void {
        // Simulation is now started automatically in WinchController constructor

        // Set up a separate interval for safety system checks
        this.intervalId = setInterval(() => {
            this.checkSafetySystems();
        }, 1000); // Reduced from 100ms to 1000ms (1 second)

    }

    private checkSafetySystems(): void {
        // Safety system checks can be implemented here
        // For now, just simulate hardware readings
    }

    private broadcastMessage(message: string): void {
        if (this.wss && this.wss.clients) {

            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    //logger.debug(`🔊 Broadcasting message to client: ${message}`);
                    client.send(message);
                } else {
                    logger.warn(`Client not ready, state: ${client.readyState}`);
                }
            });
        } else {
            logger.warn('WebSocket server or clients not available');
        }
    }



    private getLocalIP(): string {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            const iface = interfaces[name];
            if (iface) {
                for (const alias of iface) {
                    if (alias.family === 'IPv4' && !alias.internal) {
                        return alias.address;
                    }
                }
            }
        }
        return 'localhost'; // fallback
    }

}
