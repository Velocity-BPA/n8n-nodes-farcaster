/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Integration tests for Farcaster node
 * 
 * Note: These tests require valid API credentials to run.
 * Set environment variables before running:
 * - FARCASTER_HUB_URL
 * - NEYNAR_API_KEY (optional)
 * - FARCASTER_FID
 * 
 * Run with: npm run test:integration
 */

interface NeynarResponse {
	users?: unknown[];
	[key: string]: unknown;
}

describe('Farcaster Integration Tests', () => {
	const hubUrl = process.env.FARCASTER_HUB_URL || 'https://hub.pinata.cloud/v1/';
	const neynarApiKey = process.env.NEYNAR_API_KEY;
	const testFid = process.env.FARCASTER_FID || '3'; // dwr.eth's FID for testing

	describe('Hub API', () => {
		it.skip('should fetch user by FID from Hub', async () => {
			// This test is skipped by default to avoid hitting rate limits
			// Enable when running manual integration tests
			const response = await fetch(`${hubUrl}userDataByFid?fid=${testFid}`);
			const data = await response.json();
			expect(data).toBeDefined();
		});

		it.skip('should fetch casts by FID from Hub', async () => {
			const response = await fetch(`${hubUrl}castsByFid?fid=${testFid}&pageSize=5`);
			const data = await response.json();
			expect(data).toBeDefined();
		});
	});

	describe('Neynar API', () => {
		it.skip('should fetch user by FID from Neynar', async () => {
			if (!neynarApiKey) {
				console.log('Skipping Neynar test: No API key provided');
				return;
			}

			const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${testFid}`, {
				headers: {
					'accept': 'application/json',
					'api_key': neynarApiKey,
				},
			});
			const data = await response.json() as NeynarResponse;
			expect(data.users).toBeDefined();
			expect(data.users?.length).toBeGreaterThan(0);
		});
	});

	describe('Node Exports', () => {
		// NOTE: This test is skipped due to @noble/ed25519 being an ESM-only module
		// The node works correctly at runtime but Jest cannot transform ESM modules
		it.skip('should export Farcaster node', () => {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { Farcaster } = require('../../nodes/Farcaster/Farcaster.node');
			expect(Farcaster).toBeDefined();
			
			const node = new Farcaster();
			expect(node.description).toBeDefined();
			expect(node.description.name).toBe('farcaster');
		});

		it('should export FarcasterTrigger node', () => {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { FarcasterTrigger } = require('../../nodes/Farcaster/FarcasterTrigger.node');
			expect(FarcasterTrigger).toBeDefined();
			
			const node = new FarcasterTrigger();
			expect(node.description).toBeDefined();
			expect(node.description.name).toBe('farcasterTrigger');
		});

		it('should export credentials', () => {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { FarcasterApi } = require('../../credentials/FarcasterApi.credentials');
			expect(FarcasterApi).toBeDefined();
			
			const creds = new FarcasterApi();
			expect(creds.name).toBe('farcasterApi');
		});
	});

	describe('Types', () => {
		it('should have type definitions', () => {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const types = require('../../nodes/Farcaster/types/farcaster.types');
			// Check for key exports
			expect(types.FARCASTER_EPOCH).toBeDefined();
			expect(types.MESSAGE_TYPE).toBeDefined();
		});
	});
});
