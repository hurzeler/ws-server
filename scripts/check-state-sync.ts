#!/usr/bin/env bun

import { validateStateProperties, extractStateProperties } from '../src/utils/stateGenerator';

console.log('🔍 Checking state synchronization between commands.ts and winchState.ts...\n');

const validation = validateStateProperties();

if (validation.missing.length > 0) {
    console.log('❌ Missing state properties in WinchState:');
    validation.missing.forEach(prop => {
        console.log(`   - ${prop}`);
    });
    console.log('\n💡 Add these properties to the WinchState interface and createInitialWinchState() function');
    process.exit(1);
}

if (validation.extra.length > 0) {
    console.log('⚠️  Extra state properties in WinchState (not used by commands):');
    validation.extra.forEach(prop => {
        console.log(`   - ${prop}`);
    });
    console.log('\n💡 Consider removing these properties if they are no longer needed');
}

if (validation.missing.length === 0 && validation.extra.length === 0) {
    console.log('✅ All state properties are synchronized!');
    console.log(`📊 Total command state properties: ${extractStateProperties().length}`);
} else {
    console.log('\n📋 Summary:');
    console.log(`   - ${validation.missing.length} missing properties`);
    console.log(`   - ${validation.extra.length} extra properties`);
}
