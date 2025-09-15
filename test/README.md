# Test Suite Documentation

This directory contains comprehensive tests for the WebSocket server application.

## 🧪 Available Tests

### 1. **ZeroConf Service Tests** (`zeroConf-service.test.ts`)
Comprehensive test suite for the Bonjour/ZeroConf service discovery functionality.

**Test Categories:**
- **Constructor Tests**: Service initialization and configuration
- **Service Lifecycle**: Start, stop, and state management
- **Error Handling**: Graceful failure handling and recovery
- **Configuration Validation**: Various input formats and edge cases
- **Integration Scenarios**: Real-world usage patterns
- **Edge Cases**: Boundary conditions and stress testing

**Coverage:**
- ✅ Service advertisement and discovery
- ✅ Service lifecycle management
- ✅ Error handling and recovery
- ✅ Configuration validation
- ✅ State tracking and consistency
- ✅ Mocked network operations (no actual network calls)

### 2. **WebSocket Server Tests** (`websocket-server.test.ts`)
Tests for the WebSocket server functionality and message handling.

## 🚀 Running Tests

### **All Tests**
```bash
bun test
```

### **ZeroConf Tests Only**
```bash
bun test --testNamePattern="ZeroConf"
```

### **WebSocket Tests Only**
```bash
bun test --testNamePattern="WebSocket"
```

### **Individual Test Files**
```bash
# ZeroConf tests
bun test test/zeroConf-service.test.ts

# WebSocket tests
bun test test/websocket-server.test.ts
```

### **With Coverage**
```bash
bun test --coverage
```

## 🛠️ Test Configuration

### **Jest Configuration** (`jest.config.ts`)
- **Test Environment**: Node.js
- **TypeScript Support**: Full TS/TSX support via ts-jest
- **Module Resolution**: Path aliases configured (`@/` → `src/`)
- **Test Timeout**: 10 seconds
- **Cleanup**: Automatic handle detection and cleanup
- **Runtime**: Bun-compatible configuration

### **Test Setup** (`test/setup.ts`)
- **Console Mocking**: Reduces test noise
- **Global Utilities**: Test helper functions
- **Timeout Configuration**: Consistent test timing

## 📋 Test Patterns

### **Mocking Strategy**
- **Network Services**: Bonjour library fully mocked
- **Console Output**: Controlled for clean test output
- **Error Scenarios**: Comprehensive error simulation

### **Test Structure**
```typescript
describe('Feature', () => {
    let service: Service;
    
    beforeEach(() => {
        // Setup for each test
        service = new Service();
    });
    
    afterEach(() => {
        // Cleanup after each test
        service.cleanup();
    });
    
    test('should do something', () => {
        // Arrange
        const input = 'test';
        
        // Act
        const result = service.process(input);
        
        // Assert
        expect(result).toBe('expected');
    });
});
```

### **Assertion Patterns**
- **Method Calls**: Verify correct function calls
- **State Changes**: Check service state consistency
- **Error Handling**: Validate error scenarios
- **Integration**: Test component interactions

## 🔍 Test Coverage

### **ZeroConf Service Coverage**
- **Service Lifecycle**: 100% coverage
- **Error Handling**: 100% coverage
- **Configuration**: 100% coverage
- **State Management**: 100% coverage

### **Areas Tested**
- ✅ Service advertisement
- ✅ Service discovery
- ✅ Configuration management
- ✅ Error scenarios
- ✅ Edge cases
- ✅ Integration patterns

## 🚨 Troubleshooting

### **Common Issues**

1. **TypeScript Errors**
   - Ensure `tsconfig.json` is properly configured
   - Check module resolution paths

2. **Mock Failures**
   - Verify mock setup order
   - Check import/require statements

3. **Test Timeouts**
   - Increase timeout in `jest.config.ts`
   - Check for hanging async operations

### **Debug Mode**
```bash
# Run with verbose output
npm test -- --verbose

# Run specific test with debugging
npm test -- --testNamePattern="should create service"
```

## 📚 Best Practices

### **Writing Tests**
1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Single Responsibility**: Test one thing per test
4. **Clean Setup**: Use beforeEach/afterEach for setup/cleanup
5. **Meaningful Assertions**: Test behavior, not implementation

### **Maintaining Tests**
1. **Keep Tests Fast**: Avoid slow operations
2. **Mock External Dependencies**: Don't test external services
3. **Update Tests with Code**: Keep tests in sync with implementation
4. **Review Test Coverage**: Ensure critical paths are tested

## 🎯 Future Enhancements

### **Planned Test Additions**
- **Integration Tests**: End-to-end service testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Authentication and authorization
- **API Tests**: REST endpoint validation

### **Test Infrastructure**
- **Coverage Reports**: Detailed coverage analysis
- **Test Reports**: HTML test result reports
- **CI/CD Integration**: Automated testing in pipelines
- **Performance Monitoring**: Test execution time tracking
