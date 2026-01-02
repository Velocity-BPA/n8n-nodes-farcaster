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
import { neynarApiRequest, getCredentials } from '../../transport/api';
import { createFrameActionMessage } from '../../utils/signing';
import { returnDataToN8n, extractCastHash } from '../../utils/helpers';

export const framesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['frames'],
			},
		},
		options: [
			{
				name: 'Create Frame Transaction',
				value: 'createFrameTransaction',
				description: 'Build frame transaction data',
				action: 'Create frame transaction',
			},
			{
				name: 'Get Frame Actions',
				value: 'getFrameActions',
				description: 'Get action history for frame',
				action: 'Get frame actions',
			},
			{
				name: 'Get Frame Analytics',
				value: 'getFrameAnalytics',
				description: 'Get frame usage statistics',
				action: 'Get frame analytics',
			},
			{
				name: 'Get Frame by URL',
				value: 'getFrameByURL',
				description: 'Get frame metadata from URL',
				action: 'Get frame by URL',
			},
			{
				name: 'Validate Frame Action',
				value: 'validateFrameAction',
				description: 'Verify frame message signature',
				action: 'Validate frame action',
			},
		],
		default: 'getFrameByURL',
	},
];

export const framesFields: INodeProperties[] = [
	// Frame URL
	{
		displayName: 'Frame URL',
		name: 'frameUrl',
		type: 'string',
		required: true,
		default: '',
		description: 'The URL of the frame',
		displayOptions: {
			show: {
				resource: ['frames'],
				operation: ['getFrameByURL', 'getFrameActions', 'getFrameAnalytics', 'createFrameTransaction'],
			},
		},
	},
	// Validate Frame Action
	{
		displayName: 'Message Bytes',
		name: 'messageBytes',
		type: 'string',
		required: true,
		default: '',
		description: 'The signed frame action message bytes (hex encoded)',
		displayOptions: {
			show: {
				resource: ['frames'],
				operation: ['validateFrameAction'],
			},
		},
	},
	// Create Frame Transaction
	{
		displayName: 'Button Index',
		name: 'buttonIndex',
		type: 'number',
		required: true,
		default: 1,
		description: 'The index of the button clicked (1-4)',
		displayOptions: {
			show: {
				resource: ['frames'],
				operation: ['createFrameTransaction'],
			},
		},
	},
	{
		displayName: 'Cast Hash',
		name: 'castHash',
		type: 'string',
		required: true,
		default: '',
		description: 'The hash of the cast containing the frame',
		displayOptions: {
			show: {
				resource: ['frames'],
				operation: ['createFrameTransaction'],
			},
		},
	},
	{
		displayName: 'Cast Author FID',
		name: 'castFid',
		type: 'number',
		required: true,
		default: 0,
		description: 'FID of the cast author',
		displayOptions: {
			show: {
				resource: ['frames'],
				operation: ['createFrameTransaction'],
			},
		},
	},
	{
		displayName: 'Input Text',
		name: 'inputText',
		type: 'string',
		default: '',
		description: 'Text input from the frame (if applicable)',
		displayOptions: {
			show: {
				resource: ['frames'],
				operation: ['createFrameTransaction'],
			},
		},
	},
	{
		displayName: 'State',
		name: 'state',
		type: 'string',
		default: '',
		description: 'Frame state data',
		displayOptions: {
			show: {
				resource: ['frames'],
				operation: ['createFrameTransaction'],
			},
		},
	},
	// Pagination for actions
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 25,
		description: 'Maximum number of results to return',
		displayOptions: {
			show: {
				resource: ['frames'],
				operation: ['getFrameActions'],
			},
		},
	},
	{
		displayName: 'Cursor',
		name: 'cursor',
		type: 'string',
		default: '',
		description: 'Pagination cursor for next page',
		displayOptions: {
			show: {
				resource: ['frames'],
				operation: ['getFrameActions'],
			},
		},
	},
	// Analytics time range
	{
		displayName: 'Time Range',
		name: 'timeRange',
		type: 'options',
		options: [
			{ name: '1 Day', value: '1d' },
			{ name: '7 Days', value: '7d' },
			{ name: '30 Days', value: '30d' },
		],
		default: '7d',
		description: 'Time range for analytics',
		displayOptions: {
			show: {
				resource: ['frames'],
				operation: ['getFrameAnalytics'],
			},
		},
	},
];

export async function executeFramesOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject | IDataObject[];

	// Most frame operations require Neynar
	if (!credentials.useNeynar || !credentials.neynarApiKey) {
		if (operation !== 'createFrameTransaction') {
			return returnDataToN8n({ 
				message: 'Frame operations require Neynar API. Please enable Neynar in credentials.' 
			});
		}
	}

	switch (operation) {
		case 'getFrameByURL': {
			const frameUrl = this.getNodeParameter('frameUrl', i) as string;
			
			const response = await neynarApiRequest.call(this, 'GET', 'farcaster/frame', undefined, {
				url: frameUrl,
			});
			responseData = response;
			break;
		}

		case 'validateFrameAction': {
			const messageBytes = this.getNodeParameter('messageBytes', i) as string;
			
			const response = await neynarApiRequest.call(this, 'POST', 'farcaster/frame/validate', {
				message_bytes_in_hex: messageBytes.startsWith('0x') ? messageBytes.slice(2) : messageBytes,
			});
			
			responseData = {
				valid: response.valid as boolean,
				action: response.action as IDataObject || null,
				message: response.valid ? 'Frame action is valid' : 'Frame action is invalid',
			};
			break;
		}

		case 'getFrameActions': {
			const frameUrl = this.getNodeParameter('frameUrl', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			
			const query: IDataObject = { url: frameUrl, limit };
			if (cursor) query.cursor = cursor;
			
			const response = await neynarApiRequest.call(this, 'GET', 'farcaster/frame/actions', undefined, query);
			responseData = response.actions as IDataObject[] || [];
			break;
		}

		case 'createFrameTransaction': {
			const frameUrl = this.getNodeParameter('frameUrl', i) as string;
			const buttonIndex = this.getNodeParameter('buttonIndex', i) as number;
			const castHash = extractCastHash(this.getNodeParameter('castHash', i) as string);
			const castFid = this.getNodeParameter('castFid', i) as number;
			const inputText = this.getNodeParameter('inputText', i) as string;
			const state = this.getNodeParameter('state', i) as string;
			
			if (!credentials.signerPrivateKey) {
				throw new Error('Signer private key is required for creating frame transactions');
			}
			if (!credentials.fid) {
				throw new Error('FID is required for creating frame transactions');
			}

			const signedMessage = await createFrameActionMessage(
				credentials.fid,
				frameUrl,
				buttonIndex,
				castFid,
				castHash,
				credentials.signerPrivateKey,
				{
					inputText: inputText || undefined,
					state: state || undefined,
				},
			);

			responseData = {
				message: signedMessage,
				frameUrl,
				buttonIndex,
				note: 'Submit this signed message to the frame\'s postUrl endpoint',
			};
			break;
		}

		case 'getFrameAnalytics': {
			const frameUrl = this.getNodeParameter('frameUrl', i) as string;
			const timeRange = this.getNodeParameter('timeRange', i) as string;
			
			// Note: Neynar analytics API may require specific subscription
			try {
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/frame/analytics', undefined, {
					url: frameUrl,
					time_range: timeRange,
				});
				responseData = response;
			} catch {
				responseData = {
					message: 'Frame analytics may require Neynar paid subscription',
					frameUrl,
					timeRange,
				};
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
