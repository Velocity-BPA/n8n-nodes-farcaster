/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IDataObject } from 'n8n-workflow';
import {
	returnDataToN8n,
	extractCastHash,
	extractFid,
	isValidEthAddress,
	farcasterToUnixTimestamp,
	sleep,
} from '../../nodes/Farcaster/utils/helpers';

describe('Helpers', () => {
	describe('farcasterToUnixTimestamp', () => {
		it('should convert Farcaster timestamp to Unix timestamp', () => {
			// Farcaster epoch is Jan 1, 2021 00:00:00 UTC = 1609459200
			const farcasterTimestamp = 0;
			const result = farcasterToUnixTimestamp(farcasterTimestamp);
			expect(result).toBe(1609459200);
		});

		it('should handle a non-zero Farcaster timestamp', () => {
			// 86400 seconds = 1 day after epoch
			const farcasterTimestamp = 86400;
			const result = farcasterToUnixTimestamp(farcasterTimestamp);
			expect(result).toBe(1609459200 + 86400); // Jan 2, 2021
		});
	});

	describe('returnDataToN8n', () => {
		it('should wrap single object in array with json property', () => {
			const data: IDataObject = { foo: 'bar' };
			const result = returnDataToN8n(data);
			expect(result).toEqual([{ json: { foo: 'bar' } }]);
		});

		it('should wrap array items each with json property', () => {
			const data: IDataObject[] = [{ foo: 'bar' }, { baz: 'qux' }];
			const result = returnDataToN8n(data);
			expect(result).toEqual([
				{ json: { foo: 'bar' } },
				{ json: { baz: 'qux' } },
			]);
		});

		it('should handle empty array', () => {
			const data: IDataObject[] = [];
			const result = returnDataToN8n(data);
			expect(result).toEqual([]);
		});
	});

	describe('extractCastHash', () => {
		it('should handle hash in URL format', () => {
			// The function extracts alphanumeric hash at end of URL
			const hash = '0x1234567890abcdef1234567890abcdef12345678';
			const result = extractCastHash(hash);
			expect(result).toBe('1234567890abcdef1234567890abcdef12345678');
		});

		it('should remove 0x prefix', () => {
			const hash = '0x1234567890abcdef1234567890abcdef12345678';
			const result = extractCastHash(hash);
			expect(result).toBe('1234567890abcdef1234567890abcdef12345678');
		});

		it('should return clean hash as-is', () => {
			const hash = '1234567890abcdef1234567890abcdef12345678';
			const result = extractCastHash(hash);
			expect(result).toBe('1234567890abcdef1234567890abcdef12345678');
		});
	});

	describe('extractFid', () => {
		it('should return number FID directly', () => {
			expect(extractFid(12345)).toBe(12345);
		});

		it('should parse string FID', () => {
			expect(extractFid('12345')).toBe(12345);
		});

		it('should throw for invalid FID', () => {
			expect(() => extractFid('invalid')).toThrow('Invalid FID');
		});
	});

	describe('isValidEthAddress', () => {
		it('should return true for valid address', () => {
			const validAddress = '0x' + 'a'.repeat(40);
			expect(isValidEthAddress(validAddress)).toBe(true);
		});

		it('should return false for invalid address', () => {
			expect(isValidEthAddress('')).toBe(false);
			expect(isValidEthAddress('0x')).toBe(false);
			expect(isValidEthAddress('invalid')).toBe(false);
		});
	});

	describe('sleep', () => {
		it('should delay for specified milliseconds', async () => {
			const start = Date.now();
			await sleep(100);
			const elapsed = Date.now() - start;
			expect(elapsed).toBeGreaterThanOrEqual(95);
		});
	});
});
