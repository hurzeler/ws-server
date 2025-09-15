# Winch WebSocket Server

A modular TypeScript WebSocket server for winch control and monitoring, built with Bun.

## 🏗️ Architecture

The application is built with a modular, event-driven architecture using TypeScript and Bun:

### 📁 Project Structure
```
src/
├── controllers/
│   └── webSocketServer.ts     # WebSocket server and client communication
├── services/
│   ├── counterService.ts      # Persistent startup counter service
│   └── zeroConfService.ts     # Bonjour/Zeroconf service discovery
├── app.ts                     # Main application entry point
└── test/                      # Test files and documentation
```

### 🔗 Dependencies
- **@etek.com.au/winch-commands**: Winch control and state management
- **@etek.com.au/logger**: Logging utilities
- **bonjour**: mDNS service discovery
- **ws**: WebSocket server implementation

### 🔧 Components

#### 1. **WebSocketController** (`src/controllers/webSocketServer.ts`)
- **Purpose**: Handles WebSocket communication with clients
- **Responsibilities**:
  - WebSocket server management
  - Client connection handling
  - Message routing and processing
  - Broadcasting state changes to clients
  - Integration with winch-commands library

#### 2. **ZeroConfService** (`src/services/zeroConfService.ts`)
- **Purpose**: Manages Bonjour/mDNS service discovery
- **Responsibilities**:
  - Service advertisement and discovery
  - Network service registration
  - Service lifecycle management
  - Error handling and recovery

#### 3. **CounterService** (`src/services/counterService.ts`)
- **Purpose**: Manages persistent startup counter across application restarts
- **Responsibilities**:
  - Persistent counter storage in file
  - Counter increment and retrieval
  - Singleton pattern for global access
  - Error handling for file operations

#### 4. **WinchApplication** (`src/app.ts`)
- **Purpose**: Main application orchestrator
- **Responsibilities**:
  - Component initialization
  - Application lifecycle management
  - Graceful shutdown handling
  - Error handling
  - Startup counter management

## 🎯 **Benefits of the Modular Architecture**

The modular design provides several key advantages:

- **🔧 Separation of Concerns**: Each module has a single, clear responsibility
- **📊 Real-time Communication**: WebSocket and mDNS services work together seamlessly
- **🧪 Easy Testing**: Components can be tested independently
- **⚡ Performance**: Optimized for Bun runtime with efficient resource usage
- **🔄 State Management**: Integration with winch-commands library for state synchronization
- **🛡️ Error Handling**: Robust error handling and recovery mechanisms

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) runtime
- Node.js dependencies (installed via Bun)

### Installation
```bash
# Install dependencies
bun install
```

### Running the Application

#### Development Mode (with watch)
```bash
bun run dev
```

#### Production Mode
```bash
bun run start
```

#### Debug Mode
```bash
bun run debug
```

#### Build for Production
```bash
bun run build
```

### Testing
```bash
# Run all tests
bun test

# Run specific test suites
bun test --testNamePattern="ZeroConf"
bun test --testNamePattern="WebSocket"

# Run tests with coverage
bun test --coverage
```

## 🔄 State Management

The server integrates with the winch-commands library for state management:

- **State Changes**: All state modifications are handled by WinchStateManager
- **Real-time Updates**: WebSocket clients automatically receive state updates
- **Persistence**: Counter values are automatically saved to disk
- **Event-Driven**: Uses event emission for real-time state synchronization

### Key Features
- **WebSocket Communication**: Real-time bidirectional communication
- **Service Discovery**: Automatic device discovery via mDNS/Bonjour
- **State Synchronization**: Automatic state updates across all connected clients
- **Error Handling**: Robust error handling and recovery mechanisms

## 🌐 WebSocket API

### Connection
- **Port**: 1337
- **Protocol**: WebSocket
- **Service Discovery**: Bonjour/Zeroconf (eWinchETek)

### Message Format
- **State Updates**: `{property}{value}` (e.g., `sRW1` for payin state)
- **Commands**: Direct command strings (e.g., `PayinST`, `EmStopST`)

### Available Commands
- `EmStopST`: Emergency stop
- `PayinST`: Toggle pay-in operation
- `PayoutST`: Toggle pay-out operation
- `StepST`: Toggle step operation
- `WinchCN`: Toggle winch control
- `PilotCN`: Toggle pilot control

## 🧪 Testing

The modular architecture makes testing easier:

```typescript
import { WinchApplication } from './app';

const app = new WinchApplication();
const stateManager = app.getWinchStateManager();

// Test state changes
stateManager.setPayinState(1);
console.log(stateManager.getPayinState()); // Should output: 1
```

## 🔧 Debugging

### VS Code Debugging
The project includes VS Code launch configurations for debugging with Bun.

### Web Debugger (Recommended)
For more reliable debugging with Bun:
```bash
bun --inspect src/app.ts
```
Then open the provided debug URL in your browser.

## 📝 Benefits of Modular Architecture

1. **Separation of Concerns**: Each module has a single, clear responsibility
2. **Testability**: Components can be tested independently
3. **Maintainability**: Easier to modify and extend individual components
4. **Reusability**: Components can be reused in other applications
5. **Debugging**: Easier to isolate and fix issues
6. **Scalability**: New features can be added without affecting existing code

## 🚧 Future Enhancements

- Add unit tests for each module
- Implement configuration management
- Add logging and monitoring
- Create REST API endpoints
- Add database persistence
- Implement user authentication

## 📄 License

This project is part of the eWinchETek system.
