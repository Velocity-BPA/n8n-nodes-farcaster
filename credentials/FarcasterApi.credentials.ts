/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FarcasterApi implements ICredentialType {
	name = 'farcasterApi';
	displayName = 'Farcaster API';
	documentationUrl = 'https://docs.farcaster.xyz/';
	properties: INodeProperties[] = [
		{
			displayName: 'Hub HTTP Endpoint',
			name: 'hubEndpoint',
			type: 'string',
			default: 'https://hub.pinata.cloud/v1/',
			description: 'The HTTP endpoint for the Farcaster Hub API. Default is Pinata\'s public hub.',
			placeholder: 'https://hub.pinata.cloud/v1/',
		},
		{
			displayName: 'Use Neynar API',
			name: 'useNeynar',
			type: 'boolean',
			default: false,
			description: 'Whether to use Neynar API for enhanced features and better rate limits',
		},
		{
			displayName: 'Neynar API Key',
			name: 'neynarApiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'API key for Neynar enhanced API (optional)',
			displayOptions: {
				show: {
					useNeynar: [true],
				},
			},
		},
		{
			displayName: 'Neynar API Endpoint',
			name: 'neynarEndpoint',
			type: 'string',
			default: 'https://api.neynar.com/v2/',
			description: 'The endpoint for Neynar API',
			displayOptions: {
				show: {
					useNeynar: [true],
				},
			},
		},
		{
			displayName: 'Farcaster ID (FID)',
			name: 'fid',
			type: 'number',
			default: 0,
			description: 'Your Farcaster ID (required for authenticated operations)',
		},
		{
			displayName: 'Signer Private Key (Ed25519)',
			name: 'signerPrivateKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Ed25519 private key for signing messages (hex encoded, required for write operations)',
		},
		{
			displayName: 'Signer Public Key',
			name: 'signerPublicKey',
			type: 'string',
			default: '',
			description: 'Ed25519 public key corresponding to the signer (hex encoded)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Content-Type': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.hubEndpoint}}',
			url: 'info',
			method: 'GET',
		},
	};
}
