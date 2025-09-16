import * as fs from 'fs';
import * as path from 'path';
import { log, debug, error, warn } from '@etek.com.au/logger/react-native';

export class CounterService {
    private static instance: CounterService;
    private counterFilePath: string;
    private currentCount: number = 0;

    private constructor() {
        // Use a relative path for the counter file
        this.counterFilePath = 'startup-counter.txt';
        this.loadCounter();
    }

    /**
     * Get singleton instance of CounterService
     */
    public static getInstance(): CounterService {
        if (!CounterService.instance) {
            CounterService.instance = new CounterService();
        }
        return CounterService.instance;
    }

    /**
     * Load the current counter value from file
     */
    private loadCounter(): void {
        try {
            if (fs.existsSync(this.counterFilePath)) {
                const data = fs.readFileSync(this.counterFilePath, 'utf8');
                this.currentCount = parseInt(data, 10) || 0;
            } else {
                debug('📊 No existing counter file found, starting from 0');
                this.currentCount = 0;
            }
        } catch (error) {
            warn('Error loading counter file, starting from 0:', error);
            this.currentCount = 0;
        }
    }

    /**
     * Save the current counter value to file
     */
    private saveCounter(): void {
        try {
            fs.writeFileSync(this.counterFilePath, this.currentCount.toString(), 'utf8');
        } catch (err) {
            error('Error saving counter file:', err);
        }
    }

    /**
     * Increment the counter and return the new value
     */
    public incrementAndGet(): number {
        this.currentCount++;
        this.saveCounter();
        return this.currentCount;
    }

    /**
     * Get the current counter value without incrementing
     */
    public getCurrentCount(): number {
        return this.currentCount;
    }

    /**
     * Reset the counter to 0
     */
    public reset(): void {
        this.currentCount = 0;
        this.saveCounter();
        log('🔄 Counter reset to 0');
    }

    /**
     * Get the counter file path for debugging
     */
    public getCounterFilePath(): string {
        return path.resolve(this.counterFilePath);
    }
}
