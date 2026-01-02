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
import { returnDataToN8n, generateNonce } from '../../utils/helpers';

export const siwfOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['siwf'],
			},
		},
		options: [
			{
				name: 'Create Auth Request',
				value: 'createAuthRequest',
				description: 'Initialize Sign In with Farcaster',
				action: 'Create auth request',
			},
			{
				name: 'Get Auth Status',
				value: 'getAuthStatus',
				description: 'Check authentication state',
				action: 'Get auth status',
			},
			{
				name: 'Verify Auth Response',
				value: 'verifyAuthResponse',
				description: 'Validate signature and get user',
				action: 'Verify auth response',
			},
		],
		default: 'createAuthRequest',
	},
];

export const siwfFields: INodeProperties[] = [
	// App domain
	{
		displayName: 'Domain',
		name: 'domain',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'app.example.com',
		description: 'Your application domain',
		displayOptions: {
			show: {
				resource: ['siwf'],
				operation: ['createAuthRequest', 'verifyAuthResponse'],
			},
		},
	},
	// Siwe URI
	{
		displayName: 'URI',
		name: 'uri',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://app.example.com',
		description: 'The URI of your application',
		displayOptions: {
			show: {
				resource: ['siwf'],
				operation: ['createAuthRequest'],
			},
		},
	},
	// Nonce
	{
		displayName: 'Nonce',
		name: 'nonce',
		type: 'string',
		default: '',
		description: 'Unique nonce for the request (auto-generated if empty)',
		displayOptions: {
			show: {
				resource: ['siwf'],
				operation: ['createAuthRequest', 'verifyAuthResponse'],
			},
		},
	},
	// Channel token (for verifying)
	{
		displayName: 'Channel Token',
		name: 'channelToken',
		type: 'string',
		required: true,
		default: '',
		description: 'The channel token from the auth request',
		displayOptions: {
			show: {
				resource: ['siwf'],
				operation: ['getAuthStatus', 'verifyAuthResponse'],
			},
		},
	},
	// Signature for verification
	{
		displayName: 'Signature',
		name: 'signature',
		type: 'string',
		required: true,
		default: '',
		description: 'The signature from the user authentication',
		displayOptions: {
			show: {
				resource: ['siwf'],
				operation: ['verifyAuthResponse'],
			},
		},
	},
	// Message for verification
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		required: true,
		default: '',
		description: 'The SIWE message that was signed',
		displayOptions: {
			show: {
				resource: ['siwf'],
				operation: ['verifyAuthResponse'],
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
				resource: ['siwf'],
			},
		},
		options: [
			{
				displayName: 'Statement',
				name: 'statement',
				type: 'string',
				default: 'Sign in with Farcaster',
				description: 'Human-readable statement for the user',
			},
			{
				displayName: 'Chain ID',
				name: 'chainId',
				type: 'number',
				default: 10,
				description: 'Chain ID (10 for Optimism)',
			},
			{
				displayName: 'Issued At',
				name: 'issuedAt',
				type: 'string',
				default: '',
				description: 'ISO 8601 datetime when request was issued',
			},
			{
				displayName: 'Expiration Time',
				name: 'expirationTime',
				type: 'string',
				default: '',
				description: 'ISO 8601 datetime when request expires',
			},
			{
				displayName: 'Not Before',
				name: 'notBefore',
				type: 'string',
				default: '',
				description: 'ISO 8601 datetime when request becomes valid',
			},
			{
				displayName: 'Request ID',
				name: 'requestId',
				type: 'string',
				default: '',
				description: 'Optional request identifier',
			},
			{
				displayName: 'Resources',
				name: 'resources',
				type: 'string',
				default: '',
				description: 'Comma-separated list of resource URIs',
			},
		],
	},
];

export async function executeSiwfOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject;

	// SIWF requires Neynar API
	if (!credentials.useNeynar || !credentials.neynarApiKey) {
		return returnDataToN8n({
			error: 'Sign In with Farcaster requires Neynar API',
			message: 'Please enable Neynar API and provide an API key in credentials',
		});
	}

	switch (operation) {
		case 'createAuthRequest': {
			const domain = this.getNodeParameter('domain', i) as string;
			const uri = this.getNodeParameter('uri', i) as string;
			let nonce = this.getNodeParameter('nonce', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			// Generate nonce if not provided
			if (!nonce) {
				nonce = generateNonce();
			}
			
			const body: IDataObject = {
				domain,
				siweUri: uri,
				nonce,
			};
			
			// Add optional fields
			if (options.statement) body.statement = options.statement;
			if (options.chainId) body.chainId = options.chainId;
			if (options.issuedAt) body.issuedAt = options.issuedAt;
			if (options.expirationTime) body.expirationTime = options.expirationTime;
			if (options.notBefore) body.notBefore = options.notBefore;
			if (options.requestId) body.requestId = options.requestId;
			if (options.resources) {
				body.resources = (options.resources as string).split(',').map(r => r.trim());
			}
			
			const response = await neynarApiRequest.call(this, 'POST', 'farcaster/auth', body);
			
			responseData = {
				...response as IDataObject,
				nonce,
				note: 'Direct user to the signInUrl to complete authentication',
			};
			break;
		}

		case 'verifyAuthResponse': {
			const domain = this.getNodeParameter('domain', i) as string;
			const channelToken = this.getNodeParameter('channelToken', i) as string;
			const signature = this.getNodeParameter('signature', i) as string;
			const message = this.getNodeParameter('message', i) as string;
			const nonce = this.getNodeParameter('nonce', i) as string;
			
			const response = await neynarApiRequest.call(this, 'POST', 'farcaster/auth/verify', {
				channelToken,
				domain,
				signature,
				message,
				...(nonce && { nonce }),
			});
			
			responseData = response as IDataObject;
			break;
		}

		case 'getAuthStatus': {
			const channelToken = this.getNodeParameter('channelToken', i) as string;
			
			const response = await neynarApiRequest.call(this, 'GET', 'farcaster/auth/status', undefined, {
				channelToken,
			});
			
			responseData = response as IDataObject;
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
