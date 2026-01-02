/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { hubApiRequest, neynarApiRequest, getCredentials } from '../../transport/api';
import { returnDataToN8n } from '../../utils/helpers';

export const storageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['storage'],
			},
		},
		options: [
			{
				name: 'Buy Storage',
				value: 'buyStorage',
				description: 'Purchase storage units',
				action: 'Buy storage units',
			},
			{
				name: 'Get Storage Limits',
				value: 'getStorageLimits',
				description: 'Get FID storage limits',
				action: 'Get storage limits',
			},
			{
				name: 'Get Storage Units',
				value: 'getStorageUnits',
				description: 'Get rent information',
				action: 'Get storage units',
			},
			{
				name: 'Get Storage Usage',
				value: 'getStorageUsage',
				description: 'Get current storage usage',
				action: 'Get storage usage',
			},
		],
		default: 'getStorageUsage',
	},
];

export const storageFields: INodeProperties[] = [
	// FID for storage operations
	{
		displayName: 'FID',
		name: 'fid',
		type: 'number',
		required: true,
		default: 0,
		description: 'The Farcaster ID of the user',
		displayOptions: {
			show: {
				resource: ['storage'],
				operation: ['getStorageUsage', 'getStorageLimits', 'buyStorage'],
			},
		},
	},
	// Units to buy
	{
		displayName: 'Units',
		name: 'units',
		type: 'number',
		required: true,
		default: 1,
		description: 'Number of storage units to purchase',
		displayOptions: {
			show: {
				resource: ['storage'],
				operation: ['buyStorage'],
			},
		},
	},
	// Options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['storage'],
			},
		},
		options: [
			{
				displayName: 'Include Details',
				name: 'includeDetails',
				type: 'boolean',
				default: true,
				description: 'Whether to include detailed breakdown',
			},
		],
	},
];

export async function executeStorageOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'getStorageUsage': {
			const fid = this.getNodeParameter('fid', i) as number;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'GET', `farcaster/storage/usage`, undefined, { fid });
				responseData = response as IDataObject;
			} else {
				// Hub API - get storage allocations
				const response = await hubApiRequest.call(this, 'GET', 'storageLimitsByFid', undefined, { fid });
				responseData = response as IDataObject;
			}
			break;
		}

		case 'getStorageLimits': {
			const fid = this.getNodeParameter('fid', i) as number;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'GET', `farcaster/storage/allocations`, undefined, { fid });
				responseData = response as IDataObject;
			} else {
				const response = await hubApiRequest.call(this, 'GET', 'storageLimitsByFid', undefined, { fid });
				responseData = response as IDataObject;
			}
			break;
		}

		case 'getStorageUnits': {
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/storage/buy');
				responseData = response as IDataObject;
			} else {
				responseData = { 
					message: 'Storage unit pricing requires Neynar API',
					note: 'Use on-chain methods to check storage rent prices directly',
				};
			}
			break;
		}

		case 'buyStorage': {
			const fid = this.getNodeParameter('fid', i) as number;
			const units = this.getNodeParameter('units', i) as number;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				// Neynar provides transaction data for buying storage
				const response = await neynarApiRequest.call(this, 'POST', 'farcaster/storage/buy', {
					fid,
					units,
				});
				responseData = response as IDataObject;
			} else {
				responseData = { 
					message: 'Storage purchase requires Neynar API or direct on-chain transaction',
					fid,
					units,
					note: 'Storage is purchased on-chain on Optimism',
				};
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
