import { log, warn, debug } from '@etek.com.au/logger/react-native';
import { WinchState, createInitialWinchState } from '@/model/winchState';
import { ToggleState, SafeStopState, Mode } from '@/types/winchEnums';
import { SimulationManager } from '@/simulation/simulation';
import { commandsConfig, getCommandByAction, getCommandsByCategory } from '@/config/commands';

type StateKey = keyof WinchState;

export class WinchController {
    private state: WinchState;
    private stateChangeCallback?: (property: StateKey, value: number | string | Date, format: string) => void;
    private broadcastCallback?: (message: string) => void;
    private simulation: SimulationManager;
    
    // Constants from Arduino code
    private readonly HIGH_RPM_THRESHOLD = 250;
    private readonly LOW_RPM_THRESHOLD = 100;
    private readonly DEBOUNCE_TIME = 500; // 500ms debounce time
    private readonly DEBOUNCE_TIME_LSMSG = 50;
    private readonly DEBOUNCE_TIME_SAFE = 50;
    
    
    // Linear curve configuration
    public readonly linearCurve = {
        x1: 1.233,
        y1: 1.1,
        x2: 2.3220,
        y2: 23.97
    };
    
    // Debounce timing variables
    private highRpmStartTime = 0;
    private lowRpmStartTime = 0;
    private highRpmTimerActive = false;
    private lowRpmTimerActive = false;
    private lastDebounceTime = 0;
    private lastDebounceTimeSS = 0;
    private lastSteadyState = 0;
    private lastFlickerableState = 0;
    private lastSteadyStateSS = 0;
    private lastFlickerableStateSS = 0;
    private radioInPrev = 0;
    private ResBNKtime = 0;

    constructor() {
        // Initialize state with all default values
        this.state = createInitialWinchState();
        
        // Initialize simulation
        this.simulation = new SimulationManager(this);
        
        // Set up simulation to get winch state
        this.simulation.setWinchStateGetter(() => this.getState());
        
        // Start simulation
        this.simulation.start();
    }

    // ===== CONTROL METHODS (from Arduino) =====
    
    public btnSafeStopST(): void {
        // Set button states
        this.state.safeStopState = SafeStopState.STOPPED;
        this.state.payinState = ToggleState.OFF;
        this.state.payoutState = ToggleState.OFF;
        this.state.stepState = ToggleState.OFF;

        this.DVTOFF(); // set DVT to default
        this.unLatchPS();

        this.state.WPowerPotVal = 0;
        this.state.WRegenPotVal = 0;

        this.wsPowerPot();
        this.wsRegen();

        // websocket updates to synchronise browser
        this.wsPowerState();
        this.wsStepState();
        this.wsPayOutState();
        this.wsSafeStopState();
        this.getCN();

        this.radioInPrev = 0; // tidy up concurrent presses on green remote
        this.state.mode = Mode.SAFE;
    }

    public btnPayinST(): void {
        this.state.safeStopState = SafeStopState.RUNNING;
        this.state.payinState = ToggleState.ON;
        this.state.payoutState = ToggleState.OFF;
        this.state.stepState = ToggleState.OFF;

        this.DVTOFF(); // set DVT to default
        this.DVTrevON();
        this.DVTDS2ON();
        this.DVTFS1ON();

        this.state.WPowerPotVal = 0;   // Reset so Drop power
        this.state.WRegenPotVal = 100; // engage full footbrake
        this.wsPowerPot();
        this.wsRegen();

        // websocket updates to synchronise browser
        this.wsStepState();
        this.wsPayOutState();
        this.wsSafeStopState();
        this.wsPowerState();
        this.getCN();

        this.radioInPrev = 0; // tidy up concurrent presses on green remote
        this.unLatchPS();
        this.state.mode = Mode.TOW;
    }

    public stepST(): void {
        this.state.safeStopState = SafeStopState.RUNNING;
        this.state.payinState = ToggleState.OFF;
        this.state.payoutState = ToggleState.OFF;
        this.state.stepState = ToggleState.ON;

        this.DVTOFF(); // set DVT to default
        this.DVTrevON();
        this.DVTDS3ON();

        this.state.WPowerPotVal = 0;
        this.state.WRegenPotVal = 0;

        this.wsPowerPot();
        this.wsRegen();

        // websocket updates to synchronise browser
        this.wsPayOutState();
        this.wsSafeStopState();
        this.wsPowerState();
        this.wsStepState();
        this.getCN();

        this.radioInPrev = 0; // tidy up concurrent presses on green remote
        this.unLatchPS();
        this.state.mode = Mode.TOW;
    }

    public btnPayoutST(): void {
        this.state.safeStopState = SafeStopState.RUNNING;
        this.state.payinState = ToggleState.OFF;
        this.state.payoutState = ToggleState.ON;
        this.state.stepState = ToggleState.OFF;

        this.DVTOFF(); // set DVT to default
        this.DVTrevON();
        this.DVTDS3ON();

        this.state.WPowerPotVal = 0; // payout so Drop power
        this.state.WRegenPotVal = 0; // payout so Drop regen power

        this.wsPowerPot();
        this.wsRegen();

        // websocket updates to synchronise browser
        this.wsSafeStopState();
        this.wsPowerState();
        this.wsStepState();
        this.wsPayOutState();
        this.getCN();

        this.radioInPrev = 0; // tidy up concurrent presses on green remote
        this.unLatchPS();
        this.state.mode = Mode.REGEN;
    }

    public btnPilotCN(): void {
        this.state.winchControl = ToggleState.OFF;
        this.btnSafeStopST();
        this.getCN();
    }

    public btnWinchCN(): void {
        this.state.winchControl = ToggleState.ON;
        this.btnSafeStopST();
        this.getCN();
    }

    // ===== STATE MANAGEMENT =====
    
    public getState(): WinchState {
        return { ...this.state };
    }
    
    public setStateChangeCallback(callback: (property: StateKey, value: number | string | Date, format: string) => void): void {
        this.stateChangeCallback = callback;    
    }

    public setBroadcastCallback(callback: (message: string) => void): void {
        this.broadcastCallback = callback;
    }

    public setState(key: StateKey, value: number | string | Date, format?: string): void {
        (this.state as any)[key] = value;
        if (this.stateChangeCallback) {
            this.stateChangeCallback(key, value, format || '');
        }
    }

    private broadcastMessage(message: string): void {
        if (this.broadcastCallback) {
            this.broadcastCallback(message);
        }
    }

    private broadcastStateMessage(commandAction: string, value: any): void {
        const commandConfig = getCommandByAction(commandAction);
        if (commandConfig && commandConfig.format) {
            let formattedValue = value;
            
            // Apply formatting options if available
            if (commandConfig.formatOptions?.decimalPlaces !== undefined) {
                formattedValue = Number(value).toFixed(commandConfig.formatOptions.decimalPlaces);
            }
            
            const message = commandConfig.format.replace('{value}', formattedValue);
            this.broadcastMessage(message);
        } else {
            // Fallback to simple format if no configuration found
            this.broadcastMessage(`${commandAction}${value}`);
        }
    }
    
    private getCurrentState() {
        return this.state;
    }

    // ===== GETTER METHODS (from Arduino) =====

    public getEmSST(): void {
        const { safeStopState } = this.getCurrentState();
        this.broadcastStateMessage('getEmSST', safeStopState);
    }


    public getPayinST(): void {
        const { payinState } = this.getCurrentState();
        this.broadcastStateMessage('getPayinST', payinState);
    }

    public getStepST(): void {
        const { stepState } = this.getCurrentState();
        this.broadcastStateMessage('getStepST', stepState);
    }

    public getPayoutST(): void {
        const { payoutState } = this.getCurrentState();
        this.broadcastStateMessage('getPayoutST', payoutState);
    }

    public getMode(): void {
        const { mode } = this.getCurrentState();
        this.broadcastStateMessage('getMode', mode);
    }

    public getCN(): void {
        const { winchControl } = this.getCurrentState();
        this.broadcastStateMessage('getCN', winchControl);
    }

    public getWPwVal(): void {
        const { WPowerPotVal } = this.getCurrentState();
        this.broadcastStateMessage('getWPwVal', WPowerPotVal);
    }

    public getWRgVal(): void {
        const { WRegenPotVal } = this.getCurrentState();
        this.broadcastStateMessage('getWRgVal', WRegenPotVal);
    }

    public getPCVal(): void {
        const { pulseCount } = this.getCurrentState();
        this.broadcastStateMessage('getWPCVal', pulseCount);
    }

    public getPCSVal(): void {
        const { pulseCountLimit } = this.getCurrentState();
        this.broadcastStateMessage('getWPCSVal', pulseCountLimit);
        this.getPCSSta();
    }

    public getPCSSta(): void {
        const { pulseCountStopStatus } = this.getCurrentState();
        this.broadcastStateMessage('getWPCSSta', pulseCountStopStatus);
    }

    public getRSSIVal(): void {
        const { RSSIVal } = this.getCurrentState();
        this.broadcastStateMessage('getRSSIVal', RSSIVal);
    }

    public getSSVal(): void {
        const { safeStateActive } = this.getCurrentState();
        this.broadcastStateMessage('getSSVal', safeStateActive);
    }

    public getLSVal(): void {
        const { LSMSGcnt } = this.getCurrentState();
        this.broadcastStateMessage('getLSVal', LSMSGcnt);
    }

    public getRPMVal(): void {
        const { hallRPM } = this.getCurrentState();
        this.broadcastStateMessage('getRPMVal', hallRPM);
    }

    public getTNDir(): void {
        const { direct } = this.getCurrentState();
        this.broadcastStateMessage('getTNDir', direct);
    }

    public getVBATVal(): void {
        const { VBAT } = this.getCurrentState();
        this.broadcastStateMessage('getVBATVal', VBAT);
    }

    public getSSIDVal(): void {
        const { ssid } = this.getCurrentState();
        this.broadcastStateMessage('getSSIDVal', ssid);
    }

    public getAC(): void {
        const { counter } = this.getCurrentState();
        // Note: This logic seems incorrect - comparing counter to itself will always be false
        // Keeping original Arduino logic but this should probably be fixed
        this.broadcastStateMessage('getAC', counter);
    }

    public getMT(): void {
        const { motorTemperature } = this.getCurrentState();
        this.broadcastStateMessage('getMT', motorTemperature);
    }

    public getMB(): void {
        const { mainBatteryVoltage } = this.getCurrentState();
        this.broadcastStateMessage('getMB', mainBatteryVoltage);
    }

    public getTime(): void {
        const now = new Date();
        this.broadcastStateMessage('getTime', now.toISOString());
    }

    // ===== SETTER METHODS (from Arduino) =====

    public wsPowerPot(): void {
        this.AnaloguePowerChange();
    }

    public wsRegen(): void {
        this.AnalogueRegenChange();
    }


    // ===== HARDWARE CONTROL METHODS (from Arduino) =====

    public DVTrevON(): void {
        this.state.DVTrev = 1;
    }

    public DVTrevOFF(): void {
        this.state.DVTrev = 0;
    }

    public DVTDS1ON(): void {
        this.state.DVTDS1 = 1;
    }

    public DVTDS1OFF(): void {
        this.state.DVTDS1 = 0;
    }

    public DVTDS2ON(): void {
        this.state.DVTDS2 = 1;
    }

    public DVTDS2OFF(): void {
        this.state.DVTDS2 = 0;
    }

    public DVTDS3ON(): void {
        this.state.DVTDS3 = 1;
    }

    public DVTDS3OFF(): void {
        this.state.DVTDS3 = 0;
    }

    public DVTFS1ON(): void {
        this.state.DVTFS1 = 1;
    }

    public DVTFS1OFF(): void {
        this.state.DVTFS1 = 0;
    }

    public DVTOFF(): void {
        this.DVTrevOFF();
        this.DVTDS1OFF();
        this.DVTDS2OFF();
        this.DVTDS3OFF();
        this.DVTFS1OFF();
    }

    public DVTON(): void {
        this.DVTrevON();
        this.DVTDS1ON();
        this.DVTDS2ON();
        this.DVTDS3ON();
        this.DVTFS1ON();
    }

    public unLatchPS(): void {
        // Simulate unlatch relay
        this.state.PSunlatch = 1;
        setTimeout(() => {
            this.state.PSunlatch = 0;
        }, 10);
    }

    // ===== WEBSOCKET BROADCAST METHODS (from Arduino) =====

    public wsPowerState(): void {
        const state = this.getCurrentState();
        this.broadcastStateMessage('getPayinST', state.payinState);
    }

    public wsStepState(): void {
        const state = this.getCurrentState();
        this.broadcastStateMessage('getStepST', state.stepState);
    }

    public wsPayOutState(): void {
        const state = this.getCurrentState();
        this.broadcastStateMessage('getPayoutST', state.payoutState);
    }

    public wsSafeStopState(): void {
        const state = this.getCurrentState();
        this.broadcastStateMessage('getEmSST', state.safeStopState);
    }

    // ===== ANALOGUE CONTROL METHODS (from Arduino) =====

    public AnaloguePowerChange(): void {
        const { WPowerPotVal, WPowerPotValPrev } = this.getCurrentState();
        let newWPowerPotVal = WPowerPotVal;
        
        if (newWPowerPotVal > 100) {
            newWPowerPotVal = 100;
        }
        if (newWPowerPotVal < 0) {
            warn(`WPowerPotVal negative: ${newWPowerPotVal}, changed to 0`);
            newWPowerPotVal = 0;
        }
        
        if (newWPowerPotVal !== WPowerPotValPrev) {
            const WPowerPotValMapped = this.mapValue(newWPowerPotVal, 0, 100, 18, 254);
            this.state.WPowerPotValMapped = WPowerPotValMapped;
            this.state.WPowerPotVal = newWPowerPotVal;
            this.state.WPowerPotValPrev = newWPowerPotVal;
            debug(`📤 vWP${newWPowerPotVal}`);
        }
    }

    public AnalogueRegenChange(): void {
        const { WRegenPotVal, WRegenPotValPrev } = this.getCurrentState();
        let newWRegenPotVal = WRegenPotVal;
        
        if (newWRegenPotVal > 100) {
            newWRegenPotVal = 100;
        }
        if (newWRegenPotVal < 0) {
            warn(`WRegenPotVal negative: ${newWRegenPotVal}, changed to 0`);
            newWRegenPotVal = 0;
        }
        
        if (newWRegenPotVal !== WRegenPotValPrev) {
            const WRegenPotValMapped = this.mapValue(newWRegenPotVal, 0, 100, 18, 254);
            this.state.WRegenPotValMapped = WRegenPotValMapped;
            this.state.WRegenPotVal = newWRegenPotVal;
            this.state.WRegenPotValPrev = newWRegenPotVal;
            debug(`📤 vWR${newWRegenPotVal}`);
        }
    }

    // ===== PROCESSING METHODS (from Arduino) =====

    public processRadio(radioIn: number): void {
        const { payinState, stepState, payoutState } = this.getCurrentState();
        
        if (payinState === 0 || stepState === 0) {
            this.applyPayIn(radioIn);
        }
        if (payoutState === 0) {
            this.applyPayOut(radioIn);
        }
        if (radioIn === 5) {
            this.unLatchPS();
            this.btnPayinST();
        }
        if (radioIn === 6) {
            this.unLatchPS();
            this.btnPayoutST();
        }
    }

    public applyPayIn(radioIn: number): void {
        const { WPowerPotVal, WTensRPS3, WTensRPS2, WTensRPS1 } = this.getCurrentState();
        
        if (radioIn === 2) { // UP incremental
            const newVal = WPowerPotVal + WTensRPS3;
            this.state.WPowerPotVal = newVal;
            this.wsPowerPot();
        }
        if (radioIn === 3) { // All out
            if (this.radioInPrev === radioIn) {
                this.state.WPowerPotVal = WTensRPS2;
                this.wsPowerPot();
            }
        }
        if (radioIn === 4) { // down incremental
            const newVal = WPowerPotVal - WTensRPS1;
            this.state.WPowerPotVal = newVal;
            this.wsPowerPot();
        }
        if (radioIn === 1) { // STOP
            this.state.WPowerPotVal = 0;
            this.wsPowerPot();
        }
    }

    public applyPayOut(radioIn: number): void {
        const { WRegenPotVal, WTensRPS3, WTensRPS2, WTensRPS1 } = this.getCurrentState();
        
        if (radioIn === 2) { // UP incremental
            const newVal = WRegenPotVal + WTensRPS3;
            this.state.WRegenPotVal = newVal;
            this.wsRegen();
        }
        if (radioIn === 3) { // All out
            if (this.radioInPrev === radioIn) {
                this.state.WRegenPotVal = WTensRPS2;
                this.wsRegen();
            }
        }
        if (radioIn === 4) { // down incremental
            const newVal = WRegenPotVal - WTensRPS1;
            this.state.WRegenPotVal = newVal;
            this.wsRegen();
        }
        if (radioIn === 1) { // STOP
            this.state.WRegenPotVal = 0;
            this.wsRegen();
        }
    }

    public checkRadio(radioIn: number): void {
        const { winchControl, payinState, payoutState, stepState } = this.getCurrentState();
        
        if (winchControl === 0) {
            if (payinState === 0 || payoutState === 0 || stepState === 0) {
                this.processRadio(radioIn);
                this.radioInPrev = radioIn;
            }
        }
    }

    // ===== RPM MONITORING (from Arduino) =====

    public reviewPayinRPM(): void {
        const { hallRPM, DVTDS1, DVTDS2 } = this.getCurrentState();

        // Check for high RPM condition
        if (hallRPM >= this.HIGH_RPM_THRESHOLD) {
            if (!this.highRpmTimerActive) {
                this.highRpmStartTime = Date.now();
                this.highRpmTimerActive = true;
            } else if ((Date.now() - this.highRpmStartTime) >= this.DEBOUNCE_TIME) {
                if (DVTDS1 === 0) {
                    this.DVTDS1ON();
                    this.DVTDS2OFF();
                }
            }
        } else {
            this.highRpmTimerActive = false;
        }

        // Check for low RPM condition
        if (hallRPM <= this.LOW_RPM_THRESHOLD) {
            if (!this.lowRpmTimerActive) {
                this.lowRpmStartTime = Date.now();
                this.lowRpmTimerActive = true;
            } else if ((Date.now() - this.lowRpmStartTime) >= this.DEBOUNCE_TIME) {
                if (DVTDS2 === 0) {
                    this.DVTDS2ON();
                    this.DVTDS1OFF();
                }
            }
        } else {
            this.lowRpmTimerActive = false;
        }
    }

    public reviewStep(): void {
        const { WPowerPotVal } = this.getCurrentState();
        
        if (WPowerPotVal <= 8) {
            this.DVTrevOFF();
            this.DVTDS3OFF();
        } else {
            this.DVTrevON();
            this.DVTDS3ON();
        }
    }

    public reviewPayin(): void {
        const { WPowerPotVal, DVTDS2, DVTDS1, DVTFS1 } = this.getCurrentState();
        
        if (WPowerPotVal === 0) {
            if (DVTDS2 === 1) this.DVTDS2OFF();
            if (DVTDS1 === 1) this.DVTDS1OFF();
            if (DVTFS1 === 1) this.DVTFS1OFF();
        } else {
            if (DVTDS2 === 0) {
                if (DVTDS1 === 0) {
                    this.DVTDS2ON();
                }
            }
            if (DVTFS1 === 0) {
                this.DVTFS1ON();
            }
        }
        
        this.reviewPayinRPM();
    }

    public reviewPayout(): void {
        const { WRegenPotVal } = this.getCurrentState();
        
        if (WRegenPotVal === 0) {
            this.DVTDS3OFF();
        } else {
            this.DVTDS3ON();
        }
    }

    public processTension(): void {
        const { stepState, payinState, payoutState } = this.getCurrentState();
        
        if (stepState === 0) {
            this.reviewStep();
        }
        if (payinState === 0) {
            this.reviewPayin();
        }
        if (payoutState === 0) {
            this.reviewPayout();
        }
    }

    // ===== DEBOUNCE METHODS (from Arduino) =====

    public checkLSMSG(): void {
        const currentState = Math.random() > 0.5 ? 1 : 0; // Simulate button reading
        
        if (currentState !== this.lastFlickerableState) {
            this.lastDebounceTime = Date.now();
            this.lastFlickerableState = currentState;
        }

        if ((Date.now() - this.lastDebounceTime) > this.DEBOUNCE_TIME_LSMSG) {
            if (this.lastSteadyState === 1 && currentState === 0) {
                log("The LSMSG button is pressed");
                this.state.lineStopActive = 0;
            }

            if (this.lastSteadyState === 0 && currentState === 1) {
                log("The LSMSG button is triggered");
            const currentLSMSGcnt = this.getCurrentState().LSMSGcnt || 0;
                this.state.LSMSGcnt = currentLSMSGcnt + 1;
                this.state.lineStopActive = 1;
                debug(`📤 vBL${currentLSMSGcnt + 1}`);

            if (this.getCurrentState().hallRPM <= 0) {
                this.processLineStop();
            }
            }
            this.lastSteadyState = currentState;
        }
    }

    public checkSafeState(): void {
        const currentStateSS = Math.random() > 0.5 ? 1 : 0; // Simulate button reading
        
        if (currentStateSS !== this.lastFlickerableStateSS) {
            this.lastDebounceTimeSS = Date.now();
            this.lastFlickerableStateSS = currentStateSS;
        }

        if ((Date.now() - this.lastDebounceTimeSS) > this.DEBOUNCE_TIME_SAFE) {
            if (this.lastSteadyStateSS === 1 && currentStateSS === 0) {
                log("The SS button is off");
                this.state.safeStateActive = 0;
                this.processSafeStateOff();
            }

            if (this.lastSteadyStateSS === 0 && currentStateSS === 1) {
                log("The SS button is on");
                this.state.safeStateActive = 1;
                this.processSafeStateOn();
            }
            this.lastSteadyStateSS = currentStateSS;
        }
    }

    public processSafeStateOn(): void {
        const state = this.getCurrentState();
        debug(`📤 vSS${state.safeStateActive}`);
        this.btnSafeStopST();
    }

    public processSafeStateOff(): void {
        const state = this.getCurrentState();
        debug(`📤 vSS${state.safeStateActive}`);
        this.btnSafeStopST();
    }

    public processLineStop(): void {
        const state = this.getCurrentState();
        
        if (state.stepState === 0) {
            this.state.WPowerPotVal = 0;
            this.state.WRegenPotVal = 0;
            this.wsPowerPot();
            this.wsRegen();
            this.DVTOFF();
            this.DVTDS2ON();
            setTimeout(() => this.btnSafeStopST(), 4000);
        }
        if (state.payinState === 0) {
            this.state.WPowerPotVal = 0;
            this.state.WRegenPotVal = 0;
            this.wsPowerPot();
            this.wsRegen();
            this.DVTrevOFF();
            this.DVTDS2ON();
            setTimeout(() => this.btnSafeStopST(), 4000);
        }
        if (state.payoutState === 0) {
            const tempWRegenPotVal = state.WRegenPotVal;
            this.btnPayoutST();
            this.state.WRegenPotVal = tempWRegenPotVal;
            this.wsRegen();
        }
    }

    // ===== RESISTOR BANK CONTROL (from Arduino) =====

    public checkResBNK1(): void {
        const state = this.getCurrentState();
        const voltageTrigger = 79;
        const voltageTrigger2 = 78.5;
        const triggerPeriod = 2000; // ms

        if (state.payoutState === 0) {
            if (Date.now() - this.ResBNKtime > triggerPeriod) {
                if (state.VBAT >= voltageTrigger) {
                    this.state.ResBNK1 = 1;
                    this.ResBNKtime = Date.now();
                }
                if (state.VBAT < voltageTrigger2) {
                    this.state.ResBNK1 = 0;
                    this.ResBNKtime = Date.now();
                }
            }
        }
        if (state.payoutState === 1) {
            this.state.ResBNK1 = 0;
        }
    }

    // ===== MESSAGE PROCESSING =====

    public processMessage(message: string, ws: any): void {
        // Extract command from message (e.g., "sSS" from "sSS1")
        const command = message.match(/^[a-zA-Z]+/)?.[0];
        if (!command) {
            warn(`Unknown message format: ${message}`);
            return;
        }

        // Find command configuration by action or format prefix
        let commandConfig = getCommandByAction(command);
        
        // If not found by action, try to find by format prefix
        if (!commandConfig) {
            const allCommands = commandsConfig.commandGroups.flatMap(group => group.commands);
            commandConfig = allCommands.find(cmd => 
                cmd.format && command.startsWith(cmd.format.replace('{value}', '').replace(/[{}]/g, ''))
            );
        }

        if (commandConfig) {
            const methodName = this.getMethodNameFromCommand(commandConfig);
            if (methodName && typeof (this as any)[methodName] === 'function') {
                log(`🔧 Executing method: ${methodName} for command: ${command} (${commandConfig.description})`);
                (this as any)[methodName]();
            } else {
                warn(`No handler method found for command: ${command} (${commandConfig.description})`);
            }
        } else {
            // Try to find method by exact name match for backward compatibility
            if (typeof (this as any)[command] === 'function') {
                log(`🔧 Executing method by name: ${command}`);
                (this as any)[command]();
            } else {
                warn(`No command configuration or handler found for: ${command}`);
            }
        }
    }

    private getMethodNameFromCommand(commandConfig: any): string {
        // Command actions already match method names, just return the action
        return commandConfig.action;
    }

    // ===== UTILITY METHODS =====

    private mapValue(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    // ===== INITIALIZATION =====

    public winchStartup(): void {
        // Set button states
        this.state.safeStopState = SafeStopState.STOPPED;
        this.state.payinState = ToggleState.OFF;
        this.state.payoutState = ToggleState.OFF;
        this.state.stepState = ToggleState.OFF;

        this.DVTOFF(); // set DVT to default

        this.state.WPowerPotVal = 0;
        this.state.WRegenPotVal = 0;
        this.wsPowerPot();
        this.wsRegen();

        // websocket updates to synchronise browser
        this.wsPowerState();
        this.wsStepState();
        this.wsPayOutState();
        this.wsSafeStopState();
        this.getCN();

        this.unLatchPS();
    }

    // ===== COMMAND MANAGEMENT =====

    public getAvailableCommands(): string[] {
        return commandsConfig.commandGroups.flatMap(group => 
            group.commands.map(cmd => cmd.action)
        );
    }

    public getCommandsByCategory(category: 'control' | 'getter' | 'setter'): any[] {
        return getCommandsByCategory(category);
    }

    // ===== SIMULATION METHODS =====

    public getSimulation(): SimulationManager {
        return this.simulation;
    }

    public stopSimulation(): void {
        if (this.simulation) {
            this.simulation.stop();
        }
    }
}