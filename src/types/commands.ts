export interface Command {
  action: string;
  description: string;
  format?: string;
  state?: string;
  formatOptions?: {
    decimalPlaces?: number;
  };
}

export interface CommandGroup {
  category: 'control' | 'getter' | 'setter';
  commands: Command[];
}

export interface CommandsConfig {
  commandGroups: CommandGroup[];
}

export const commandsConfig: CommandsConfig = {
  commandGroups: [
    {
      category: "control",
      commands: [
        {
          action: "btnSafeStopST",
          description: "Emergency Stop"
        },
        {
          action: "btnPayinST",
          description: "Payin Start"
        },
        {
          action: "stepST",
          description: "Step"
        },
        {
          action: "btnPayoutST",
          description: "Payout Start"
        },
        {
          action: "btnWinchCN",
          description: "Winch Control"
        },
        {
          action: "btnPilotCN",
          description: "Pilot Control"
        }
      ]
    },
    {
      category: "getter",
      commands: [
        {
          action: "getEmSST",
          description: "Get Emergency Stop Status",
          format: "sSS{value}",
          state: "safeStopState"
        },
        {
          action: "getPayinST",
          description: "Get Payin Status",
          format: "sRW{value}",
          state: "payinState"
        },
        {
          action: "getStepST",
          description: "Get Step Status",
          format: "sPR{value}",
          state: "stepState"
        },
        {
          action: "getPayoutST",
          description: "Get Payout Status",
          format: "sPO{value}",
          state: "payoutState"
        },
        {
          action: "getCN",
          description: "Get Control Status",
          format: "sCN{value}",
          state: "winchControl"
        },
        {
          action: "getWPwVal",
          description: "Get Winch Power Value",
          format: "vWP{value}",
          state: "WPowerPotVal"
        },
        {
          action: "getWRgVal",
          description: "Get Winch Regen Value",
          format: "vWR{value}",
          state: "WRegenPotVal"
        },
        {
          action: "getPCVal",
          description: "Get Pulse Count Value",
          format: "vPC{value}",
          state: "pulseCount"
        },
        {
          action: "getWPCSVal",
          description: "Get Pulse Count Stop Limit Value",
          format: "vPCS{value}",
          state: "pulseCountLimit"
        },
        {
          action: "getWPCSSta",
          description: "Get Pulse Count Stop Status",
          format: "vPS{value}",
          state: "pulseCountStopStatus"
        },
        {
          action: "getRSSIVal",
          description: "Get RSSI Value",
          format: "vRS{value}",
          state: "RSSIVal"
        },
        {
          action: "getSSVal",
          description: "Get Safe State Value",
          format: "vSS{value}",
          state: "safeStateActive"
        },
        {
          action: "getLSVal",
          description: "Get Line Stop Value",
          format: "vBL{value}",
          state: "LSMSGcnt"
        },
        {
          action: "getVBATVal",
          description: "Get Battery Voltage Value",
          format: "vMB{value}",
          state: "VBAT",
          formatOptions: {
            decimalPlaces: 1
          }
        },
        {
          action: "getSSIDVal",
          description: "Get SSID Value",
          format: "vID{value}",
          state: "ssid"
        },
        {
          action: "getRPMVal",
          description: "Get Hall RPM Value",
          format: "vRP{value}",
          state: "hallRPM"
        },
        {
          action: "getTNDir",
          description: "Get Tension Direction Value",
          format: "vTN{value}",
          state: "direct"
        },
        {
          action: "getAC",
          description: "Get Counter Value",
          format: "vAC{value}",
          state: "counter"
        },
        {
          action: "getMT",
          description: "Get Motor Temperature Value",
          format: "vMT{value}",
          state: "motorTemperature"
        },
        {
          action: "getMB",
          description: "Get Main Battery Voltage Value",
          format: "vMB{value}",
          state: "mainBatteryVoltage"
        },
        {
          action: "getTime",
          description: "Get Server Time",
          format: "serverTime{value}",
          state: "serverTime"
        },
        {
          action: "getMode",
          description: "Get Winch Mode",
          format: "mode{value}",
          state: "mode"
        }
      ]
    },
    {
      category: "setter",
      commands: [
        {
          action: "setWPowerPotVal",
          description: "Set Winch Power Value",
          state: "WPowerPotVal",
          format: "wsPowerPot{value}"
        },
        {
          action: "setWRegenPotVal",
          description: "Set Winch Regen Value",
          state: "WRegenPotVal",
          format: "wsRegen{value}"
        },
        {
          action: "setWTensRPS1",
          description: "Set Tension RPS 1 Value",
          state: "WTensRPS1",
          format: "WTRTUv{value}"
        },
        {
          action: "setWTensRPS2",
          description: "Set Tension RPS 2 Value",
          state: "WTensRPS2",
          format: "WTRLAv{value}"
        },
        {
          action: "setWTensRPS3",
          description: "Set Tension RPS 3 Value",
          state: "WTensRPS3",
          format: "WTRPLv{value}"
        },
        {
          action: "setPulseCountLimit",
          description: "Set Pulse Count Stop Limit",
          state: "pulseCountLimit",
          format: "WPCSVal{value}"
        },
        {
          action: "setPulseCountStopStatus",
          description: "Set Pulse Count Stop Status",
          state: "pulseCountStopStatus",
          format: "WPCSSta{value}"
        },
        {
          action: "setRSSIVal",
          description: "Set RSSI Value",
          state: "RSSIVal",
          format: "sRS{value}"
        },
        {
          action: "setMotorTemperature",
          description: "Set Motor Temperature",
          state: "motorTemperature",
          format: "sMT([\\d.]+)"
        },
        {
          action: "setMainBatteryVoltage",
          description: "Set Main Battery Voltage",
          state: "mainBatteryVoltage",
          format: "sMB([\\d.]+)"
        },
        {
          action: "setHallRPM",
          description: "Set Hall RPM Value",
          state: "hallRPM",
          format: "sRP{value}"
        },
        {
          action: "setTensionUp",
          description: "Set Tension Up",
          state: "tensionUp",
          format: "setTensionUp{value}"
        },
        {
          action: "setTensionDown",
          description: "Set Tension Down",
          state: "tensionDown",
          format: "setTensionDown{value}"
        },
        {
          action: "setPreset",
          description: "Set Preset Value",
          state: "preset",
          format: "setPreset{value}"
        }
      ]
    }
  ]
};

// Export individual command groups for easier access
export const controlCommands = commandsConfig.commandGroups.find(group => group.category === 'control')?.commands || [];
export const getterCommands = commandsConfig.commandGroups.find(group => group.category === 'getter')?.commands || [];
export const setterCommands = commandsConfig.commandGroups.find(group => group.category === 'setter')?.commands || [];

// Export all commands as a flat array
export const allCommands = commandsConfig.commandGroups.flatMap(group => group.commands);

// Export command lookup functions
export const getCommandByAction = (action: string): Command | undefined => {
  return allCommands.find(cmd => cmd.action === action);
};

export const getCommandsByCategory = (category: 'control' | 'getter' | 'setter'): Command[] => {
  return commandsConfig.commandGroups.find(group => group.category === category)?.commands || [];
};

export const getCommandsByState = (state: string): Command[] => {
  return allCommands.filter(cmd => cmd.state === state);
};
