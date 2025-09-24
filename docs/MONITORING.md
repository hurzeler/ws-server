# 🏗️ Winch System Monitoring

The Winch System now includes comprehensive real-time monitoring capabilities that can be used in both interactive console mode and headless logging mode.

## 🚀 Quick Start

### **Console Monitoring (Interactive)**
```bash
# Start with real-time console display
bun run start:monitor

# Development mode with monitoring
bun run dev:monitor
```

### **Headless Monitoring (Logging)**
```bash
# Start with headless monitoring (logs to file)
bun run start:headless

# Development mode with headless monitoring
bun run dev:headless
```

### **Standalone Monitoring Tool**
```bash
# Interactive monitoring tool
bun run monitor

# Fast updates (500ms)
bun run monitor:fast

# Logging mode (no screen clear)
bun run monitor:log

# Demo display
bun run monitor:demo
```

## 📊 Monitoring Features

### **1. System Status Display**
- **Payin State** - Current payin operation status
- **Step State** - Step-by-step operation status  
- **Payout State** - Current payout operation status
- **Safe Stop State** - Emergency stop status
- **Winch Control** - Main control system status
- **Line Stop Active** - Line stop sensor status
- **Safe State Active** - Safety system status

### **2. Pin Status Monitoring**
- **GPIO Pin States** - Real-time pin readings
- **Pin Types** - Input, output, analog, digital
- **Color Coding** - Visual status indicators
- **Descriptions** - Human-readable pin functions

### **3. Value Monitoring**
- **Sensor Readings** - Tension, RPM, temperature, voltage
- **Units** - Proper measurement units (V, RPM, °C, kg)
- **Min/Max Ranges** - Operational limits
- **Descriptions** - Sensor function explanations

## 🔧 Configuration Options

### **Command Line Arguments**
```bash
# Enable monitoring
--monitor
--monitoring

# Enable headless mode (logs to file)
--headless

# Examples
bun src/app.ts --monitor                    # Console monitoring
bun src/app.ts --monitor --headless         # Headless logging
```

### **Monitor Configuration**
```typescript
interface MonitorConfig {
    updateInterval: number;      // Update frequency in ms
    showPins: boolean;          // Display pin status
    showValues: boolean;        // Display sensor values
    showSystem: boolean;        // Display system status
    maxLines: number;           // Maximum display lines
    clearScreen: boolean;       // Clear screen between updates
    headless: boolean;          // Headless logging mode
    logFilePath: string;        // Log file path
}
```

## 📝 Logging in Headless Mode

### **Log File Location**
- **Default Path**: `logs/winch-monitor.log`
- **Format**: ISO timestamp + structured data
- **Rotation**: Append mode (continuous logging)

### **Log Format Examples**
```
2025-08-11T07:18:59.404Z - === Winch Monitor Log Started ===
2025-08-11T07:18:59.404Z - 🚀 Starting Winch Monitor in headless mode...
2025-08-11T07:18:59.404Z - SYSTEM: payinState=1, stepState=1, payoutState=1, safeStopState=0, winchControl=0, lineStopActive=0, safeStateActive=0
2025-08-11T07:18:59.404Z - PIN: LSMSG(4)=99 [input]
2025-08-11T07:18:59.404Z - PIN: SafeState(12)=0 [input]
2025-08-11T07:18:59.404Z - VALUE: Power Pot Value=0raw
2025-08-11T07:18:59.404Z - VALUE: Hall RPM=0RPM
2025-08-11T07:18:59.404Z - UPTIME: 0s
```

## 🎯 Use Cases

### **Development & Testing**
- **Real-time debugging** of hardware interactions
- **Performance monitoring** during development
- **Sensor validation** and calibration

### **Production Monitoring**
- **Headless logging** for production systems
- **System health monitoring** without UI
- **Data collection** for analysis

### **Troubleshooting**
- **Pin state verification** for hardware issues
- **Sensor reading validation** for calibration
- **System state tracking** for debugging

## 🔍 Monitoring Integration

### **WebSocket Server Integration**
The monitoring is fully integrated into the WebSocket server:

```typescript
// Enable monitoring in WebSocket controller
const webSocketController = new WebSocketController(
    winchStateManager, 
    true,   // enableMonitoring
    false   // headlessMode
);
```

### **Event-Driven Architecture**
- **State change events** automatically trigger monitoring updates
- **Real-time updates** based on system state changes
- **Configurable update intervals** for performance tuning

## 🧪 Testing

### **Integration Tests**
```bash
# Test monitoring integration
bun run test:monitoring

# Run all tests
bun run test
```

### **Manual Testing**
```bash
# Test console monitoring
bun run start:monitor

# Test headless monitoring
bun run start:headless

# Check log files
tail -f logs/winch-monitor.log
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `start:monitor` | Production with console monitoring |
| `start:headless` | Production with headless logging |
| `dev:monitor` | Development with console monitoring |
| `dev:headless` | Development with headless logging |
| `monitor` | Standalone monitoring tool |
| `monitor:fast` | Fast monitoring updates |
| `monitor:log` | Logging mode monitoring |
| `monitor:demo` | Demo display |
| `test:monitoring` | Monitoring integration tests |

## 🚨 Troubleshooting

### **Common Issues**

#### **Monitoring Not Starting**
- Check if `--monitor` flag is provided
- Verify WinchStateManager is properly initialized
- Check console for error messages

#### **Log Files Not Created**
- Ensure `logs/` directory has write permissions
- Check if `--headless` flag is provided
- Verify file system has available space

#### **Performance Issues**
- Reduce `updateInterval` for faster updates
- Disable unnecessary display sections
- Use headless mode for production systems

### **Debug Mode**
```bash
# Enable debug logging
CONSOLE_LEVEL=debug bun run dev:monitor

# Check monitoring status
bun run test:monitoring
```

## 🔮 Future Enhancements

- **Web-based monitoring dashboard**
- **Data export and analysis tools**
- **Alert system for critical values**
- **Historical data storage**
- **Mobile monitoring app**
- **Integration with external monitoring systems**

---

For more information, see the main [README.md](../README.md) or run `bun run monitor:demo` to see a sample display.
