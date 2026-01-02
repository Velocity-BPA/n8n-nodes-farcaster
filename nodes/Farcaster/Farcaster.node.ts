/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

// Import operations and fields from all resources
import { usersOperations, usersFields, executeUsersOperation } from './actions/users/users';
import { castsOperations, castsFields, executeCastsOperation } from './actions/casts/casts';
import { reactionsOperations, reactionsFields, executeReactionsOperation } from './actions/reactions/reactions';
import { followsOperations, followsFields, executeFollowsOperation } from './actions/follows/follows';
import { channelsOperations, channelsFields, executeChannelsOperation } from './actions/channels/channels';
import { framesOperations, framesFields, executeFramesOperation } from './actions/frames/frames';
import { notificationsOperations, notificationsFields, executeNotificationsOperation } from './actions/notifications/notifications';
import { feedOperations, feedFields, executeFeedOperation } from './actions/feed/feed';
import { storageOperations, storageFields, executeStorageOperation } from './actions/storage/storage';
import { identityOperations, identityFields, executeIdentityOperation } from './actions/identity/identity';
import { eventsOperations, eventsFields, executeEventsOperation } from './actions/events/events';
import { siwfOperations, siwfFields, executeSiwfOperation } from './actions/siwf/siwf';
import { utilityOperations, utilityFields, executeUtilityOperation } from './actions/utility/utility';

// Emit licensing notice once on load
const LICENSING_NOTICE_LOGGED = Symbol.for('farcaster.licensing.logged');
if (!(globalThis as Record<symbol, boolean>)[LICENSING_NOTICE_LOGGED]) {
	console.warn(`[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`);
	(globalThis as Record<symbol, boolean>)[LICENSING_NOTICE_LOGGED] = true;
}

export class Farcaster implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Farcaster',
		name: 'farcaster',
		icon: 'file:farcaster.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Farcaster decentralized social network',
		defaults: {
			name: 'Farcaster',
		},
		inputs: ['main'] as const,
		outputs: ['main'] as const,
		credentials: [
			{
				name: 'farcasterApi',
				required: true,
			},
		],
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Cast',
						value: 'cast',
						description: 'Work with casts (posts)',
					},
					{
						name: 'Channel',
						value: 'channel',
						description: 'Manage channels',
					},
					{
						name: 'Events',
						value: 'events',
						description: 'Subscribe to events and hub status',
					},
					{
						name: 'Feed',
						value: 'feed',
						description: 'Get various feeds',
					},
					{
						name: 'Follow',
						value: 'follow',
						description: 'Manage follows',
					},
					{
						name: 'Frame',
						value: 'frame',
						description: 'Work with Farcaster Frames',
					},
					{
						name: 'Identity',
						value: 'identity',
						description: 'Manage on-chain identity',
					},
					{
						name: 'Notification',
						value: 'notification',
						description: 'Get notifications',
					},
					{
						name: 'Reaction',
						value: 'reaction',
						description: 'Manage reactions (likes/recasts)',
					},
					{
						name: 'SIWF',
						value: 'siwf',
						description: 'Sign In with Farcaster',
					},
					{
						name: 'Storage',
						value: 'storage',
						description: 'Manage storage units',
					},
					{
						name: 'User',
						value: 'user',
						description: 'Get user information',
					},
					{
						name: 'Utility',
						value: 'utility',
						description: 'Utility operations',
					},
				],
				default: 'user',
			},
			// Operations and fields for each resource
			...usersOperations,
			...usersFields,
			...castsOperations,
			...castsFields,
			...reactionsOperations,
			...reactionsFields,
			...followsOperations,
			...followsFields,
			...channelsOperations,
			...channelsFields,
			...framesOperations,
			...framesFields,
			...notificationsOperations,
			...notificationsFields,
			...feedOperations,
			...feedFields,
			...storageOperations,
			...storageFields,
			...identityOperations,
			...identityFields,
			...eventsOperations,
			...eventsFields,
			...siwfOperations,
			...siwfFields,
			...utilityOperations,
			...utilityFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: INodeExecutionData[];

				switch (resource) {
					case 'user':
						result = await executeUsersOperation.call(this, operation, i);
						break;
					case 'cast':
						result = await executeCastsOperation.call(this, operation, i);
						break;
					case 'reaction':
						result = await executeReactionsOperation.call(this, operation, i);
						break;
					case 'follow':
						result = await executeFollowsOperation.call(this, operation, i);
						break;
					case 'channel':
						result = await executeChannelsOperation.call(this, operation, i);
						break;
					case 'frame':
						result = await executeFramesOperation.call(this, operation, i);
						break;
					case 'notification':
						result = await executeNotificationsOperation.call(this, operation, i);
						break;
					case 'feed':
						result = await executeFeedOperation.call(this, operation, i);
						break;
					case 'storage':
						result = await executeStorageOperation.call(this, operation, i);
						break;
					case 'identity':
						result = await executeIdentityOperation.call(this, operation, i);
						break;
					case 'events':
						result = await executeEventsOperation.call(this, operation, i);
						break;
					case 'siwf':
						result = await executeSiwfOperation.call(this, operation, i);
						break;
					case 'utility':
						result = await executeUtilityOperation.call(this, operation, i);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
