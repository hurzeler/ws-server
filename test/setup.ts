// Jest setup file for test configuration

// Set test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
    // Suppress console output during tests unless explicitly needed
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
});

afterAll(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
});

// Global test utilities
(global as any).testUtils = {
    // Helper to restore console for specific tests
    restoreConsole: () => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
    },
    
    // Helper to suppress console for specific tests
    suppressConsole: () => {
        console.log = jest.fn();
        console.error = jest.fn();
        console.warn = jest.fn();
    }
};
