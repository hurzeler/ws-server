#!/usr/bin/env bun
import { validateStateProperties, extractStateProperties } from '../src/utils/stateGenerator';
console.log('🔍 Validating state consistency between commands.ts and winchState.ts...\n');
const validation = validateStateProperties();
if (validation.missing.length > 0) {
    console.log('❌ Missing state properties in WinchState:');
    validation.missing.forEach(prop => {
        console.log(`   - ${prop}`);
    });
    console.log('');
}
if (validation.extra.length > 0) {
    console.log('⚠️  Extra state properties in WinchState (not used by commands):');
    validation.extra.forEach(prop => {
        console.log(`   - ${prop}`);
    });
    console.log('');
}
if (validation.missing.length === 0 && validation.extra.length === 0) {
    console.log('✅ All state properties are consistent between commands.ts and winchState.ts');
}
else {
    console.log('📋 Summary:');
    console.log(`   - ${validation.missing.length} missing properties`);
    console.log(`   - ${validation.extra.length} extra properties`);
    console.log('');
    console.log('💡 Consider updating winchState.ts to match the commands configuration');
}
console.log('\n📊 All command state properties:');
const allStateProperties = extractStateProperties();
allStateProperties.forEach(prop => {
    console.log(`   - ${prop}`);
});
//# sourceMappingURL=validate-state-consistency.js.map