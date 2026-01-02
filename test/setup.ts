/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

// Global test setup
jest.setTimeout(30000);

// Mock console.warn for licensing notice
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
	// Suppress licensing notice during tests
	const firstArg = args[0];
	if (typeof firstArg === 'string' && firstArg.includes('Velocity BPA Licensing Notice')) {
		return;
	}
	originalWarn.apply(console, args);
};

// Export test utilities
export const testUtils = {
	mockFid: 12345,
	mockCastHash: '0x' + '0'.repeat(40),
	mockAddress: '0x' + '1'.repeat(40),
};
