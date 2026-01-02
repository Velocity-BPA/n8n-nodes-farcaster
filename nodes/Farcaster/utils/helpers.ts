/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IDataObject, INodeExecutionData } from 'n8n-workflow';

/**
 * Convert API response to n8n format
 */
export function returnDataToN8n(data: IDataObject | IDataObject[]): INodeExecutionData[] {
	if (Array.isArray(data)) {
		return data.map(item => ({ json: item }));
	}
	return [{ json: data }];
}

/**
 * Parse pagination parameters
 */
export function getPaginationParams(
	limit?: number,
	cursor?: string,
): { limit?: number; cursor?: string; pageSize?: number; pageToken?: string } {
	const params: { limit?: number; cursor?: string; pageSize?: number; pageToken?: string } = {};
	
	if (limit) {
		params.limit = limit;
		params.pageSize = limit;
	}
	
	if (cursor) {
		params.cursor = cursor;
		params.pageToken = cursor;
	}
	
	return params;
}

/**
 * Extract cast hash from various formats
 */
export function extractCastHash(input: string): string {
	// Handle Warpcast URLs
	const warpcastMatch = input.match(/warpcast\.com\/[^/]+\/([0-9a-f]+)/i);
	if (warpcastMatch) {
		return warpcastMatch[1];
	}
	
	// Handle direct hash with or without 0x prefix
	const cleanHash = input.replace(/^0x/, '').toLowerCase();
	if (/^[0-9a-f]{40}$/.test(cleanHash)) {
		return cleanHash;
	}
	
	return input;
}

/**
 * Extract FID from various formats
 */
export function extractFid(input: string | number): number {
	if (typeof input === 'number') {
		return input;
	}
	
	// Handle Warpcast profile URLs
	const warpcastMatch = input.match(/warpcast\.com\/([^/]+)/);
	if (warpcastMatch) {
		// This would need to be resolved via API
		throw new Error('Username resolution not supported in this context. Please provide FID directly.');
	}
	
	// Handle direct FID
	const fid = parseInt(input, 10);
	if (!isNaN(fid) && fid > 0) {
		return fid;
	}
	
	throw new Error(`Invalid FID: ${input}`);
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number | string): string {
	const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
	return new Date(ts * 1000).toISOString();
}

/**
 * Parse channel URL to ID
 */
export function parseChannelUrl(url: string): string {
	// Handle full channel URLs
	const urlMatch = url.match(/\/channel\/([^/]+)/);
	if (urlMatch) {
		return urlMatch[1];
	}
	
	// Handle chain:// protocol URLs
	const chainMatch = url.match(/chain:\/\/eip155:1\/erc721:0x[^/]+/);
	if (chainMatch) {
		return url;
	}
	
	// Return as-is if it's just an ID
	return url;
}

/**
 * Build parent URL for channel cast
 */
export function buildChannelParentUrl(channelId: string): string {
	// Standard channel parent URL format
	return `https://warpcast.com/~/channel/${channelId}`;
}

/**
 * Validate and clean embeds
 */
export function cleanEmbeds(embeds: Array<{ url?: string; castId?: { fid: number; hash: string } }>): Array<{ url?: string; castId?: { fid: number; hash: string } }> {
	return embeds.filter(embed => embed.url || embed.castId).map(embed => {
		if (embed.castId) {
			return {
				castId: {
					fid: embed.castId.fid,
					hash: extractCastHash(embed.castId.hash),
				},
			};
		}
		return { url: embed.url };
	});
}

/**
 * Parse mentions from text
 */
export function parseMentions(text: string): { mentions: string[]; positions: number[] } {
	const mentions: string[] = [];
	const positions: number[] = [];
	
	const regex = /@([a-z0-9_]+)/gi;
	let match;
	
	while ((match = regex.exec(text)) !== null) {
		mentions.push(match[1]);
		positions.push(match.index);
	}
	
	return { mentions, positions };
}

/**
 * Create error response
 */
export function createErrorResponse(message: string, code?: string): IDataObject {
	return {
		success: false,
		error: {
			message,
			code: code || 'UNKNOWN_ERROR',
		},
	};
}

/**
 * Create success response
 */
export function createSuccessResponse(data: IDataObject, message?: string): IDataObject {
	return {
		success: true,
		...(message && { message }),
		data,
	};
}

/**
 * Safely get nested property
 */
export function getNestedProperty<T>(obj: IDataObject, path: string, defaultValue?: T): T | undefined {
	const keys = path.split('.');
	let current: unknown = obj;
	
	for (const key of keys) {
		if (current === null || current === undefined) {
			return defaultValue;
		}
		current = (current as Record<string, unknown>)[key];
	}
	
	return (current as T) ?? defaultValue;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}
	return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sleep helper for rate limiting
 */
export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry helper with exponential backoff
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries = 3,
	initialDelay = 1000,
): Promise<T> {
	let lastError: Error | undefined;
	
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;
			if (attempt < maxRetries - 1) {
				await sleep(initialDelay * Math.pow(2, attempt));
			}
		}
	}
	
	throw lastError;
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
	const batches: T[][] = [];
	for (let i = 0; i < array.length; i += batchSize) {
		batches.push(array.slice(i, i + batchSize));
	}
	return batches;
}

/**
 * Deduplicate array by key
 */
export function deduplicateByKey<T>(array: T[], key: keyof T): T[] {
	const seen = new Set<unknown>();
	return array.filter(item => {
		const value = item[key];
		if (seen.has(value)) {
			return false;
		}
		seen.add(value);
		return true;
	});
}

/**
 * Sort array by property
 */
export function sortByProperty<T>(array: T[], property: keyof T, order: 'asc' | 'desc' = 'desc'): T[] {
	return [...array].sort((a, b) => {
		const aVal = a[property];
		const bVal = b[property];
		
		if (aVal < bVal) return order === 'asc' ? -1 : 1;
		if (aVal > bVal) return order === 'asc' ? 1 : -1;
		return 0;
	});
}

/**
 * Generate random nonce for SIWF
 */
export function generateNonce(length = 16): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	const randomValues = new Uint8Array(length);
	
	// Use crypto.getRandomValues if available, otherwise fallback
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		crypto.getRandomValues(randomValues);
	} else {
		for (let i = 0; i < length; i++) {
			randomValues[i] = Math.floor(Math.random() * 256);
		}
	}
	
	for (let i = 0; i < length; i++) {
		result += chars[randomValues[i] % chars.length];
	}
	
	return result;
}

/**
 * Validate Ethereum address format
 */
export function isValidEthAddress(address: string): boolean {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Convert Farcaster timestamp to Unix timestamp
 * Farcaster epoch is January 1, 2021 00:00:00 UTC
 */
export function farcasterToUnixTimestamp(farcasterTimestamp: number): number {
	const FARCASTER_EPOCH = 1609459200; // Jan 1, 2021 00:00:00 UTC
	return farcasterTimestamp + FARCASTER_EPOCH;
}

/**
 * Convert Unix timestamp to Farcaster timestamp
 */
export function unixToFarcasterTimestamp(unixTimestamp: number): number {
	const FARCASTER_EPOCH = 1609459200;
	return unixTimestamp - FARCASTER_EPOCH;
}

/**
 * Get current Farcaster timestamp
 */
export function getCurrentFarcasterTimestamp(): number {
	return unixToFarcasterTimestamp(Math.floor(Date.now() / 1000));
}
