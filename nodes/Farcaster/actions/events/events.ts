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

export const eventsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['events'],
			},
		},
		options: [
			{
				name: 'Get Events by FID',
				value: 'getEventsByFID',
				description: 'Get events for user',
				action: 'Get events by FID',
			},
			{
				name: 'Get Hub Info',
				value: 'getHubInfo',
				description: 'Get hub status information',
				action: 'Get hub info',
			},
			{
				name: 'Get Sync Status',
				value: 'getSyncStatus',
				description: 'Get hub sync state',
				action: 'Get sync status',
			},
			{
				name: 'Subscribe Events',
				value: 'subscribeEvents',
				description: 'Get real-time event stream URL',
				action: 'Subscribe to events',
			},
		],
		default: 'getHubInfo',
	},
];

export const eventsFields: INodeProperties[] = [
	// FID for event operations
	{
		displayName: 'FID',
		name: 'fid',
		type: 'number',
		required: true,
		default: 0,
		description: 'The Farcaster ID to get events for',
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['getEventsByFID'],
			},
		},
	},
	// Event type filter
	{
		displayName: 'Event Types',
		name: 'eventTypes',
		type: 'multiOptions',
		options: [
			{ name: 'All Events', value: 'all' },
			{ name: 'Cast Add', value: 'castAdd' },
			{ name: 'Cast Remove', value: 'castRemove' },
			{ name: 'Reaction Add', value: 'reactionAdd' },
			{ name: 'Reaction Remove', value: 'reactionRemove' },
			{ name: 'Link Add', value: 'linkAdd' },
			{ name: 'Link Remove', value: 'linkRemove' },
			{ name: 'Verification Add', value: 'verificationAdd' },
			{ name: 'Verification Remove', value: 'verificationRemove' },
			{ name: 'User Data Add', value: 'userDataAdd' },
		],
		default: ['all'],
		description: 'Types of events to subscribe to',
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['subscribeEvents', 'getEventsByFID'],
			},
		},
	},
	// From event ID
	{
		displayName: 'From Event ID',
		name: 'fromEventId',
		type: 'number',
		default: 0,
		description: 'Start from this event ID (0 for latest)',
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['getEventsByFID', 'subscribeEvents'],
			},
		},
	},
	// Peer ID for sync status
	{
		displayName: 'Peer ID',
		name: 'peerId',
		type: 'string',
		default: '',
		description: 'Optional peer ID to check sync status with',
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['getSyncStatus'],
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
				resource: ['events'],
			},
		},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description: 'Maximum number of events to return',
			},
			{
				displayName: 'Reverse',
				name: 'reverse',
				type: 'boolean',
				default: false,
				description: 'Whether to return events in reverse chronological order',
			},
		],
	},
];

export async function executeEventsOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'subscribeEvents': {
			const eventTypes = this.getNodeParameter('eventTypes', i) as string[];
			const fromEventId = this.getNodeParameter('fromEventId', i) as number;
			
			// Return the SSE endpoint URL for real-time events
			const baseUrl = credentials.hubEndpoint || 'https://hub.pinata.cloud/v1/';
			const eventTypesParam = eventTypes.includes('all') ? '' : `&event_types=${eventTypes.join(',')}`;
			
			responseData = {
				eventStreamUrl: `${baseUrl}events?from_event_id=${fromEventId}${eventTypesParam}`,
				note: 'Connect to this URL via Server-Sent Events (SSE) to receive real-time events',
				hubEndpoint: credentials.hubEndpoint,
			};
			break;
		}

		case 'getEventsByFID': {
			const fid = this.getNodeParameter('fid', i) as number;
			const eventTypes = this.getNodeParameter('eventTypes', i) as string[];
			const fromEventId = this.getNodeParameter('fromEventId', i) as number;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				// Neynar doesn't have a direct events endpoint, use activity
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user/activity', undefined, {
					fid,
					limit: options.limit || 100,
				});
				responseData = response as IDataObject;
			} else {
				// Hub API - get events by FID
				const query: IDataObject = {
					fid,
					...(fromEventId && { from_event_id: fromEventId }),
					...(options.reverse && { reverse: '1' }),
				};
				
				// If specific event types, we need to filter
				const response = await hubApiRequest.call(this, 'GET', 'eventsByFid', undefined, query);
				let events = response.events as IDataObject[] || [];
				
				// Filter by event type if specified
				if (!eventTypes.includes('all') && eventTypes.length > 0) {
					events = events.filter((event: IDataObject) => {
						const type = event.type as string;
						return eventTypes.some(t => type?.toLowerCase().includes(t.toLowerCase()));
					});
				}
				
				responseData = events;
			}
			break;
		}

		case 'getHubInfo': {
			const response = await hubApiRequest.call(this, 'GET', 'info', undefined, { dbStats: '1' });
			responseData = response as IDataObject;
			break;
		}

		case 'getSyncStatus': {
			const peerId = this.getNodeParameter('peerId', i) as string;
			
			const query: IDataObject = {};
			if (peerId) query.peerId = peerId;
			
			const response = await hubApiRequest.call(this, 'GET', 'syncStatus', undefined, query);
			responseData = response as IDataObject;
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
