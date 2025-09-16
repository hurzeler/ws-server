# 🪂 Separate Server and Monitor Setup

This guide shows you how to run the Winch server and monitor as separate processes, giving you more flexibility and control.

## 🚀 Quick Start

### **Step 1: Start the Server**
```bash
# Start the server without monitoring
bun run start

# Or start with integrated monitoring (if you want both)
bun run start:monitor
```

### **Step 2: Start the Monitor (in a new terminal)**
```bash
# Connect to the running server
bun run monitor:standalone

# Or with custom options
bun run monitor:standalone -i 500 --no-clear
```

## 📋 Available Commands

### **Server Commands**
| Command | Description |
|---------|-------------|
| `bun run start` | Start server without monitoring |
| `bun run start:monitor` | Start server with integrated monitoring |
| `bun run start:headless` | Start server with headless logging |
| `bun run dev` | Development mode without monitoring |
| `bun run dev:monitor` | Development mode with monitoring |

### **Standalone Monitor Commands**
| Command | Description |
|---------|-------------|
| `bun run monitor:standalone` | Connect to localhost:1337 |
| `bun run monitor:standalone -s ws://192.168.1.100:1337` | Connect to specific server |
| `bun run monitor:standalone -i 500` | Update every 500ms |
| `bun run monitor:standalone --no-clear` | Don't clear screen |

## 🔧 Configuration Options

### **Monitor Options**
```bash
# Update frequency
-i, --interval <ms>     # Update interval in milliseconds

# Display sections
--no-pins               # Hide pin status
--no-values             # Hide value monitoring  
--no-system             # Hide system status

# Display behavior
--no-clear              # Don't clear screen between updates

# Server connection
-s, --server <url>      # WebSocket server URL
```

## 💡 Use Cases

### **Development**
```bash
# Terminal 1: Start server
bun run dev

# Terminal 2: Start monitor
bun run monitor:standalone -i 500
```

### **Production**
```bash
# Terminal 1: Start server with headless monitoring
bun run start:headless

# Terminal 2: Start interactive monitor
bun run monitor:standalone
```

### **Remote Monitoring**
```bash
# Connect to remote server
bun run monitor:standalone -s ws://192.168.1.100:1337
```

## 🔍 Troubleshooting

### **Monitor Won't Connect**
- Ensure server is running first
- Check server URL and port
- Verify firewall settings
- Check server logs for errors

### **Performance Issues**
- Reduce update interval: `-i 2000`
- Hide unnecessary sections: `--no-pins --no-values`
- Use headless mode for production logging

### **Multiple Monitors**
You can run multiple monitors simultaneously:
```bash
# Terminal 1: Monitor with fast updates
bun run monitor:standalone -i 500

# Terminal 2: Monitor with logging
bun run monitor:standalone --no-clear

# Terminal 3: Monitor specific sections only
bun run monitor:standalone --no-pins --no-values
```

## 🎯 Benefits of Separate Processes

1. **Independent Control** - Start/stop monitor without affecting server
2. **Multiple Monitors** - Run different monitor configurations
3. **Remote Monitoring** - Monitor servers on different machines
4. **Resource Isolation** - Monitor issues won't crash the server
5. **Flexible Deployment** - Deploy monitor separately from server

## 📝 Example Workflow

```bash
# 1. Start the server
bun run start

# 2. In new terminal, start basic monitor
bun run monitor:standalone

# 3. In another terminal, start fast monitor
bun run monitor:standalone -i 500

# 4. In third terminal, start logging monitor
bun run monitor:standalone --no-clear
```

This setup gives you maximum flexibility to monitor your winch system from multiple perspectives while keeping the server running independently!
