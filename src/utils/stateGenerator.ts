import { commandsConfig, Command } from '@/config/commands';

/**
 * Extracts all unique state properties from the commands configuration
 */
export function extractStateProperties(): string[] {
    const stateProperties = new Set<string>();
    
    commandsConfig.commandGroups.forEach(group => {
        group.commands.forEach(command => {
            if (command.state) {
                stateProperties.add(command.state);
            }
        });
    });
    
    return Array.from(stateProperties).sort();
}

/**
 * Gets the state property for a given command action
 */
export function getStatePropertyForCommand(action: string): string | undefined {
    for (const group of commandsConfig.commandGroups) {
        const command = group.commands.find(cmd => cmd.action === action);
        if (command && command.state) {
            return command.state;
        }
    }
    return undefined;
}

/**
 * Gets all commands that use a specific state property
 */
export function getCommandsForStateProperty(stateProperty: string): Command[] {
    const commands: Command[] = [];
    
    commandsConfig.commandGroups.forEach(group => {
        group.commands.forEach(command => {
            if (command.state === stateProperty) {
                commands.push(command);
            }
        });
    });
    
    return commands;
}

/**
 * Validates that all state properties in commands exist in WinchState
 * This helps catch mismatches between commands and state
 */
export function validateStateProperties(): { missing: string[], extra: string[] } {
    const commandStates = extractStateProperties();
    const winchStateProperties = [
        'WPowerPotVal', 'WRegenPotVal', 'WTensRPS1', 'WTensRPS2', 'WTensRPS3',
        'direct', 'pulseCount', 'pulseCountLimit', 'pulseCountStopStatus',
        'hallRPM', 'motorTemperature', 'mainBatteryVoltage', 'VBAT', 'RSSIVal',
        'safeStateActive', 'LSMSGcnt', 'counter', 'safeStopState', 'payinState',
        'payoutState', 'stepState', 'serverTime', 'ssid', 'winchControl',
        'mode', 'preset', 'tensionUp', 'tensionDown'
    ];
    
    const missing = commandStates.filter(state => !winchStateProperties.includes(state));
    const extra = winchStateProperties.filter(state => !commandStates.includes(state));
    
    return { missing, extra };
}
