/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IDataObject,
	NodeApiError,
	IHttpRequestOptions,
	IHttpRequestMethods,
} from 'n8n-workflow';

export interface FarcasterCredentials {
	hubEndpoint: string;
	useNeynar: boolean;
	neynarApiKey?: string;
	neynarEndpoint?: string;
	fid: number;
	signerPrivateKey?: string;
	signerPublicKey?: string;
}

/**
 * Get credentials from n8n
 */
export async function getCredentials(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
): Promise<FarcasterCredentials> {
	const credentials = await this.getCredentials('farcasterApi');
	return {
		hubEndpoint: credentials.hubEndpoint as string,
		useNeynar: credentials.useNeynar as boolean,
		neynarApiKey: credentials.neynarApiKey as string | undefined,
		neynarEndpoint: credentials.neynarEndpoint as string | undefined,
		fid: credentials.fid as number,
		signerPrivateKey: credentials.signerPrivateKey as string | undefined,
		signerPublicKey: credentials.signerPublicKey as string | undefined,
	};
}

/**
 * Make a Hub API request
 */
export async function hubApiRequest(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	query?: IDataObject,
): Promise<IDataObject> {
	const credentials = await getCredentials.call(this);
	
	const baseUrl = credentials.hubEndpoint.replace(/\/$/, '');
	
	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}/${endpoint.replace(/^\//, '')}`,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (query && Object.keys(query).length > 0) {
		options.qs = query;
	}

	try {
		const response = await this.helpers.httpRequest(options);
		return response as IDataObject;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new NodeApiError(this.getNode(), { message: errorMessage }, {
			message: `Hub API request failed: ${errorMessage}`,
		});
	}
}

/**
 * Make a Neynar API request
 */
export async function neynarApiRequest(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	query?: IDataObject,
): Promise<IDataObject> {
	const credentials = await getCredentials.call(this);
	
	if (!credentials.useNeynar || !credentials.neynarApiKey) {
		throw new Error('Neynar API is not configured. Please enable Neynar and provide an API key.');
	}

	const baseUrl = (credentials.neynarEndpoint || 'https://api.neynar.com/v2').replace(/\/$/, '');
	
	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}/${endpoint.replace(/^\//, '')}`,
		headers: {
			'Content-Type': 'application/json',
			'api_key': credentials.neynarApiKey,
		},
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (query && Object.keys(query).length > 0) {
		options.qs = query;
	}

	try {
		const response = await this.helpers.httpRequest(options);
		return response as IDataObject;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new NodeApiError(this.getNode(), { message: errorMessage }, {
			message: `Neynar API request failed: ${errorMessage}`,
		});
	}
}

/**
 * Make an API request, preferring Neynar if configured
 */
export async function farcasterApiRequest(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	hubEndpoint: string,
	neynarEndpoint: string,
	body?: IDataObject,
	hubQuery?: IDataObject,
	neynarQuery?: IDataObject,
): Promise<IDataObject> {
	const credentials = await getCredentials.call(this);
	
	if (credentials.useNeynar && credentials.neynarApiKey) {
		return neynarApiRequest.call(this, method, neynarEndpoint, body, neynarQuery || hubQuery);
	}
	
	return hubApiRequest.call(this, method, hubEndpoint, body, hubQuery);
}

/**
 * Make a paginated Hub API request
 */
export async function hubApiRequestAllItems(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	query?: IDataObject,
	propertyName = 'messages',
): Promise<IDataObject[]> {
	const returnData: IDataObject[] = [];
	let nextPageToken: string | undefined;

	do {
		const requestQuery = { ...query };
		if (nextPageToken) {
			requestQuery.pageToken = nextPageToken;
		}

		const response = await hubApiRequest.call(this, method, endpoint, body, requestQuery);
		
		const items = response[propertyName] as IDataObject[];
		if (items) {
			returnData.push(...items);
		}

		nextPageToken = response.nextPageToken as string | undefined;
	} while (nextPageToken);

	return returnData;
}

/**
 * Make a paginated Neynar API request
 */
export async function neynarApiRequestAllItems(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	query?: IDataObject,
	propertyName = 'result',
): Promise<IDataObject[]> {
	const returnData: IDataObject[] = [];
	let cursor: string | undefined;

	do {
		const requestQuery = { ...query };
		if (cursor) {
			requestQuery.cursor = cursor;
		}

		const response = await neynarApiRequest.call(this, method, endpoint, body, requestQuery);
		
		const items = response[propertyName];
		if (Array.isArray(items)) {
			returnData.push(...(items as IDataObject[]));
		} else if (items) {
			returnData.push(items as IDataObject);
		}

		cursor = response.cursor as string | undefined;
		if (!cursor && response.next) {
			cursor = (response.next as IDataObject).cursor as string | undefined;
		}
	} while (cursor);

	return returnData;
}

/**
 * Submit a signed message to the Hub
 */
export async function submitMessage(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	signedMessage: IDataObject,
): Promise<IDataObject> {
	return hubApiRequest.call(this, 'POST', 'submitMessage', signedMessage);
}

/**
 * Build a URL with query parameters
 */
export function buildUrl(baseUrl: string, params: Record<string, string | number | boolean | undefined>): string {
	const url = new URL(baseUrl);
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			url.searchParams.append(key, String(value));
		}
	});
	return url.toString();
}

/**
 * Parse cast hash - handles both full hash and truncated format
 */
export function parseCastHash(hash: string): string {
	// Remove 0x prefix if present
	if (hash.startsWith('0x')) {
		return hash.slice(2);
	}
	return hash;
}

/**
 * Format hash for display - adds 0x prefix
 */
export function formatHash(hash: string): string {
	if (!hash.startsWith('0x')) {
		return `0x${hash}`;
	}
	return hash;
}

/**
 * Convert Farcaster timestamp to Unix timestamp
 */
export function farcasterTimestampToUnix(farcasterTimestamp: number): number {
	const FARCASTER_EPOCH = 1609459200; // Jan 1, 2021 UTC
	return farcasterTimestamp + FARCASTER_EPOCH;
}

/**
 * Convert Unix timestamp to Farcaster timestamp
 */
export function unixToFarcasterTimestamp(unixTimestamp: number): number {
	const FARCASTER_EPOCH = 1609459200; // Jan 1, 2021 UTC
	return unixTimestamp - FARCASTER_EPOCH;
}

/**
 * Get current Farcaster timestamp
 */
export function getCurrentFarcasterTimestamp(): number {
	return unixToFarcasterTimestamp(Math.floor(Date.now() / 1000));
}

/**
 * Validate FID
 */
export function isValidFid(fid: number): boolean {
	return Number.isInteger(fid) && fid > 0;
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
	// Farcaster usernames: 1-16 chars, lowercase, alphanumeric, underscores
	return /^[a-z0-9_]{1,16}$/.test(username);
}

/**
 * Validate Ethereum address
 */
export function isValidEthAddress(address: string): boolean {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate cast hash
 */
export function isValidCastHash(hash: string): boolean {
	const cleanHash = parseCastHash(hash);
	return /^[a-fA-F0-9]{40}$/.test(cleanHash);
}
