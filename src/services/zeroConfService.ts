import bonjour from 'bonjour';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ZeroConfService', 'info');


export interface ZeroConfConfig {
    serviceName: string;
    serviceType: string;
    port: number;
    ssid?: string;
    password?: string;
    // Optional properties with defaults
    hostname?: string;
    board?: string;
    firmware?: string;
    version?: string;
    build?: string;
    gitHash?: string;
    gitBranch?: string;
    vendor?: string;
    model?: string;
    capabilities?: string;
    description?: string;
    status?: string;
    state?: string;
}

export class ZeroConfService {
    private bonjourInstance: any = null;
    private publishedServices: any[] = [];
    private config: ZeroConfConfig;

    constructor(config: ZeroConfConfig) {
        // Set defaults for optional properties
        this.config = {
            hostname: 'eWinchETek',
            board: 'ESP32',
            firmware: '1.0.0',
            version: '1.0.0',
            build: '2024.01.01',
            gitHash: 'unknown',
            gitBranch: 'main',
            vendor: 'ETek',
            model: 'eWinch',
            capabilities: 'winch-control,websocket,http',
            description: 'eWinch WebSocket Controller',
            ...config
        };
    }

    /**
     * Advertise the service using mDNS/Bonjour protocol
     * Matching exactly what the Arduino BonjourService advertises
     */
    public advertiseService(): void {
        try {
            // Advertise via mDNS/Bonjour (for React Native Zeroconf)
            this.advertiseMDNS();
        } catch (err) {
            logger.error('❌ Error advertising service:', err);
        }
    }

    /**
     * Advertise service via mDNS/Bonjour protocol
     */
    private advertiseMDNS(): void {
        try {
            // Validate required properties
            if (!this.config.port) {
                throw new Error('port is required for mDNS advertisement');
            }
            if (!this.config.serviceName) {
                throw new Error('serviceName is required for mDNS advertisement');
            }
            this.bonjourInstance = bonjour();

            // Advertise WebSocket service via mDNS
            this.bonjourInstance.publish({
                name: this.config.serviceName,
                type: 'ws',  // Use proper mDNS service type format
                port: this.config.port,
                txt: {
                    name: this.config.serviceName,
                    role: "e-winch controller",
                    proto: "websocket",
                    path: "/",
                    hostname: this.config.hostname,
                    board: this.config.board,
                    fw: this.config.firmware,
                    version: this.config.version,
                    build: this.config.build,
                    type: "winch-controller",
                    vendor: this.config.vendor,
                    model: this.config.model,
                    capabilities: this.config.capabilities,
                    description: this.config.description,
                    connection: "websocket",
                    status: "active",
                    git_hash: this.config.gitHash,
                    git_branch: this.config.gitBranch
                }
            });

            // Store the service info after successful advertisement
            this.storeServiceInfo();

            logger.info(`🌐 mDNS service advertised: ${this.config.serviceName} (_ws._tcp) on port ${this.config.port}`);

        } catch (err) {
            logger.error('❌ Error advertising mDNS service:', err);
        }
    }

    // Store the published service info
    private storeServiceInfo(): void {
        this.publishedServices.push({
            name: this.config.serviceName,
            type: this.config.serviceType,
            port: this.config.port,
            hostname: this.config.hostname
        });
    }

    /**
     * Update service status (matching Arduino updateServiceStatus)
     */
    public updateServiceStatus(status: string): void {
        try {
            logger.info(`🔄 Updating service status to: ${status}`);
            // In a real mDNS implementation, this would update the TXT records
            // For now, we'll update the config
            this.config.status = status;

            // Note: To update mDNS TXT records in real-time, we'd need to
            // stop and restart the advertisement with new TXT data
        } catch (err) {
            logger.error(`❌ Warning: Failed to update service status to: ${status}`, err);
        }
    }

    /**
     * Update WebSocket state (matching Arduino updateWebSocketState)
     */
    public updateWebSocketState(state: string): void {
        try {
            logger.info(`🔄 Updating WebSocket state to: ${state}`);
            // In a real mDNS implementation, this would update the TXT records
            // For now, we'll update the config
            this.config.state = state;

            // Note: To update mDNS TXT records in real-time, we'd need to
            // stop and restart the advertisement with new TXT data
        } catch (err) {
            logger.error(`❌ Warning: Failed to update WebSocket state to: ${state}`, err);
        }
    }

    /**
     * Stop advertising the service
     */
    public stopService(): void {
        // Stop mDNS service
        if (this.bonjourInstance) {
            try {
                this.bonjourInstance.destroy();
                this.bonjourInstance = null;
                logger.info(`🛑 mDNS service stopped: ${this.config.serviceName}`);
            } catch (err) {
                logger.error('❌ Error stopping mDNS service:', err);
            }
        }

        // Clear the published services array
        this.publishedServices = [];
    }

    /**
     * Get the current service status
     */
    public isServiceActive(): boolean {
        return this.bonjourInstance !== null && this.publishedServices.length > 0;
    }

    /**
     * Get service configuration
     */
    public getConfig(): ZeroConfConfig {
        return { ...this.config };
    }

    /**
     * Get discovery information for clients
     */
    public getDiscoveryInfo(): string {
        return `mDNS service: ${this.config.serviceName} (_ws._tcp) on port ${this.config.port}`;
    }

    /**
     * Get current hostname (matching Arduino getCurrentHostname)
     */
    public getCurrentHostname(): string {
        return this.config.hostname || 'eWinchETek';
    }
}
