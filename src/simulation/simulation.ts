
import { createLogger } from '@/utils/logger';

const logger = createLogger('Simulation', 'info');
import { WinchController } from '@/controllers/winchController';
import { Mode } from '@/types/winchEnums';

export interface SimulationConfig {
    updateInterval: number;        // milliseconds - main simulation loop
    frequency: number;            // oscillation frequency for simulated values
    enableHardwareSimulation: boolean;
    enableSafetySimulation: boolean;
    // Different intervals for different sensors
    motorTemperatureInterval: number;    // milliseconds
    batteryVoltageInterval: number;     // milliseconds
    rpmInterval: number;                // milliseconds
}

export interface SimulatedValues {
    VBAT: number;
    hallRPM: number;
    motorTemperature: number;
    mainBatteryVoltage: number;
    WPowerPotVal: number;
}

export class SimulationManager {
    private config: SimulationConfig;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private motorTempIntervalId: ReturnType<typeof setInterval> | null = null;
    private batteryVoltageIntervalId: ReturnType<typeof setInterval> | null = null;
    private rpmIntervalId: ReturnType<typeof setInterval> | null = null;
    private isRunning: boolean = false;
    private startTime: number = Date.now();
    private getWinchState: (() => any) | null = null;
    private winchController: WinchController;

    // Simulation state
    private currentTime: number = 0;
    private simulatedValues: SimulatedValues = {
        VBAT: 70,
        hallRPM: 0,
        motorTemperature: 25,
        mainBatteryVoltage: 70,
        WPowerPotVal: 0
    };

    constructor(winchController: WinchController, config: Partial<SimulationConfig> = {}) {
        this.winchController = winchController;

        this.config = {
            updateInterval: 100,           // 100ms default
            frequency: 0.5,                // 0.5 Hz default
            enableHardwareSimulation: true,
            enableSafetySimulation: true,
            motorTemperatureInterval: 5000,    // 5 seconds default
            batteryVoltageInterval: 2000,     // 2 seconds default
            rpmInterval: 500,               // 5 seconds default (slower for better UX)
            ...config
        };
    }

    /**
     * Set the winch state getter function
     */
    public setWinchStateGetter(getter: () => any): void {
        this.getWinchState = getter;
    }

    /**
     * Start the simulation loop
     */
    public start(): void {
        if (this.isRunning) {
            logger.info('⚠️ Simulation is already running');
            return;
        }

        logger.info('🚀 Starting simulation...');
        this.isRunning = true;
        this.startTime = Date.now();

        // Main simulation loop
        this.intervalId = setInterval(() => {
            this.updateSimulation();
        }, this.config.updateInterval);

        // Motor temperature updates (slower)
        this.motorTempIntervalId = setInterval(() => {
            this.updateMotorTemperature();
        }, this.config.motorTemperatureInterval);

        // Battery voltage updates (medium)
        this.batteryVoltageIntervalId = setInterval(() => {
            this.updateBatteryVoltage();
        }, this.config.batteryVoltageInterval);

        // RPM updates (faster)
        this.rpmIntervalId = setInterval(() => {
            this.updateRPM();
        }, this.config.rpmInterval);

        logger.debug(`✅ Simulation started with intervals: Main=${this.config.updateInterval}ms, 
            Temp=${this.config.motorTemperatureInterval}ms, Battery=${this.config.batteryVoltageInterval}ms, RPM=${this.config.rpmInterval}ms`);
        // Simulation started - no callback needed
    }

    /**
     * Stop the simulation loop
     */
    public stop(): void {
        if (!this.isRunning) {
            logger.info('⚠️ Simulation is not running');
            return;
        }

        logger.info('🛑 Stopping simulation...');
        this.isRunning = false;

        // Clear all intervals
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.motorTempIntervalId) {
            clearInterval(this.motorTempIntervalId);
            this.motorTempIntervalId = null;
        }
        if (this.batteryVoltageIntervalId) {
            clearInterval(this.batteryVoltageIntervalId);
            this.batteryVoltageIntervalId = null;
        }
        if (this.rpmIntervalId) {
            clearInterval(this.rpmIntervalId);
            this.rpmIntervalId = null;
        }

        // Simulation stopped - no callback needed
    }

    /**
     * Update simulation values based on current time and state
     */
    private updateSimulation(): void {
        if (!this.isRunning) return;

        this.currentTime = (Date.now() - this.startTime) / 1000; // Time in seconds

        if (this.config.enableSafetySimulation) {
            this.simulateSafetySystems();
        }

    }

    /**
     * Update motor temperature (slower updates)
     */
    private updateMotorTemperature(): void {
        if (!this.isRunning) return;

        this.currentTime = (Date.now() - this.startTime) / 1000;
        this.simulatedValues.motorTemperature = Math.floor(25 + 10 * Math.sin(this.config.frequency * 0.1 * this.currentTime));

        // Update temperature via WinchStateManager
        this.winchController.setStateValue('motorTemperature', this.simulatedValues.motorTemperature);
    }

    /**
     * Update battery voltage (medium updates)
     */
    private updateBatteryVoltage(): void {
        if (!this.isRunning) return;

        this.currentTime = (Date.now() - this.startTime) / 1000;
        this.simulatedValues.VBAT = Math.floor(70 + 5 * Math.sin(this.config.frequency * this.currentTime));
        this.simulatedValues.mainBatteryVoltage = this.simulatedValues.VBAT;

        // Update battery values via WinchStateManager
        this.winchController.setStateValue('VBAT', this.simulatedValues.VBAT);
        this.winchController.setStateValue('mainBatteryVoltage', this.simulatedValues.mainBatteryVoltage);
    }

    /**
     * Update RPM (faster updates)
     */
    private updateRPM(): void {
        if (!this.isRunning || !this.getWinchState) return;

        const winchState = this.getWinchState();
        const { mode } = winchState;

        const time = this.currentTime;
        const frequency = this.config.frequency;

        // Simulate RPM and power based on winch mode
        if (mode === Mode.TOW) {
            // Tow operation: oscillate between 200 and 500 RPM with 10-second period
            // sin wave: amplitude = 150, offset = 350, period = 10 seconds
            const towRPM = 350 + 150 * Math.sin(2 * Math.PI * time / 30);
            this.simulatedValues.hallRPM = Math.floor(towRPM);
            // Tow operation: simulate power from 0 to 100
            this.simulatedValues.WPowerPotVal = Math.floor(50 + 30 * Math.sin(frequency * 0.5 * time));
        } else if (mode === Mode.REGEN) {
            // Regen operation: oscillate between -200 and -500 RPM with 10-second period (negative amplitude)
            // sin wave: amplitude = -150, offset = -350, period = 10 seconds
            const regenRPM = -350 - 150 * Math.sin(2 * Math.PI * time / 10);
            this.simulatedValues.hallRPM = Math.floor(regenRPM);
            // Regen operation: simulate power from 0 to 100
            this.simulatedValues.WPowerPotVal = Math.floor(60 + 40 * Math.sin(frequency * 0.3 * time));
        } else {
            // Safe mode or unknown mode: 0 RPM, no power
            this.simulatedValues.hallRPM = 0;
            this.simulatedValues.WPowerPotVal = 0;
        }

        // Update RPM and power via WinchStateManager
        this.winchController.setStateValue('hallRPM', this.simulatedValues.hallRPM);
        this.winchController.setStateValue('WPowerPotVal', this.simulatedValues.WPowerPotVal);
    }

    /**
     * Simulate safety systems
     */
    private simulateSafetySystems(): void {
        // Simulate safety system checks
        // This can be expanded to include more complex safety logic
        const time = this.currentTime;

        // Simulate occasional safety system events
        if (Math.sin(time * 0.1) > 0.95) {
            // Safety event - no callback needed
        }
    }

    /**
     * Get current simulated values
     */
    public getSimulatedValues(): SimulatedValues {
        return { ...this.simulatedValues };
    }

    /**
     * Update simulation configuration
     */
    public updateConfig(newConfig: Partial<SimulationConfig>): void {
        const oldInterval = this.config.updateInterval;

        this.config = { ...this.config, ...newConfig };

        // Restart interval if update interval changed
        if (oldInterval !== this.config.updateInterval && this.isRunning) {
            this.stop();
            this.start();
        }

        // Config updated - no callback needed
    }

    /**
     * Get current simulation configuration
     */
    public getConfig(): SimulationConfig {
        return { ...this.config };
    }

    /**
     * Check if simulation is currently running
     */
    public isSimulationRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Get simulation uptime in seconds
     */
    public getUptime(): number {
        return this.isRunning ? (Date.now() - this.startTime) / 1000 : 0;
    }

    /**
     * Reset simulation state
     */
    public reset(): void {
        this.stop();
        this.simulatedValues = {
            VBAT: 70,
            hallRPM: 0,
            motorTemperature: 25,
            mainBatteryVoltage: 70,
            WPowerPotVal: 0
        };
        this.startTime = Date.now();
        this.currentTime = 0;
        // Simulation reset - no callback needed
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        this.stop();
        // No event listeners to remove
    }
}
