// Winch operation modes
export enum Mode {
    SAFE = 'safe',
    TOW = 'tow',
    REGEN = 'regen',
    STEP = 'step'
}

// Winch state values - ON = 0, OFF = 1
export enum ToggleState {
    ON = 0,
    OFF = 1
}

// Safe stop state values
export enum SafeStopState {
    RUNNING = 0,
    STOPPED = 1
}
