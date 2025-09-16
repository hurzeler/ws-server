// Mock the bonjour module first
jest.mock('bonjour', () => {
    const mockBonjourService = {
        publish: jest.fn(),
        unpublishAll: jest.fn(),
        destroy: jest.fn()
    };
    const mockBonjour = jest.fn(() => mockBonjourService);
    return mockBonjour;
});
import { ZeroConfService } from '@/services/zeroConfService';
// Get the mocked bonjour function
const mockBonjour = require('bonjour');
const mockBonjourService = mockBonjour();
describe('ZeroConfService', () => {
    let zeroConfService;
    let testConfig;
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        // Test configuration
        testConfig = {
            serviceName: 'TestWinch',
            serviceType: 'winch',
            port: 8080,
            ssid: 'TestSSID',
            password: 'TestPassword123'
        };
        // Create new service instance for each test
        zeroConfService = new ZeroConfService(testConfig);
    });
    afterEach(() => {
        // Clean up after each test
        if (zeroConfService.isServiceActive()) {
            zeroConfService.stopService();
        }
    });
    describe('Constructor', () => {
        test('should create service with provided configuration', () => {
            expect(zeroConfService.getConfig()).toEqual(testConfig);
        });
        test('should not have active service initially', () => {
            expect(zeroConfService.isServiceActive()).toBe(false);
        });
    });
    describe('advertiseService', () => {
        test('should create and publish bonjour service successfully', () => {
            // Act
            zeroConfService.advertiseService();
            // Assert
            expect(mockBonjour).toHaveBeenCalledTimes(1);
            expect(mockBonjourService.publish).toHaveBeenCalledWith({
                name: testConfig.serviceName,
                type: testConfig.serviceType,
                port: testConfig.port,
                txt: {
                    ssid: testConfig.ssid,
                    password: testConfig.password
                }
            });
            expect(zeroConfService.isServiceActive()).toBe(true);
        });
        test('should handle errors gracefully', () => {
            // Arrange - make bonjour throw an error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockBonjour.mockImplementationOnce(() => {
                throw new Error('Bonjour initialization failed');
            });
            // Act
            zeroConfService.advertiseService();
            // Assert
            expect(consoleSpy).toHaveBeenCalledWith('❌ Error advertising Zeroconf service:', expect.any(Error));
            expect(zeroConfService.isServiceActive()).toBe(false);
            // Cleanup
            consoleSpy.mockRestore();
        });
        test('should not overwrite existing service', () => {
            // Arrange - start service first time
            zeroConfService.advertiseService();
            const firstCallCount = mockBonjour.mock.calls.length;
            // Act - try to start service again
            zeroConfService.advertiseService();
            // Assert - should not create new bonjour instance
            expect(mockBonjour).toHaveBeenCalledTimes(firstCallCount);
        });
    });
    describe('stopService', () => {
        test('should stop and destroy active service', () => {
            // Arrange - start service first
            zeroConfService.advertiseService();
            expect(zeroConfService.isServiceActive()).toBe(true);
            // Act
            zeroConfService.stopService();
            // Assert
            expect(mockBonjourService.unpublishAll).toHaveBeenCalledTimes(1);
            expect(mockBonjourService.destroy).toHaveBeenCalledTimes(1);
            expect(zeroConfService.isServiceActive()).toBe(false);
        });
        test('should handle errors when stopping service', () => {
            // Arrange - start service and make unpublishAll throw error
            zeroConfService.advertiseService();
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockBonjourService.unpublishAll.mockImplementationOnce(() => {
                throw new Error('Failed to unpublish');
            });
            // Act
            zeroConfService.stopService();
            // Assert
            expect(consoleSpy).toHaveBeenCalledWith('❌ Error stopping Zeroconf service:', expect.any(Error));
            // Cleanup
            consoleSpy.mockRestore();
        });
        test('should do nothing when no service is active', () => {
            // Act
            zeroConfService.stopService();
            // Assert
            expect(mockBonjourService.unpublishAll).not.toHaveBeenCalled();
            expect(mockBonjourService.destroy).not.toHaveBeenCalled();
        });
    });
    describe('isServiceActive', () => {
        test('should return false when no service is created', () => {
            expect(zeroConfService.isServiceActive()).toBe(false);
        });
        test('should return true when service is active', () => {
            zeroConfService.advertiseService();
            expect(zeroConfService.isServiceActive()).toBe(true);
        });
        test('should return false after service is stopped', () => {
            zeroConfService.advertiseService();
            expect(zeroConfService.isServiceActive()).toBe(true);
            zeroConfService.stopService();
            expect(zeroConfService.isServiceActive()).toBe(false);
        });
    });
    describe('getConfig', () => {
        test('should return a copy of the configuration', () => {
            const config = zeroConfService.getConfig();
            // Should be equal but not the same reference
            expect(config).toEqual(testConfig);
            expect(config).not.toBe(testConfig);
        });
        test('should not allow modification of internal config', () => {
            const config = zeroConfService.getConfig();
            config.serviceName = 'ModifiedName';
            // Internal config should remain unchanged
            expect(zeroConfService.getConfig().serviceName).toBe('TestWinch');
        });
    });
    describe('Integration scenarios', () => {
        test('should handle start-stop-start cycle correctly', () => {
            // First start
            zeroConfService.advertiseService();
            expect(zeroConfService.isServiceActive()).toBe(true);
            expect(mockBonjour).toHaveBeenCalledTimes(1);
            // Stop
            zeroConfService.stopService();
            expect(zeroConfService.isServiceActive()).toBe(false);
            // Second start
            zeroConfService.advertiseService();
            expect(zeroConfService.isServiceActive()).toBe(true);
            expect(mockBonjour).toHaveBeenCalledTimes(2);
        });
        test('should use correct ssid in txt record', () => {
            // Act
            zeroConfService.advertiseService();
            // Assert - txt.ssid should use ssid from config, not serviceName
            expect(mockBonjourService.publish).toHaveBeenCalledWith(expect.objectContaining({
                txt: {
                    ssid: testConfig.ssid, // This is the key test - should use config.ssid
                    password: testConfig.password
                }
            }));
        });
    });
    describe('Configuration validation', () => {
        test('should handle empty service name', () => {
            const emptyNameConfig = { ...testConfig, serviceName: '' };
            const service = new ZeroConfService(emptyNameConfig);
            service.advertiseService();
            expect(mockBonjourService.publish).toHaveBeenCalledWith(expect.objectContaining({
                name: ''
            }));
        });
        test('should handle special characters in service name', () => {
            const specialNameConfig = { ...testConfig, serviceName: 'Winch-Service_123' };
            const service = new ZeroConfService(specialNameConfig);
            service.advertiseService();
            expect(mockBonjourService.publish).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Winch-Service_123'
            }));
        });
        test('should handle numeric service names', () => {
            const numericNameConfig = { ...testConfig, serviceName: '12345' };
            const service = new ZeroConfService(numericNameConfig);
            service.advertiseService();
            expect(mockBonjourService.publish).toHaveBeenCalledWith(expect.objectContaining({
                name: '12345'
            }));
        });
        test('should handle very long service names', () => {
            const longName = 'A'.repeat(100);
            const longNameConfig = { ...testConfig, serviceName: longName };
            const service = new ZeroConfService(longNameConfig);
            service.advertiseService();
            expect(mockBonjourService.publish).toHaveBeenCalledWith(expect.objectContaining({
                name: longName
            }));
        });
    });
    describe('Edge cases and error handling', () => {
        test('should handle bonjour publish errors gracefully', () => {
            // Arrange - make publish throw an error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockBonjourService.publish.mockImplementationOnce(() => {
                throw new Error('Publish failed');
            });
            // Act
            zeroConfService.advertiseService();
            // Assert
            expect(consoleSpy).toHaveBeenCalledWith('❌ Error advertising Zeroconf service:', expect.any(Error));
            // Cleanup
            consoleSpy.mockRestore();
        });
        test('should handle multiple rapid start-stop cycles', () => {
            // Act - rapid cycles
            for (let i = 0; i < 5; i++) {
                zeroConfService.advertiseService();
                zeroConfService.stopService();
            }
            // Assert - should handle gracefully
            expect(zeroConfService.isServiceActive()).toBe(false);
        });
        test('should maintain service state correctly during operations', () => {
            // Initial state
            expect(zeroConfService.isServiceActive()).toBe(false);
            // Start service
            zeroConfService.advertiseService();
            expect(zeroConfService.isServiceActive()).toBe(true);
            // Stop service
            zeroConfService.stopService();
            expect(zeroConfService.isServiceActive()).toBe(false);
            // Try to stop again (should be safe)
            zeroConfService.stopService();
            expect(zeroConfService.isServiceActive()).toBe(false);
        });
    });
});
//# sourceMappingURL=zeroConf-service.test.js.map