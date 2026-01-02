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
import { createSignedLinkAdd, createSignedLinkRemove } from '../../utils/signing';
import { returnDataToN8n } from '../../utils/helpers';

export const followsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['follows'],
			},
		},
		options: [
			{
				name: 'Check Follow Status',
				value: 'checkFollowStatus',
				description: 'Check if user A follows user B',
				action: 'Check follow status',
			},
			{
				name: 'Follow User',
				value: 'followUser',
				description: 'Follow a user (requires signer)',
				action: 'Follow user',
			},
			{
				name: 'Get Followers',
				value: 'getFollowers',
				description: "Get user's followers with pagination",
				action: 'Get followers',
			},
			{
				name: 'Get Following',
				value: 'getFollowing',
				description: 'Get accounts user follows',
				action: 'Get following',
			},
			{
				name: 'Get Mutual Follows',
				value: 'getMutualFollows',
				description: 'Get mutual connections between two users',
				action: 'Get mutual follows',
			},
			{
				name: 'Unfollow User',
				value: 'unfollowUser',
				description: 'Unfollow user (requires signer)',
				action: 'Unfollow user',
			},
		],
		default: 'getFollowers',
	},
];

export const followsFields: INodeProperties[] = [
	// FID
	{
		displayName: 'FID',
		name: 'fid',
		type: 'number',
		required: true,
		default: 0,
		description: 'The Farcaster ID of the user',
		displayOptions: {
			show: {
				resource: ['follows'],
				operation: ['getFollowers', 'getFollowing'],
			},
		},
	},
	// Target FID for follow/unfollow
	{
		displayName: 'Target FID',
		name: 'targetFid',
		type: 'number',
		required: true,
		default: 0,
		description: 'FID of the user to follow/unfollow',
		displayOptions: {
			show: {
				resource: ['follows'],
				operation: ['followUser', 'unfollowUser'],
			},
		},
	},
	// Check Follow Status
	{
		displayName: 'Source FID',
		name: 'sourceFid',
		type: 'number',
		required: true,
		default: 0,
		description: 'FID of the potential follower',
		displayOptions: {
			show: {
				resource: ['follows'],
				operation: ['checkFollowStatus'],
			},
		},
	},
	{
		displayName: 'Target FID',
		name: 'targetFid',
		type: 'number',
		required: true,
		default: 0,
		description: 'FID of the user being followed',
		displayOptions: {
			show: {
				resource: ['follows'],
				operation: ['checkFollowStatus'],
			},
		},
	},
	// Mutual Follows
	{
		displayName: 'FID 1',
		name: 'fid1',
		type: 'number',
		required: true,
		default: 0,
		description: 'First user FID',
		displayOptions: {
			show: {
				resource: ['follows'],
				operation: ['getMutualFollows'],
			},
		},
	},
	{
		displayName: 'FID 2',
		name: 'fid2',
		type: 'number',
		required: true,
		default: 0,
		description: 'Second user FID',
		displayOptions: {
			show: {
				resource: ['follows'],
				operation: ['getMutualFollows'],
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
				resource: ['follows'],
				operation: ['getFollowers', 'getFollowing', 'getMutualFollows'],
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
				resource: ['follows'],
				operation: ['getFollowers', 'getFollowing', 'getMutualFollows'],
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
				resource: ['follows'],
				operation: ['getFollowers', 'getFollowing'],
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
				displayName: 'Sort Type',
				name: 'sortType',
				type: 'options',
				options: [
					{ name: 'Algorithmic', value: 'algorithmic' },
					{ name: 'Recent', value: 'desc_chron' },
				],
				default: 'desc_chron',
				description: 'How to sort the results',
			},
		],
	},
];

export async function executeFollowsOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'getFollowers': {
			const fid = this.getNodeParameter('fid', i) as number;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { fid, limit };
				if (cursor) query.cursor = cursor;
				if (options.viewerFid) query.viewer_fid = options.viewerFid;
				if (options.sortType) query.sort_type = options.sortType;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/followers', undefined, query);
				responseData = response.users as IDataObject[] || [];
			} else {
				const response = await hubApiRequest.call(this, 'GET', 'linksByTargetFid', undefined, {
					target_fid: fid,
					link_type: 'follow',
					pageSize: limit,
					...(cursor && { pageToken: cursor }),
				});
				responseData = response.messages as IDataObject[] || [];
			}
			break;
		}

		case 'getFollowing': {
			const fid = this.getNodeParameter('fid', i) as number;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { fid, limit };
				if (cursor) query.cursor = cursor;
				if (options.viewerFid) query.viewer_fid = options.viewerFid;
				if (options.sortType) query.sort_type = options.sortType;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/following', undefined, query);
				responseData = response.users as IDataObject[] || [];
			} else {
				const response = await hubApiRequest.call(this, 'GET', 'linksByFid', undefined, {
					fid,
					link_type: 'follow',
					pageSize: limit,
					...(cursor && { pageToken: cursor }),
				});
				responseData = response.messages as IDataObject[] || [];
			}
			break;
		}

		case 'followUser': {
			const targetFid = this.getNodeParameter('targetFid', i) as number;
			
			if (!credentials.signerPrivateKey) {
				throw new Error('Signer private key is required for following users');
			}
			if (!credentials.fid) {
				throw new Error('FID is required for following users');
			}

			const signedMessage = await createSignedLinkAdd(
				credentials.fid,
				targetFid,
				credentials.signerPrivateKey,
			);

			responseData = await submitMessage.call(this, signedMessage);
			break;
		}

		case 'unfollowUser': {
			const targetFid = this.getNodeParameter('targetFid', i) as number;
			
			if (!credentials.signerPrivateKey) {
				throw new Error('Signer private key is required for unfollowing users');
			}
			if (!credentials.fid) {
				throw new Error('FID is required for unfollowing users');
			}

			const signedMessage = await createSignedLinkRemove(
				credentials.fid,
				targetFid,
				credentials.signerPrivateKey,
			);

			responseData = await submitMessage.call(this, signedMessage);
			break;
		}

		case 'getMutualFollows': {
			const fid1 = this.getNodeParameter('fid1', i) as number;
			const fid2 = this.getNodeParameter('fid2', i) as number;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				// Get followers of both and find intersection
				const query: IDataObject = {
					target_fid: fid1,
					viewer_fid: fid2,
					limit,
				};
				if (cursor) query.cursor = cursor;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user/bulk', undefined, {
					fids: `${fid1},${fid2}`,
				});
				
				// This is a simplified response - Neynar doesn't have direct mutual follows endpoint
				const users = response.users as IDataObject[] || [];
				responseData = {
					user1: users[0] || {},
					user2: users[1] || {},
					mutualContext: 'Check viewer_context in user objects for follow status',
				};
			} else {
				// Check if fid1 follows fid2 and vice versa
				const [fid1FollowsFid2, fid2FollowsFid1] = await Promise.all([
					hubApiRequest.call(this, 'GET', 'linkById', undefined, {
						fid: fid1,
						target_fid: fid2,
						link_type: 'follow',
					}).catch(() => null),
					hubApiRequest.call(this, 'GET', 'linkById', undefined, {
						fid: fid2,
						target_fid: fid1,
						link_type: 'follow',
					}).catch(() => null),
				]);
				
				responseData = {
					fid1FollowsFid2: !!fid1FollowsFid2,
					fid2FollowsFid1: !!fid2FollowsFid1,
					isMutual: !!fid1FollowsFid2 && !!fid2FollowsFid1,
				};
			}
			break;
		}

		case 'checkFollowStatus': {
			const sourceFid = this.getNodeParameter('sourceFid', i) as number;
			const targetFid = this.getNodeParameter('targetFid', i) as number;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user/bulk', undefined, {
					fids: targetFid.toString(),
					viewer_fid: sourceFid,
				});
				
				const user = (response.users as IDataObject[])?.[0];
				const viewerContext = user?.viewer_context as IDataObject | undefined;
				
				responseData = {
					sourceFid,
					targetFid,
					isFollowing: viewerContext?.following || false,
					isFollowedBy: viewerContext?.followed_by || false,
				};
			} else {
				const link = await hubApiRequest.call(this, 'GET', 'linkById', undefined, {
					fid: sourceFid,
					target_fid: targetFid,
					link_type: 'follow',
				}).catch(() => null);
				
				responseData = {
					sourceFid,
					targetFid,
					isFollowing: !!link,
				};
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
