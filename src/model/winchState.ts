import { Mode, ToggleState, SafeStopState } from '@/types/winchEnums';

export interface WinchState {
    // Core system properties
    mode: Mode;
    
    // Command-defined properties
    WPowerPotVal: number;
    WRegenPotVal: number;
    WTensRPS1: number;
    WTensRPS2: number;
    WTensRPS3: number;
    direct: number;
    pulseCount: number;
    pulseCountLimit: number;
    pulseCountStopStatus: number;
    hallRPM: number;
    motorTemperature: number;
    mainBatteryVoltage: number;
    VBAT: number;
    RSSIVal: number;
    safeStateActive: number;
    LSMSGcnt: number;
    counter: number;
    safeStopState: SafeStopState;
    payinState: ToggleState;
    payoutState: ToggleState;
    stepState: ToggleState;
    serverTime: Date;
    ssid: string;
    
    // Hardware pin states
    DVTrev: number;
    DVTDS1: number;
    DVTDS2: number;
    DVTDS3: number;
    DVTFS1: number;
    PSunlatch: number;
    ResBNK1: number;
    winchControl: ToggleState;
    
    // Additional system properties
    WPowerPotValPrev: number;
    WRegenPotValPrev: number;
    WPowerPotValMapped: number;
    WRegenPotValMapped: number;
    LoadCelllMapped: number;
    TensDiff: number;
    revolutions: number;
    directPrev: number;
    pulseCountPrev: number;
    pulseCountLimitPrev: number;
    pulseCountStopStatusPrev: number;
    hallPPM: number;
    hallRPMPrev: number;
    hallTemperature: number;
    hallMPUtime: number;
    temperaturePrev: number;
    VBATPrev: number;
    LoadCell1Prev: number;
    LoadCell1Cal: number;
    LoadCell1: number;
    lineStopActive: number;
    radioInPrev: number;
    LSMSGState: number;
    LSMSGStatePrev: number;
    counterPrev: number;
    tensionUP: number;
    tensionDN: number;
    preset: number;
    message: string;
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

export function createInitialWinchState(): WinchState {
    return {
        // Core system properties
        mode: Mode.SAFE,
        
        // Command-defined properties
        WPowerPotVal: 0,
        WRegenPotVal: 0,
        WTensRPS1: 0,
        WTensRPS2: 0,
        WTensRPS3: 0,
        direct: 1,
        pulseCount: 0,
        pulseCountLimit: 0,
        pulseCountStopStatus: 0,
        hallRPM: 0,
        motorTemperature: 0,
        mainBatteryVoltage: 0,
        VBAT: 0,
        RSSIVal: 0,
        safeStateActive: 0,
        LSMSGcnt: 0,
        counter: 0,
        safeStopState: SafeStopState.STOPPED,
        payinState: ToggleState.OFF,
        payoutState: ToggleState.OFF,
        stepState: ToggleState.OFF,
        serverTime: new Date(),
        ssid: '',
        
        // Hardware pin states
        DVTrev: 0,
        DVTDS1: 0,
        DVTDS2: 0,
        DVTDS3: 0,
        DVTFS1: 0,
        PSunlatch: 0,
        ResBNK1: 0,
        winchControl: ToggleState.OFF,
        
        // Additional system properties
        WPowerPotValPrev: 0,
        WRegenPotValPrev: 0,
        WPowerPotValMapped: 0,
        WRegenPotValMapped: 0,
        LoadCelllMapped: 0,
        TensDiff: 0,
        revolutions: 0,
        directPrev: -1,
        pulseCountPrev: 0,
        pulseCountLimitPrev: -1,
        pulseCountStopStatusPrev: -1,
        hallPPM: 0,
        hallRPMPrev: -1,
        hallTemperature: 0,
        hallMPUtime: 0,
        temperaturePrev: 0,
        VBATPrev: -1,
        LoadCell1Prev: -1,
        LoadCell1Cal: 0,
        LoadCell1: 0,
        lineStopActive: 0,
        radioInPrev: 0,
        LSMSGState: 99,
        LSMSGStatePrev: 99,
        counterPrev: -1,
        tensionUP: 10,
        tensionDN: 10,
        preset: 10,
        message: ''
    };
}
