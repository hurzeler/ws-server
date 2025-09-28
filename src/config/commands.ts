export interface Command {
  action: string;
  description: string;
  request?: string;
  response?: string;
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
          description: "Emergency Stop",
          request: "EmStopST"
        },
        {
          action: "btnPayinST",
          description: "Payin Start",
          request: "PayinST"
        },
        {
          action: "stepST",
          description: "Step",
          request: "StepST"
        },
        {
          action: "btnPayoutST",
          description: "Payout Start",
          request: "PayoutST"
        },
        {
          action: "btnWinchCN",
          description: "Winch Control",
          request: "WinchCN"
        },
        {
          action: "btnPilotCN",
          description: "Pilot Control",
          request: "PilotCN"
        }
      ]
    },
    {
      category: "getter",
      commands: [
        {
          action: "getEmSST",
          description: "Get Emergency Stop Status", 
          response: "sSS{value}",
          state: "safeStopState"
        },
        {
          action: "getPayinST",
          description: "Get Payin Status",
          response: "sRW{value}",
          state: "payinState"
        },
        {
          action: "getStepST",
          description: "Get Step Status",
          response: "sPR{value}",
          state: "stepState"
        },
        {
          action: "getPayoutST",
          description: "Get Payout Status",
          response: "sPO{value}",
          state: "payoutState"
        },
        {
          action: "getCN",
          description: "Get Control Status",
          response: "sCN{value}",
          state: "winchControl"
        },
        {
          action: "getWPwVal",
          description: "Get Winch Power Value",
          response: "vWP{value}",
          state: "WPowerPotVal"
        },
        {
          action: "getWRgVal",
          description: "Get Winch Regen Value",
          response: "vWR{value}",
          state: "WRegenPotVal"
        },
        {
          action: "getPCVal",
          description: "Get Pulse Count Value",
          response: "vPC{value}",
          state: "pulseCount"
        },
        {
          action: "getWPCSVal",
          description: "Get Pulse Count Stop Limit Value",
          response: "vPCS{value}",
          state: "pulseCountLimit"
        },
        {
          action: "getWPCSSta",
          description: "Get Pulse Count Stop Status",
          response: "vPS{value}",
          state: "pulseCountStopStatus"
        },
        {
          action: "getRSSIVal",
          description: "Get RSSI Value",
          response: "vRS{value}",
          state: "RSSIVal"
        },
        {
          action: "getSSVal",
          description: "Get Safe State Value",
          response: "vSS{value}",
          state: "safeStateActive"
        },
        {
          action: "getLSVal",
          description: "Get Line Stop Value",
            response: "vBL{value}",
          state: "LSMSGcnt"
        },
        {
          action: "getVBATVal",
          description: "Get Battery Voltage Value",
          response: "vMB{value}",
          state: "VBAT",
          formatOptions: {
            decimalPlaces: 1
          }
        },
        {
          action: "getSSIDVal",
          description: "Get SSID Value",
          response: "vID{value}",
          state: "ssid"
        },
        {
          action: "getRPMVal",
          description: "Get Hall RPM Value",
          response: "vRP{value}",
          state: "hallRPM"
        },
        {
          action: "getTNDir",
          description: "Get Tension Direction Value",
          response: "vTN{value}",
          state: "direct"
        },
        {
          action: "getAC",
          description: "Get Counter Value",
          response: "vAC{value}",
          state: "counter"
        },
        {
          action: "getMT",
          description: "Get Motor Temperature Value",
          response: "vMT{value}",
          state: "motorTemperature"
        },
        {
          action: "getMB",
          description: "Get Main Battery Voltage Value",
          response: "vMB{value}",
          state: "mainBatteryVoltage"
        },
        {
          action: "getTime",
          description: "Get Server Time",
          response: "serverTime{value}",
          state: "serverTime"
        },
        {
          action: "getMode",
          description: "Get Winch Mode",
          response: "mode{value}",
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
          request: "WPwVal{value}",
          response: "vWP{value}"
        },
        {
          action: "wsPowerPot",
          description: "Arduino Winch Power Pot Message",
          state: "WPowerPotVal",
          request: "wsPowerPot{value}",
          response: "vWP{value}"
        },
        {
          action: "setWRegenPotVal",
          description: "Set Winch Regen Value",
          state: "WRegenPotVal",
          request: "WRgVal{value}",
          response: "vWR{value}"
        },
        {
          action: "wsRegen",
          description: "Arduino Winch Regen Message",
          state: "WRegenPotVal",
          request: "wsRegen{value}",
          response: "vWR{value}"
        },
        {
          action: "setWTensRPS1",
          description: "Set Tension RPS 1 Value",
          state: "WTensRPS1",
          request: "WTRTUv{value}",
          response: "vTRTU{value}"
        },
        {
          action: "setWTensRPS2",
          description: "Set Tension RPS 2 Value",
          state: "WTensRPS2",
          request: "WTRLAv{value}",
          response: "vTRLA{value}"
        },
        {
          action: "setWTensRPS3",
          description: "Set Tension RPS 3 Value",
          state: "WTensRPS3",
          request: "WTRPLv{value}",
          response: "vTRPL{value}"
        },
        {
          action: "setPulseCountLimit",
          description: "Set Pulse Count Stop Limit",
          state: "pulseCountLimit",
          request: "WPCSVal{value}",
          response: "vPCS{value}"
        },
        {
          action: "setPulseCountStopStatus",
          description: "Set Pulse Count Stop Status",
          state: "pulseCountStopStatus",
          request: "WPCSSta{value}",
          response: "vPS{value}"
        },
        {
          action: "setRSSIVal",
          description: "Set RSSI Value",
          state: "RSSIVal",
          request: "sRS{value}",
          response: "vRS{value}"
        },
        {
          action: "setMotorTemperature",
          description: "Set Motor Temperature",
          state: "motorTemperature",
          request: "sMT{value}",
          response: "vMT{value}"
        },
        {
          action: "setMainBatteryVoltage",
          description: "Set Main Battery Voltage",
          state: "mainBatteryVoltage",
          request: "sMB{value}",
          response: "vMB{value}"
        },
        {
          action: "setHallRPM",
          description: "Set Hall RPM Value",
          state: "hallRPM",
          request: "sRP{value}",
          response: "vRP{value}"
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

// Generate regex pattern for message handlers from getter commands
export const getMessageHandlerPattern = (): string => {
  const getterFormats = getterCommands
    .filter(cmd => cmd.response)
    .map(cmd => cmd.response!.replace('{value}', '.*'))
    .map(format => `^${format}`)
    .join('|');
  
  return getterFormats;
};