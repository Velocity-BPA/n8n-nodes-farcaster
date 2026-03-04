import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class FarcasterApi implements ICredentialType {
	name = 'farcasterApi';
	displayName = 'Farcaster API';
	documentationUrl = 'https://docs.neynar.com/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			default: '',
			description: 'Your Neynar API key for Farcaster API access',
		},
		{
			displayName: 'API Base URL',
			name: 'baseUrl',
			type: 'options',
			options: [
				{
					name: 'Neynar API (Primary)',
					value: 'https://api.neynar.com/v2',
				},
				{
					name: 'Warpcast API',
					value: 'https://client.warpcast.com/v2',
				},
				{
					name: 'Farcaster Hub API',
					value: 'https://hub.farcaster.xyz',
				},
			],
			required: true,
			default: 'https://api.neynar.com/v2',
			description: 'The base URL for the Farcaster API',
		},
		{
			displayName: 'Ed25519 Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: false,
			default: '',
			description: 'Ed25519 private key for signing operations (required for Hub API writes and SIWF)',
		},
	];
}