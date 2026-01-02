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
import { hubApiRequest, neynarApiRequest, getCredentials, submitMessage } from '../../transport/api';
import { createSignedCastAdd } from '../../utils/signing';
import { returnDataToN8n, buildChannelParentUrl, cleanEmbeds, extractCastHash } from '../../utils/helpers';

export const channelsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['channels'],
			},
		},
		options: [
			{
				name: 'Create Channel Cast',
				value: 'createChannelCast',
				description: 'Post to channel (requires signer)',
				action: 'Create channel cast',
			},
			{
				name: 'Get Channel Casts',
				value: 'getChannelCasts',
				description: 'Get posts in channel',
				action: 'Get channel casts',
			},
			{
				name: 'Get Channel Info',
				value: 'getChannelInfo',
				description: 'Get channel details by ID',
				action: 'Get channel info',
			},
			{
				name: 'Get Channel Members',
				value: 'getChannelMembers',
				description: 'Get channel followers',
				action: 'Get channel members',
			},
			{
				name: 'Get Channel Moderators',
				value: 'getChannelModerators',
				description: 'Get mods and hosts',
				action: 'Get channel moderators',
			},
			{
				name: 'Get Trending Channels',
				value: 'getTrendingChannels',
				description: 'Get popular channels',
				action: 'Get trending channels',
			},
			{
				name: 'List All Channels',
				value: 'listAllChannels',
				description: 'Get all available channels',
				action: 'List all channels',
			},
			{
				name: 'Search Channels',
				value: 'searchChannels',
				description: 'Find channels by query',
				action: 'Search channels',
			},
		],
		default: 'getChannelInfo',
	},
];

export const channelsFields: INodeProperties[] = [
	// Channel ID
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the channel (e.g., "ethereum", "farcaster")',
		displayOptions: {
			show: {
				resource: ['channels'],
				operation: ['getChannelInfo', 'getChannelCasts', 'getChannelMembers', 'getChannelModerators', 'createChannelCast'],
			},
		},
	},
	// Search Query
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		description: 'Search query for channels',
		displayOptions: {
			show: {
				resource: ['channels'],
				operation: ['searchChannels'],
			},
		},
	},
	// Create Channel Cast fields
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		required: true,
		default: '',
		description: 'The text content of the cast (max 320 bytes)',
		displayOptions: {
			show: {
				resource: ['channels'],
				operation: ['createChannelCast'],
			},
		},
	},
	{
		displayName: 'Embeds',
		name: 'embeds',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		description: 'URLs or cast embeds to include',
		displayOptions: {
			show: {
				resource: ['channels'],
				operation: ['createChannelCast'],
			},
		},
		options: [
			{
				name: 'embedValues',
				displayName: 'Embed',
				values: [
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						options: [
							{ name: 'URL', value: 'url' },
							{ name: 'Cast', value: 'cast' },
						],
						default: 'url',
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['url'],
							},
						},
					},
					{
						displayName: 'Cast FID',
						name: 'castFid',
						type: 'number',
						default: 0,
						displayOptions: {
							show: {
								type: ['cast'],
							},
						},
					},
					{
						displayName: 'Cast Hash',
						name: 'castHash',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['cast'],
							},
						},
					},
				],
			},
		],
	},
	// Pagination
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 25,
		description: 'Maximum number of results to return',
		displayOptions: {
			show: {
				resource: ['channels'],
				operation: ['listAllChannels', 'getChannelCasts', 'getChannelMembers', 'searchChannels', 'getTrendingChannels'],
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
				resource: ['channels'],
				operation: ['listAllChannels', 'getChannelCasts', 'getChannelMembers', 'searchChannels', 'getTrendingChannels'],
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
				resource: ['channels'],
				operation: ['getChannelCasts', 'getChannelInfo', 'getChannelMembers'],
			},
		},
		options: [
			{
				displayName: 'Viewer FID',
				name: 'viewerFid',
				type: 'number',
				default: 0,
				description: 'Include viewer context for this FID',
			},
			{
				displayName: 'Include Replies',
				name: 'includeReplies',
				type: 'boolean',
				default: false,
				description: 'Whether to include reply casts',
			},
			{
				displayName: 'With Recasts',
				name: 'withRecasts',
				type: 'boolean',
				default: true,
				description: 'Whether to include recasts',
			},
		],
	},
	{
		displayName: 'Time Window',
		name: 'timeWindow',
		type: 'options',
		options: [
			{ name: '1 Hour', value: '1h' },
			{ name: '6 Hours', value: '6h' },
			{ name: '12 Hours', value: '12h' },
			{ name: '24 Hours', value: '24h' },
			{ name: '7 Days', value: '7d' },
		],
		default: '24h',
		description: 'Time window for trending channels',
		displayOptions: {
			show: {
				resource: ['channels'],
				operation: ['getTrendingChannels'],
			},
		},
	},
];

export async function executeChannelsOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'getChannelInfo': {
			const channelId = this.getNodeParameter('channelId', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { id: channelId };
				if (options.viewerFid) query.viewer_fid = options.viewerFid;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/channel', undefined, query);
				responseData = response.channel as IDataObject || response;
			} else {
				// Hub doesn't have direct channel info endpoint
				responseData = { 
					message: 'Channel info requires Neynar API',
					channelId,
					parentUrl: buildChannelParentUrl(channelId),
				};
			}
			break;
		}

		case 'listAllChannels': {
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { limit };
				if (cursor) query.cursor = cursor;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/channel/list', undefined, query);
				responseData = response.channels as IDataObject[] || [];
			} else {
				responseData = { message: 'Channel listing requires Neynar API' };
			}
			break;
		}

		case 'getChannelCasts': {
			const channelId = this.getNodeParameter('channelId', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { 
					channel_id: channelId,
					limit,
					with_recasts: options.withRecasts !== false,
				};
				if (cursor) query.cursor = cursor;
				if (options.viewerFid) query.viewer_fid = options.viewerFid;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/feed/channel', undefined, query);
				responseData = response.casts as IDataObject[] || [];
			} else {
				const parentUrl = buildChannelParentUrl(channelId);
				const response = await hubApiRequest.call(this, 'GET', 'castsByParent', undefined, {
					url: parentUrl,
					pageSize: limit,
					...(cursor && { pageToken: cursor }),
				});
				responseData = response.messages as IDataObject[] || [];
			}
			break;
		}

		case 'getChannelMembers': {
			const channelId = this.getNodeParameter('channelId', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { 
					id: channelId,
					limit,
				};
				if (cursor) query.cursor = cursor;
				if (options.viewerFid) query.viewer_fid = options.viewerFid;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/channel/followers', undefined, query);
				responseData = response.users as IDataObject[] || [];
			} else {
				responseData = { message: 'Channel members requires Neynar API' };
			}
			break;
		}

		case 'getChannelModerators': {
			const channelId = this.getNodeParameter('channelId', i) as string;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/channel', undefined, { id: channelId });
				const channel = response.channel as IDataObject;
				
				responseData = {
					channelId,
					lead: channel.lead || null,
					hosts: channel.hosts || [],
					moderators: channel.moderator_fids || [],
				};
			} else {
				responseData = { message: 'Channel moderators requires Neynar API' };
			}
			break;
		}

		case 'createChannelCast': {
			const channelId = this.getNodeParameter('channelId', i) as string;
			const text = this.getNodeParameter('text', i) as string;
			const embedsInput = this.getNodeParameter('embeds', i) as IDataObject;
			
			if (!credentials.signerPrivateKey) {
				throw new Error('Signer private key is required for posting casts');
			}
			if (!credentials.fid) {
				throw new Error('FID is required for posting casts');
			}

			const options: {
				parentUrl: string;
				embeds?: Array<{ url?: string; castId?: { fid: number; hash: string } }>;
			} = {
				parentUrl: buildChannelParentUrl(channelId),
			};

			// Handle embeds
			if (embedsInput.embedValues) {
				const embedValues = embedsInput.embedValues as IDataObject[];
				options.embeds = embedValues.map(embed => {
					if (embed.type === 'url') {
						return { url: embed.url as string };
					} else {
						return {
							castId: {
								fid: embed.castFid as number,
								hash: extractCastHash(embed.castHash as string),
							},
						};
					}
				});
				options.embeds = cleanEmbeds(options.embeds);
			}

			const signedMessage = await createSignedCastAdd(
				credentials.fid,
				text,
				credentials.signerPrivateKey,
				options,
			);

			responseData = await submitMessage.call(this, signedMessage);
			break;
		}

		case 'getTrendingChannels': {
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const timeWindow = this.getNodeParameter('timeWindow', i) as string;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { 
					limit,
					time_window: timeWindow,
				};
				if (cursor) query.cursor = cursor;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/channel/trending', undefined, query);
				responseData = response.channels as IDataObject[] || [];
			} else {
				responseData = { message: 'Trending channels requires Neynar API' };
			}
			break;
		}

		case 'searchChannels': {
			const query = this.getNodeParameter('query', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const queryParams: IDataObject = { q: query, limit };
				if (cursor) queryParams.cursor = cursor;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/channel/search', undefined, queryParams);
				responseData = response.channels as IDataObject[] || [];
			} else {
				responseData = { message: 'Channel search requires Neynar API' };
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
