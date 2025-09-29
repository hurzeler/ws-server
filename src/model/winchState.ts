import { Mode, ToggleState, SafeStopState } from '@/types/winchEnums';

export class WinchState {
    // Core system properties
    public mode: Mode;
    
    // Command-defined properties (generated from commands.ts)
    public WPowerPotVal: number;
    public WRegenPotVal: number;
    public WTensRPS1: number;
    public WTensRPS2: number;
    public WTensRPS3: number;
    public direct: number;
    public pulseCount: number;
    public pulseCountLimit: number;
    public pulseCountStopStatus: number;
    public hallRPM: number;
    public motorTemperature: number;
    public mainBatteryVoltage: number;
    public VBAT: number;
    public RSSIVal: number;
    public safeStateActive: number;
    public LSMSGcnt: number;
    public counter: number;
    public safeStopState: SafeStopState;
    public payinState: ToggleState;
    public payoutState: ToggleState;
    public stepState: ToggleState;
    public serverTime: Date;
    public ssid: string;
    public winchControl: ToggleState;
    
    // Hardware pin states
    public DVTrev: number;
    public DVTDS1: number;
    public DVTDS2: number;
    public DVTDS3: number;
    public DVTFS1: number;
    public PSunlatch: number;
    public ResBNK1: number;
    
    // Additional system properties
    public WPowerPotValPrev: number;
    public WRegenPotValPrev: number;
    public WPowerPotValMapped: number;
    public WRegenPotValMapped: number;
    public LoadCelllMapped: number;
    public TensDiff: number;
    public revolutions: number;
    public directPrev: number;
    public pulseCountPrev: number;
    public pulseCountLimitPrev: number;
    public pulseCountStopStatusPrev: number;
    public hallPPM: number;
    public hallRPMPrev: number;
    public hallTemperature: number;
    public hallMPUtime: number;
    public temperaturePrev: number;
    public VBATPrev: number;
    public LoadCell1Prev: number;
    public LoadCell1Cal: number;
    public LoadCell1: number;
    public lineStopActive: number;
    public radioInPrev: number;
    public LSMSGState: number;
    public LSMSGStatePrev: number;
    public counterPrev: number;
    public tensionUP: number;
    public tensionDN: number;
    public preset: number;
    public message: string;
    
    // Command-defined properties that were missing
    public tensionUp: number;
    public tensionDown: number;

    constructor(data?: Partial<WinchState>) {
        // Initialize with default values
        this.mode = data?.mode ?? Mode.SAFE;
        
        // Command-defined properties
        this.WPowerPotVal = data?.WPowerPotVal ?? 0;
        this.WRegenPotVal = data?.WRegenPotVal ?? 0;
        this.WTensRPS1 = data?.WTensRPS1 ?? 0;
        this.WTensRPS2 = data?.WTensRPS2 ?? 0;
        this.WTensRPS3 = data?.WTensRPS3 ?? 0;
        this.direct = data?.direct ?? 1;
        this.pulseCount = data?.pulseCount ?? 0;
        this.pulseCountLimit = data?.pulseCountLimit ?? 0;
        this.pulseCountStopStatus = data?.pulseCountStopStatus ?? 0;
        this.hallRPM = data?.hallRPM ?? 0;
        this.motorTemperature = data?.motorTemperature ?? 0;
        this.mainBatteryVoltage = data?.mainBatteryVoltage ?? 0;
        this.VBAT = data?.VBAT ?? 0;
        this.RSSIVal = data?.RSSIVal ?? 0;
        this.safeStateActive = data?.safeStateActive ?? 0;
        this.LSMSGcnt = data?.LSMSGcnt ?? 0;
        this.counter = data?.counter ?? 0;
        this.safeStopState = data?.safeStopState ?? SafeStopState.STOPPED;
        this.payinState = data?.payinState ?? ToggleState.OFF;
        this.payoutState = data?.payoutState ?? ToggleState.OFF;
        this.stepState = data?.stepState ?? ToggleState.OFF;
        this.serverTime = data?.serverTime ?? new Date();
        this.ssid = data?.ssid ?? '';
        this.winchControl = data?.winchControl ?? ToggleState.OFF;
        
        // Hardware pin states
        this.DVTrev = data?.DVTrev ?? 0;
        this.DVTDS1 = data?.DVTDS1 ?? 0;
        this.DVTDS2 = data?.DVTDS2 ?? 0;
        this.DVTDS3 = data?.DVTDS3 ?? 0;
        this.DVTFS1 = data?.DVTFS1 ?? 0;
        this.PSunlatch = data?.PSunlatch ?? 0;
        this.ResBNK1 = data?.ResBNK1 ?? 0;
        
        // Additional system properties
        this.WPowerPotValPrev = data?.WPowerPotValPrev ?? 0;
        this.WRegenPotValPrev = data?.WRegenPotValPrev ?? 0;
        this.WPowerPotValMapped = data?.WPowerPotValMapped ?? 0;
        this.WRegenPotValMapped = data?.WRegenPotValMapped ?? 0;
        this.LoadCelllMapped = data?.LoadCelllMapped ?? 0;
        this.TensDiff = data?.TensDiff ?? 0;
        this.revolutions = data?.revolutions ?? 0;
        this.directPrev = data?.directPrev ?? -1;
        this.pulseCountPrev = data?.pulseCountPrev ?? 0;
        this.pulseCountLimitPrev = data?.pulseCountLimitPrev ?? -1;
        this.pulseCountStopStatusPrev = data?.pulseCountStopStatusPrev ?? -1;
        this.hallPPM = data?.hallPPM ?? 0;
        this.hallRPMPrev = data?.hallRPMPrev ?? -1;
        this.hallTemperature = data?.hallTemperature ?? 0;
        this.hallMPUtime = data?.hallMPUtime ?? 0;
        this.temperaturePrev = data?.temperaturePrev ?? 0;
        this.VBATPrev = data?.VBATPrev ?? -1;
        this.LoadCell1Prev = data?.LoadCell1Prev ?? -1;
        this.LoadCell1Cal = data?.LoadCell1Cal ?? 0;
        this.LoadCell1 = data?.LoadCell1 ?? 0;
        this.lineStopActive = data?.lineStopActive ?? 0;
        this.radioInPrev = data?.radioInPrev ?? 0;
        this.LSMSGState = data?.LSMSGState ?? 99;
        this.LSMSGStatePrev = data?.LSMSGStatePrev ?? 99;
        this.counterPrev = data?.counterPrev ?? -1;
        this.tensionUP = data?.tensionUP ?? 10;
        this.tensionDN = data?.tensionDN ?? 10;
        this.preset = data?.preset ?? 10;
        this.message = data?.message ?? '';
        
        // Command-defined properties that were missing
        this.tensionUp = data?.tensionUp ?? 10;
        this.tensionDown = data?.tensionDown ?? 10;
    }

    // ===== STATE MANAGEMENT METHODS =====

    /**
     * Update multiple properties at once
     */
    public update(updates: Partial<WinchState>): void {
        Object.assign(this, updates);
    }

    /**
     * Get a copy of the current state as a plain object
     */
    public toObject(): Record<string, any> {
        return { ...this };
    }

    /**
     * Create a clone of this WinchState instance
     */
    public clone(): WinchState {
        return new WinchState(this.toObject());
    }

    /**
     * Reset to initial/default values
     */
    public reset(): void {
        const defaults = new WinchState();
        Object.assign(this, defaults);
    }

    // ===== CONVENIENCE METHODS =====

    /**
     * Check if the winch is in a safe state
     */
    public isSafe(): boolean {
        return this.mode === Mode.SAFE;
    }

    /**
     * Check if the winch is in towing mode
     */
    public isTowing(): boolean {
        return this.mode === Mode.TOW;
    }

    /**
     * Check if the winch is in step mode
     */
    public isStepMode(): boolean {
        return this.mode === Mode.STEP;
    }

    /**
     * Check if payin is active
     */
    public isPayinActive(): boolean {
        return this.payinState === ToggleState.ON;
    }

    /**
     * Check if payout is active
     */
    public isPayoutActive(): boolean {
        return this.payoutState === ToggleState.ON;
    }

    /**
     * Check if step mode is active
     */
    public isStepActive(): boolean {
        return this.stepState === ToggleState.ON;
    }

    /**
     * Check if winch control is active
     */
    public isWinchControlActive(): boolean {
        return this.winchControl === ToggleState.ON;
    }

    /**
     * Get the current tension value (average of tensionUp and tensionDown)
     */
    public getCurrentTension(): number {
        return (this.tensionUp + this.tensionDown) / 2;
    }

    /**
     * Get battery percentage (assuming 12V nominal)
     */
    public getBatteryPercentage(): number {
        const nominalVoltage = 12.0;
        const minVoltage = 10.0;
        const maxVoltage = 14.0;
        
        const percentage = ((this.VBAT - minVoltage) / (maxVoltage - minVoltage)) * 100;
        return Math.max(0, Math.min(100, percentage));
    }

    /**
     * Check if battery is low (below 20%)
     */
    public isBatteryLow(): boolean {
        return this.getBatteryPercentage() < 20;
    }

    /**
     * Check if motor temperature is high (above 80°C)
     */
    public isMotorOverheated(): boolean {
        return this.motorTemperature > 80;
    }

    /**
     * Get formatted status message
     */
    public getStatusMessage(): string {
        const parts = [];
        
        parts.push(`Mode: ${this.mode}`);
        parts.push(`Battery: ${this.getBatteryPercentage().toFixed(1)}%`);
        parts.push(`Temp: ${this.motorTemperature}°C`);
        
        if (this.isPayinActive()) parts.push('PAYIN');
        if (this.isPayoutActive()) parts.push('PAYOUT');
        if (this.isStepActive()) parts.push('STEP');
        
        return parts.join(' | ');
    }
}

export interface DigitalPinState {
    DVTrev: number;
    DVTDS1: number;
    DVTDS2: number;
    DVTDS3: number;
    DVTFS1: number;
    PSunlatch: number;
    ResBNK1: number;
}

