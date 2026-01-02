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

export const usersOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['users'],
			},
		},
		options: [
			{
				name: 'Bulk Get Users',
				value: 'bulkGetUsers',
				description: 'Get multiple users by FIDs',
				action: 'Bulk get users',
			},
			{
				name: 'Get User by Address',
				value: 'getUserByAddress',
				description: 'Find user by custody or verified wallet address',
				action: 'Get user by address',
			},
			{
				name: 'Get User by FID',
				value: 'getUserByFID',
				description: 'Get user details by Farcaster ID',
				action: 'Get user by FID',
			},
			{
				name: 'Get User by Username',
				value: 'getUserByUsername',
				description: 'Lookup user by handle',
				action: 'Get user by username',
			},
			{
				name: 'Get User Profile',
				value: 'getUserProfile',
				description: 'Get full profile with bio, pfp, etc.',
				action: 'Get user profile',
			},
			{
				name: 'Get User Stats',
				value: 'getUserStats',
				description: 'Get follower/following counts',
				action: 'Get user stats',
			},
			{
				name: 'Get Verified Addresses',
				value: 'getVerifiedAddresses',
				description: 'Get connected wallet addresses',
				action: 'Get verified addresses',
			},
			{
				name: 'Search Users',
				value: 'searchUsers',
				description: 'Search for users by query',
				action: 'Search users',
			},
		],
		default: 'getUserByFID',
	},
];

export const usersFields: INodeProperties[] = [
	// Get User by FID
	{
		displayName: 'FID',
		name: 'fid',
		type: 'number',
		required: true,
		default: 0,
		description: 'The Farcaster ID of the user',
		displayOptions: {
			show: {
				resource: ['users'],
				operation: ['getUserByFID', 'getUserProfile', 'getUserStats', 'getVerifiedAddresses'],
			},
		},
	},
	// Get User by Username
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		description: 'The username/handle to lookup',
		displayOptions: {
			show: {
				resource: ['users'],
				operation: ['getUserByUsername'],
			},
		},
	},
	// Get User by Address
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		default: '',
		description: 'Ethereum address (custody or verified)',
		displayOptions: {
			show: {
				resource: ['users'],
				operation: ['getUserByAddress'],
			},
		},
	},
	// Search Users
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		description: 'Search query for users',
		displayOptions: {
			show: {
				resource: ['users'],
				operation: ['searchUsers'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 25,
		description: 'Maximum number of results to return',
		displayOptions: {
			show: {
				resource: ['users'],
				operation: ['searchUsers'],
			},
		},
	},
	// Bulk Get Users
	{
		displayName: 'FIDs',
		name: 'fids',
		type: 'string',
		required: true,
		default: '',
		description: 'Comma-separated list of FIDs',
		displayOptions: {
			show: {
				resource: ['users'],
				operation: ['bulkGetUsers'],
			},
		},
	},
	// Additional Options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['users'],
			},
		},
		options: [
			{
				displayName: 'Include Viewer Context',
				name: 'viewerFid',
				type: 'number',
				default: 0,
				description: 'Include context for this viewer FID (following status, etc.)',
			},
		],
	},
];

export async function executeUsersOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'getUserByFID': {
			const fid = this.getNodeParameter('fid', i) as number;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { fids: fid.toString() };
				if (options.viewerFid) {
					query.viewer_fid = options.viewerFid;
				}
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user/bulk', undefined, query);
				responseData = (response.users as IDataObject[])?.[0] || response;
			} else {
				responseData = await hubApiRequest.call(this, 'GET', `userDataByFid`, undefined, { fid });
			}
			break;
		}

		case 'getUserByUsername': {
			const username = this.getNodeParameter('username', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { username };
				if (options.viewerFid) {
					query.viewer_fid = options.viewerFid;
				}
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user/by_username', undefined, query);
				responseData = response.user as IDataObject || response;
			} else {
				responseData = await hubApiRequest.call(this, 'GET', `userNameProofByName`, undefined, { name: username });
			}
			break;
		}

		case 'getUserByAddress': {
			const address = this.getNodeParameter('address', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { address };
				if (options.viewerFid) {
					query.viewer_fid = options.viewerFid;
				}
				responseData = await neynarApiRequest.call(this, 'GET', 'farcaster/user/by_verification', undefined, query);
			} else {
				responseData = await hubApiRequest.call(this, 'GET', `verificationsByFid`, undefined, { address });
			}
			break;
		}

		case 'searchUsers': {
			const query = this.getNodeParameter('query', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const queryParams: IDataObject = { q: query, limit };
				if (options.viewerFid) {
					queryParams.viewer_fid = options.viewerFid;
				}
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user/search', undefined, queryParams);
				const result = response.result as IDataObject | undefined;
				responseData = (result?.users as IDataObject[]) || (response.users as IDataObject[]) || [];
			} else {
				// Hub doesn't have direct search, return empty
				responseData = { message: 'User search requires Neynar API' };
			}
			break;
		}

		case 'getUserProfile': {
			const fid = this.getNodeParameter('fid', i) as number;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { fids: fid.toString() };
				if (options.viewerFid) {
					query.viewer_fid = options.viewerFid;
				}
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user/bulk', undefined, query);
				responseData = (response.users as IDataObject[])?.[0] || response;
			} else {
				// Get all user data types from Hub
				const userData = await hubApiRequest.call(this, 'GET', `userDataByFid`, undefined, { fid });
				responseData = userData;
			}
			break;
		}

		case 'getUserStats': {
			const fid = this.getNodeParameter('fid', i) as number;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user/bulk', undefined, { fids: fid.toString() });
				const user = (response.users as IDataObject[])?.[0];
				responseData = {
					fid,
					followerCount: user?.follower_count || 0,
					followingCount: user?.following_count || 0,
				};
			} else {
				// Get link counts from Hub
				const followers = await hubApiRequest.call(this, 'GET', `linksByTargetFid`, undefined, { target_fid: fid, link_type: 'follow' });
				const following = await hubApiRequest.call(this, 'GET', `linksByFid`, undefined, { fid, link_type: 'follow' });
				responseData = {
					fid,
					followerCount: (followers.messages as IDataObject[])?.length || 0,
					followingCount: (following.messages as IDataObject[])?.length || 0,
				};
			}
			break;
		}

		case 'getVerifiedAddresses': {
			const fid = this.getNodeParameter('fid', i) as number;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user/bulk', undefined, { fids: fid.toString() });
				const user = (response.users as IDataObject[])?.[0];
				responseData = {
					fid,
					verifications: user?.verifications || [],
					verified_addresses: user?.verified_addresses || {},
				};
			} else {
				responseData = await hubApiRequest.call(this, 'GET', `verificationsByFid`, undefined, { fid });
			}
			break;
		}

		case 'bulkGetUsers': {
			const fidsString = this.getNodeParameter('fids', i) as string;
			const fids = fidsString.split(',').map(f => f.trim()).filter(f => f);
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { fids: fids.join(',') };
				if (options.viewerFid) {
					query.viewer_fid = options.viewerFid;
				}
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user/bulk', undefined, query);
				responseData = response.users as IDataObject[] || [];
			} else {
				// Fetch each user individually from Hub
				const users: IDataObject[] = [];
				for (const fid of fids) {
					const userData = await hubApiRequest.call(this, 'GET', `userDataByFid`, undefined, { fid: parseInt(fid, 10) });
					users.push(userData);
				}
				responseData = users;
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
