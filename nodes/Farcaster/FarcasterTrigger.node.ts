/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IPollFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

interface FarcasterCredentials {
	hubEndpoint: string;
	useNeynar: boolean;
	neynarApiKey?: string;
	fid?: number;
}

export class FarcasterTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Farcaster Trigger',
		name: 'farcasterTrigger',
		icon: 'file:farcaster.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["triggerType"]}}',
		description: 'Triggers on Farcaster events',
		defaults: {
			name: 'Farcaster Trigger',
		},
		polling: true,
		inputs: [],
		outputs: ['main'] as const,
		credentials: [
			{
				name: 'farcasterApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Trigger Type',
				name: 'triggerType',
				type: 'options',
				options: [
					{
						name: 'Cast Reached Threshold',
						value: 'castReachedThreshold',
						description: 'Cast reached like/recast count',
					},
					{
						name: 'Channel Created',
						value: 'channelCreated',
						description: 'New channel created',
					},
					{
						name: 'Frame Interaction',
						value: 'frameInteraction',
						description: 'Frame button clicked',
					},
					{
						name: 'New Cast by User',
						value: 'newCastByUser',
						description: 'New cast from specific FID',
					},
					{
						name: 'New Cast in Channel',
						value: 'newCastInChannel',
						description: 'New cast in channel',
					},
					{
						name: 'New Follower',
						value: 'newFollower',
						description: 'New follower for FID',
					},
					{
						name: 'New Mention',
						value: 'newMention',
						description: 'User mentioned in cast',
					},
					{
						name: 'New Reply',
						value: 'newReply',
						description: "Reply to user's cast",
					},
				],
				default: 'newCastByUser',
				required: true,
			},
			// FID for user-specific triggers
			{
				displayName: 'FID',
				name: 'fid',
				type: 'number',
				required: true,
				default: 0,
				description: 'The Farcaster ID to monitor',
				displayOptions: {
					show: {
						triggerType: ['newCastByUser', 'newFollower', 'newMention', 'newReply'],
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
				description: 'The channel ID to monitor',
				displayOptions: {
					show: {
						triggerType: ['newCastInChannel'],
					},
				},
			},
			// Cast hash for threshold
			{
				displayName: 'Cast Hash',
				name: 'castHash',
				type: 'string',
				required: true,
				default: '',
				description: 'The cast hash to monitor',
				displayOptions: {
					show: {
						triggerType: ['castReachedThreshold'],
					},
				},
			},
			// Threshold settings
			{
				displayName: 'Threshold Type',
				name: 'thresholdType',
				type: 'options',
				options: [
					{ name: 'Likes', value: 'likes' },
					{ name: 'Recasts', value: 'recasts' },
					{ name: 'Replies', value: 'replies' },
				],
				default: 'likes',
				displayOptions: {
					show: {
						triggerType: ['castReachedThreshold'],
					},
				},
			},
			{
				displayName: 'Threshold Value',
				name: 'thresholdValue',
				type: 'number',
				default: 100,
				description: 'Trigger when count reaches this value',
				displayOptions: {
					show: {
						triggerType: ['castReachedThreshold'],
					},
				},
			},
			// Frame URL
			{
				displayName: 'Frame URL',
				name: 'frameUrl',
				type: 'string',
				required: true,
				default: '',
				description: 'The frame URL to monitor',
				displayOptions: {
					show: {
						triggerType: ['frameInteraction'],
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
				options: [
					{
						displayName: 'Include Cast Details',
						name: 'includeCastDetails',
						type: 'boolean',
						default: true,
						description: 'Whether to include full cast data',
					},
					{
						displayName: 'Include User Details',
						name: 'includeUserDetails',
						type: 'boolean',
						default: true,
						description: 'Whether to include user profile data',
					},
				],
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const triggerType = this.getNodeParameter('triggerType') as string;
		const webhookData = this.getWorkflowStaticData('node');
		
		// Get credentials inline
		const credentials = await this.getCredentials('farcasterApi') as FarcasterCredentials;
		const hubEndpoint = credentials.hubEndpoint || 'https://hub.pinata.cloud/v1/';
		const useNeynar = credentials.useNeynar || false;
		const neynarApiKey = credentials.neynarApiKey;
		
		// Helper function for Hub API requests
		const hubRequest = async (endpoint: string, params: IDataObject = {}): Promise<IDataObject> => {
			const url = new URL(endpoint, hubEndpoint);
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, String(value));
				}
			});
			
			const response = await this.helpers.request({
				method: 'GET',
				url: url.toString(),
				json: true,
			});
			return response as IDataObject;
		};
		
		// Helper function for Neynar API requests
		const neynarRequest = async (endpoint: string, params: IDataObject = {}): Promise<IDataObject> => {
			const url = new URL(endpoint, 'https://api.neynar.com/v2/');
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, String(value));
				}
			});
			
			const response = await this.helpers.request({
				method: 'GET',
				url: url.toString(),
				headers: {
					'accept': 'application/json',
					'api_key': neynarApiKey || '',
				},
				json: true,
			});
			return response as IDataObject;
		};
		
		let responseData: IDataObject[] = [];

		try {
			switch (triggerType) {
				case 'newCastByUser': {
					const fid = this.getNodeParameter('fid') as number;
					const lastTimestamp = webhookData.lastTimestamp as number || 0;
					
					let casts: IDataObject[];
					if (useNeynar && neynarApiKey) {
						const response = await neynarRequest('farcaster/feed/user/casts', {
							fid,
							limit: 25,
						});
						casts = (response.casts as IDataObject[]) || [];
					} else {
						const response = await hubRequest('castsByFid', {
							fid,
							pageSize: 25,
						});
						casts = (response.messages as IDataObject[]) || [];
					}
					
					// Filter new casts
					const newCasts = casts.filter((cast: IDataObject) => {
						const castData = cast.data as IDataObject | undefined;
						const timestamp = (cast.timestamp as number) || (castData?.timestamp as number) || 0;
						return timestamp > lastTimestamp;
					});
					
					if (newCasts.length > 0) {
						const maxTimestamp = Math.max(...newCasts.map((c: IDataObject) => {
							const cData = c.data as IDataObject | undefined;
							return (c.timestamp as number) || (cData?.timestamp as number) || 0;
						}));
						webhookData.lastTimestamp = maxTimestamp;
						responseData = newCasts;
					}
					break;
				}

				case 'newCastInChannel': {
					const channelId = this.getNodeParameter('channelId') as string;
					const lastTimestamp = webhookData.lastTimestamp as number || 0;
					
					let casts: IDataObject[];
					if (useNeynar && neynarApiKey) {
						const response = await neynarRequest('farcaster/feed/channel', {
							channel_id: channelId,
							limit: 25,
						});
						casts = (response.casts as IDataObject[]) || [];
					} else {
						const parentUrl = `https://warpcast.com/~/channel/${channelId}`;
						const response = await hubRequest('castsByParent', {
							url: parentUrl,
							pageSize: 25,
						});
						casts = (response.messages as IDataObject[]) || [];
					}
					
					const newCasts = casts.filter((cast: IDataObject) => {
						const castData = cast.data as IDataObject | undefined;
						const timestamp = (cast.timestamp as number) || (castData?.timestamp as number) || 0;
						return timestamp > lastTimestamp;
					});
					
					if (newCasts.length > 0) {
						const maxTimestamp = Math.max(...newCasts.map((c: IDataObject) => {
							const cData = c.data as IDataObject | undefined;
							return (c.timestamp as number) || (cData?.timestamp as number) || 0;
						}));
						webhookData.lastTimestamp = maxTimestamp;
						responseData = newCasts;
					}
					break;
				}

				case 'newFollower': {
					const fid = this.getNodeParameter('fid') as number;
					
					let followers: IDataObject[];
					if (useNeynar && neynarApiKey) {
						const response = await neynarRequest('farcaster/followers', {
							fid,
							limit: 25,
						});
						followers = (response.users as IDataObject[]) || [];
					} else {
						const response = await hubRequest('linksByTargetFid', {
							target_fid: fid,
							link_type: 'follow',
							pageSize: 25,
						});
						followers = (response.messages as IDataObject[]) || [];
					}
					
					// Get new followers (those not seen before)
					const seenFids = (webhookData.seenFollowerFids as number[]) || [];
					const newFollowers = followers.filter((f: IDataObject) => {
						const fData = f.data as IDataObject | undefined;
						const followerFid = (f.fid as number) || (fData?.fid as number);
						return followerFid && !seenFids.includes(followerFid);
					});
					
					if (newFollowers.length > 0) {
						const newFids = newFollowers.map((f: IDataObject) => {
							const fData = f.data as IDataObject | undefined;
							return (f.fid as number) || (fData?.fid as number);
						}).filter((fid): fid is number => fid !== undefined && fid !== null);
						webhookData.seenFollowerFids = [...seenFids, ...newFids].slice(-1000); // Keep last 1000
						responseData = newFollowers;
					}
					break;
				}

				case 'newMention': {
					const fid = this.getNodeParameter('fid') as number;
					const lastTimestamp = webhookData.lastMentionTimestamp as number || 0;
					
					if (useNeynar && neynarApiKey) {
						const response = await neynarRequest('farcaster/notifications', {
							fid,
							type: 'mention',
							limit: 25,
						});
						const mentions = (response.notifications as IDataObject[]) || [];
						
						const newMentions = mentions.filter((m: IDataObject) => {
							const timestamp = (m.timestamp as number) || 0;
							return timestamp > lastTimestamp;
						});
						
						if (newMentions.length > 0) {
							const maxTimestamp = Math.max(...newMentions.map((m: IDataObject) => (m.timestamp as number) || 0));
							webhookData.lastMentionTimestamp = maxTimestamp;
							responseData = newMentions;
						}
					} else {
						// Hub doesn't have mentions endpoint - would need to scan casts
						responseData = [];
					}
					break;
				}

				case 'newReply': {
					const fid = this.getNodeParameter('fid') as number;
					const lastTimestamp = webhookData.lastReplyTimestamp as number || 0;
					
					if (useNeynar && neynarApiKey) {
						const response = await neynarRequest('farcaster/notifications', {
							fid,
							type: 'reply',
							limit: 25,
						});
						const replies = (response.notifications as IDataObject[]) || [];
						
						const newReplies = replies.filter((r: IDataObject) => {
							const timestamp = (r.timestamp as number) || 0;
							return timestamp > lastTimestamp;
						});
						
						if (newReplies.length > 0) {
							const maxTimestamp = Math.max(...newReplies.map((r: IDataObject) => (r.timestamp as number) || 0));
							webhookData.lastReplyTimestamp = maxTimestamp;
							responseData = newReplies;
						}
					} else {
						responseData = [];
					}
					break;
				}

				case 'castReachedThreshold': {
					const castHash = this.getNodeParameter('castHash') as string;
					const thresholdType = this.getNodeParameter('thresholdType') as string;
					const thresholdValue = this.getNodeParameter('thresholdValue') as number;
					const triggered = webhookData.thresholdTriggered as boolean || false;
					
					if (!triggered) {
						if (useNeynar && neynarApiKey) {
							const response = await neynarRequest('farcaster/cast', {
								identifier: castHash,
								type: 'hash',
							});
							const cast = response.cast as IDataObject;
							const reactions = (cast.reactions as IDataObject) || {};
							const replies = cast.replies as IDataObject | undefined;
							
							let currentCount = 0;
							if (thresholdType === 'likes') {
								currentCount = (reactions.likes_count as number) || 0;
							} else if (thresholdType === 'recasts') {
								currentCount = (reactions.recasts_count as number) || 0;
							} else if (thresholdType === 'replies') {
								currentCount = (replies?.count as number) || 0;
							}
							
							if (currentCount >= thresholdValue) {
								webhookData.thresholdTriggered = true;
								responseData = [{
									castHash,
									thresholdType,
									thresholdValue,
									currentCount,
									cast,
								}];
							}
						}
					}
					break;
				}

				case 'frameInteraction': {
					const frameUrl = this.getNodeParameter('frameUrl') as string;
					const lastTimestamp = webhookData.lastFrameTimestamp as number || 0;
					
					if (useNeynar && neynarApiKey) {
						const response = await neynarRequest('farcaster/frame/actions', {
							url: frameUrl,
							limit: 25,
						});
						const actions = (response.actions as IDataObject[]) || [];
						
						const newActions = actions.filter((a: IDataObject) => {
							const timestamp = (a.timestamp as number) || 0;
							return timestamp > lastTimestamp;
						});
						
						if (newActions.length > 0) {
							const maxTimestamp = Math.max(...newActions.map((a: IDataObject) => (a.timestamp as number) || 0));
							webhookData.lastFrameTimestamp = maxTimestamp;
							responseData = newActions;
						}
					} else {
						responseData = [];
					}
					break;
				}

				case 'channelCreated': {
					const lastTimestamp = webhookData.lastChannelTimestamp as number || 0;
					
					if (useNeynar && neynarApiKey) {
						const response = await neynarRequest('farcaster/channel/list', {
							limit: 25,
						});
						const channels = (response.channels as IDataObject[]) || [];
						
						const newChannels = channels.filter((c: IDataObject) => {
							const createdAt = (c.created_at as number) || 0;
							return createdAt > lastTimestamp;
						});
						
						if (newChannels.length > 0) {
							const maxTimestamp = Math.max(...newChannels.map((c: IDataObject) => (c.created_at as number) || 0));
							webhookData.lastChannelTimestamp = maxTimestamp;
							responseData = newChannels;
						}
					} else {
						responseData = [];
					}
					break;
				}

				default:
					throw new Error(`Unknown trigger type: ${triggerType}`);
			}
		} catch (error) {
			throw new Error(`Farcaster Trigger Error: ${(error as Error).message}`);
		}

		if (responseData.length === 0) {
			return null;
		}

		return [responseData.map(item => ({ json: item }))];
	}
}
