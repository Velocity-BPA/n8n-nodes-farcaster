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
import { returnDataToN8n, buildChannelParentUrl } from '../../utils/helpers';

export const feedOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['feed'],
			},
		},
		options: [
			{
				name: 'Get Channel Feed',
				value: 'getChannelFeed',
				description: 'Get channel-specific feed',
				action: 'Get channel feed',
			},
			{
				name: 'Get For You Feed',
				value: 'getForYouFeed',
				description: 'Get algorithmic recommendations',
				action: 'Get for you feed',
			},
			{
				name: 'Get Home Feed',
				value: 'getHomeFeed',
				description: 'Get personalized feed',
				action: 'Get home feed',
			},
			{
				name: 'Get Trending Feed',
				value: 'getTrendingFeed',
				description: 'Get popular content',
				action: 'Get trending feed',
			},
			{
				name: 'Get User Feed',
				value: 'getUserFeed',
				description: "Get user's posts",
				action: 'Get user feed',
			},
		],
		default: 'getHomeFeed',
	},
];

export const feedFields: INodeProperties[] = [
	// FID for feeds that need it
	{
		displayName: 'FID',
		name: 'fid',
		type: 'number',
		required: true,
		default: 0,
		description: 'The Farcaster ID of the user',
		displayOptions: {
			show: {
				resource: ['feed'],
				operation: ['getHomeFeed', 'getUserFeed', 'getForYouFeed'],
			},
		},
	},
	// Channel ID
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the channel',
		displayOptions: {
			show: {
				resource: ['feed'],
				operation: ['getChannelFeed'],
			},
		},
	},
	// Feed Type Options
	{
		displayName: 'Feed Type',
		name: 'feedType',
		type: 'options',
		options: [
			{ name: 'Following', value: 'following' },
			{ name: 'Filter', value: 'filter' },
		],
		default: 'following',
		description: 'Type of feed to retrieve',
		displayOptions: {
			show: {
				resource: ['feed'],
				operation: ['getHomeFeed'],
			},
		},
	},
	// Trending Time Window
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
		description: 'Time window for trending content',
		displayOptions: {
			show: {
				resource: ['feed'],
				operation: ['getTrendingFeed'],
			},
		},
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
				resource: ['feed'],
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
				resource: ['feed'],
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
				resource: ['feed'],
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
				displayName: 'With Recasts',
				name: 'withRecasts',
				type: 'boolean',
				default: true,
				description: 'Whether to include recasts',
			},
			{
				displayName: 'Include Replies',
				name: 'includeReplies',
				type: 'boolean',
				default: false,
				description: 'Whether to include replies',
			},
			{
				displayName: 'Channel ID Filter',
				name: 'channelId',
				type: 'string',
				default: '',
				description: 'Filter by channel',
			},
			{
				displayName: 'Embed Types',
				name: 'embedTypes',
				type: 'multiOptions',
				options: [
					{ name: 'Images', value: 'image' },
					{ name: 'Videos', value: 'video' },
					{ name: 'Frames', value: 'frame' },
					{ name: 'URLs', value: 'url' },
				],
				default: [],
				description: 'Filter by embed type',
			},
		],
	},
];

export async function executeFeedOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'getHomeFeed': {
			const fid = this.getNodeParameter('fid', i) as number;
			const feedType = this.getNodeParameter('feedType', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = {
					fid,
					limit,
					feed_type: feedType,
					with_recasts: options.withRecasts !== false,
				};
				if (cursor) query.cursor = cursor;
				if (options.viewerFid) query.viewer_fid = options.viewerFid;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/feed', undefined, query);
				responseData = response.casts as IDataObject[] || [];
			} else {
				// Hub doesn't have feed endpoints - would need to aggregate from followed users
				responseData = { message: 'Home feed requires Neynar API' };
			}
			break;
		}

		case 'getChannelFeed': {
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

		case 'getUserFeed': {
			const fid = this.getNodeParameter('fid', i) as number;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = {
					fid,
					limit,
					include_replies: options.includeReplies || false,
					with_recasts: options.withRecasts !== false,
				};
				if (cursor) query.cursor = cursor;
				if (options.viewerFid) query.viewer_fid = options.viewerFid;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/feed/user/casts', undefined, query);
				responseData = response.casts as IDataObject[] || [];
			} else {
				const response = await hubApiRequest.call(this, 'GET', 'castsByFid', undefined, {
					fid,
					pageSize: limit,
					...(cursor && { pageToken: cursor }),
				});
				responseData = response.messages as IDataObject[] || [];
			}
			break;
		}

		case 'getTrendingFeed': {
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const timeWindow = this.getNodeParameter('timeWindow', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = {
					limit,
					time_window: timeWindow,
				};
				if (cursor) query.cursor = cursor;
				if (options.viewerFid) query.viewer_fid = options.viewerFid;
				if (options.channelId) query.channel_id = options.channelId;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/feed/trending', undefined, query);
				responseData = response.casts as IDataObject[] || [];
			} else {
				responseData = { message: 'Trending feed requires Neynar API' };
			}
			break;
		}

		case 'getForYouFeed': {
			const fid = this.getNodeParameter('fid', i) as number;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = {
					fid,
					limit,
					with_recasts: options.withRecasts !== false,
				};
				if (cursor) query.cursor = cursor;
				if (options.viewerFid) query.viewer_fid = options.viewerFid;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/feed/for_you', undefined, query);
				responseData = response.casts as IDataObject[] || [];
			} else {
				responseData = { message: 'For You feed requires Neynar API' };
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
