# State Synchronization Between Commands and WinchState

## Overview

The `commands.ts` file defines command configurations that include `state` properties, which should correspond to properties in the `WinchState` interface. This document explains how to keep them synchronized.

## Current State Properties

### From Commands Configuration
The following state properties are defined in `commands.ts`:

```typescript
// Getter commands
- safeStopState
- payinState  
- stepState
- payoutState
- winchControl
- WPowerPotVal
- WRegenPotVal
- pulseCount
- pulseCountLimit
- pulseCountStopStatus
- RSSIVal
- safeStateActive
- LSMSGcnt
- VBAT
- ssid
- hallRPM
- direct
- counter
- motorTemperature
- mainBatteryVoltage
- serverTime
- mode

// Setter commands
- WPowerPotVal
- WRegenPotVal
- WTensRPS1
- WTensRPS2
- WTensRPS3
- pulseCountLimit
- pulseCountStopStatus
- RSSIVal
- motorTemperature
- mainBatteryVoltage
- hallRPM
- tensionUp
- tensionDown
- preset
```

### In WinchState Interface
All the above properties should be present in the `WinchState` interface in `winchState.ts`.

## Validation

Run the validation script to check for consistency:

```bash
bun run scripts/validate-state-consistency.ts
```

## Adding New Commands

When adding new commands with state properties:

1. Add the command to `commands.ts` with the `state` property
2. Add the corresponding property to `WinchState` interface
3. Add the property to `createInitialWinchState()` function
4. Run the validation script to verify consistency

## Benefits of This Approach

- **Single Source of Truth**: Commands define what state properties exist
- **Type Safety**: TypeScript ensures consistency
- **Validation**: Automated checking prevents mismatches
- **Documentation**: Clear relationship between commands and state

## Future Improvements

Consider implementing:
- Automatic code generation from commands configuration
- Runtime validation of state property existence
- TypeScript utility types to derive state from commands
