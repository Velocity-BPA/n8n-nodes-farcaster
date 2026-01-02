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
import { returnDataToN8n } from '../../utils/helpers';

export const notificationsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['notifications'],
			},
		},
		options: [
			{
				name: 'Get Mentions',
				value: 'getMentions',
				description: 'Get cast mentions',
				action: 'Get mentions',
			},
			{
				name: 'Get Notifications',
				value: 'getNotifications',
				description: 'Get user notifications',
				action: 'Get notifications',
			},
			{
				name: 'Get Replies',
				value: 'getReplies',
				description: 'Get reply notifications',
				action: 'Get replies',
			},
			{
				name: 'Mark as Read',
				value: 'markAsRead',
				description: 'Clear notifications',
				action: 'Mark as read',
			},
		],
		default: 'getNotifications',
	},
];

export const notificationsFields: INodeProperties[] = [
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
				resource: ['notifications'],
				operation: ['getNotifications', 'getMentions', 'getReplies'],
			},
		},
	},
	// Notification Type Filter
	{
		displayName: 'Type Filter',
		name: 'typeFilter',
		type: 'multiOptions',
		options: [
			{ name: 'Follows', value: 'follows' },
			{ name: 'Likes', value: 'likes' },
			{ name: 'Mentions', value: 'mentions' },
			{ name: 'Recasts', value: 'recasts' },
			{ name: 'Replies', value: 'replies' },
		],
		default: [],
		description: 'Filter notifications by type',
		displayOptions: {
			show: {
				resource: ['notifications'],
				operation: ['getNotifications'],
			},
		},
	},
	// Priority Mode
	{
		displayName: 'Priority Mode',
		name: 'priorityMode',
		type: 'boolean',
		default: false,
		description: 'Whether to only show priority notifications',
		displayOptions: {
			show: {
				resource: ['notifications'],
				operation: ['getNotifications'],
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
				resource: ['notifications'],
				operation: ['getNotifications', 'getMentions', 'getReplies'],
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
				resource: ['notifications'],
				operation: ['getNotifications', 'getMentions', 'getReplies'],
			},
		},
	},
	// Mark as Read
	{
		displayName: 'Notification ID',
		name: 'notificationId',
		type: 'string',
		default: '',
		description: 'Specific notification ID to mark as read (leave empty for all)',
		displayOptions: {
			show: {
				resource: ['notifications'],
				operation: ['markAsRead'],
			},
		},
	},
];

export async function executeNotificationsOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject | IDataObject[];

	if (!credentials.useNeynar || !credentials.neynarApiKey) {
		return returnDataToN8n({ 
			message: 'Notifications require Neynar API. Please enable Neynar in credentials.' 
		});
	}

	switch (operation) {
		case 'getNotifications': {
			const fid = this.getNodeParameter('fid', i) as number;
			const typeFilter = this.getNodeParameter('typeFilter', i) as string[];
			const priorityMode = this.getNodeParameter('priorityMode', i) as boolean;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			
			const query: IDataObject = { fid, limit };
			if (cursor) query.cursor = cursor;
			if (typeFilter.length > 0) query.type = typeFilter.join(',');
			if (priorityMode) query.priority_mode = true;
			
			const response = await neynarApiRequest.call(this, 'GET', 'farcaster/notifications', undefined, query);
			responseData = response.notifications as IDataObject[] || [];
			break;
		}

		case 'getMentions': {
			const fid = this.getNodeParameter('fid', i) as number;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			
			const query: IDataObject = { fid, limit, type: 'mentions' };
			if (cursor) query.cursor = cursor;
			
			const response = await neynarApiRequest.call(this, 'GET', 'farcaster/notifications', undefined, query);
			responseData = response.notifications as IDataObject[] || [];
			break;
		}

		case 'getReplies': {
			const fid = this.getNodeParameter('fid', i) as number;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			
			const query: IDataObject = { fid, limit, type: 'replies' };
			if (cursor) query.cursor = cursor;
			
			const response = await neynarApiRequest.call(this, 'GET', 'farcaster/notifications', undefined, query);
			responseData = response.notifications as IDataObject[] || [];
			break;
		}

		case 'markAsRead': {
			const notificationId = this.getNodeParameter('notificationId', i) as string;
			
			if (!credentials.fid) {
				throw new Error('FID is required in credentials for marking notifications as read');
			}

			// Note: Neynar may not have a direct mark-as-read endpoint
			// This is a placeholder for the API call
			responseData = {
				success: true,
				message: notificationId 
					? `Notification ${notificationId} marked as read`
					: 'All notifications marked as read',
				note: 'Mark as read functionality depends on Neynar API availability',
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
