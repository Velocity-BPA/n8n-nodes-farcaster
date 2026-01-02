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

export const utilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Get API Health',
				value: 'getAPIHealth',
				description: 'Check service status',
				action: 'Get API health',
			},
			{
				name: 'Get FID by Username',
				value: 'getFIDByUsername',
				description: 'Resolve handle to FID',
				action: 'Get FID by username',
			},
			{
				name: 'Get Username by FID',
				value: 'getUsernameByFID',
				description: 'Reverse lookup FID to username',
				action: 'Get username by FID',
			},
			{
				name: 'Validate Message',
				value: 'validateMessage',
				description: 'Verify message signature',
				action: 'Validate message',
			},
		],
		default: 'getAPIHealth',
	},
];

export const utilityFields: INodeProperties[] = [
	// Username for FID lookup
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'vitalik',
		description: 'The Farcaster username (without @)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getFIDByUsername'],
			},
		},
	},
	// FID for username lookup
	{
		displayName: 'FID',
		name: 'fid',
		type: 'number',
		required: true,
		default: 0,
		description: 'The Farcaster ID',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getUsernameByFID'],
			},
		},
	},
	// Message bytes for validation
	{
		displayName: 'Message Bytes',
		name: 'messageBytes',
		type: 'string',
		required: true,
		default: '',
		description: 'The message bytes to validate (hex encoded)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateMessage'],
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
				resource: ['utility'],
			},
		},
		options: [
			{
				displayName: 'Include DB Stats',
				name: 'includeDbStats',
				type: 'boolean',
				default: false,
				description: 'Whether to include database statistics in health check',
			},
		],
	},
];

export async function executeUtilityOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject;

	switch (operation) {
		case 'getFIDByUsername': {
			const username = this.getNodeParameter('username', i) as string;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user/by_username', undefined, {
					username,
				});
				const user = response.user as IDataObject;
				responseData = {
					username,
					fid: user?.fid,
					user,
				};
			} else {
				// Hub API - lookup by username
				const response = await hubApiRequest.call(this, 'GET', 'userNameProofByName', undefined, {
					name: username,
				});
				responseData = {
					username,
					fid: (response as IDataObject).fid,
					proof: response,
				};
			}
			break;
		}

		case 'getUsernameByFID': {
			const fid = this.getNodeParameter('fid', i) as number;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user', undefined, {
					fid,
				});
				const user = response.user as IDataObject;
				responseData = {
					fid,
					username: user?.username,
					user,
				};
			} else {
				// Hub API - get user data
				const response = await hubApiRequest.call(this, 'GET', 'userDataByFid', undefined, {
					fid,
					user_data_type: 6, // USERNAME type
				});
				const responseDataObj = response.data as IDataObject | undefined;
				const userDataBody = responseDataObj?.userDataBody as IDataObject | undefined;
				responseData = {
					fid,
					username: userDataBody?.value,
					data: response,
				};
			}
			break;
		}

		case 'validateMessage': {
			const messageBytes = this.getNodeParameter('messageBytes', i) as string;
			
			// Validate using Hub API
			const response = await hubApiRequest.call(this, 'POST', 'validateMessage', {
				messageBytes,
			});
			
			responseData = {
				valid: (response as IDataObject).valid || false,
				message: (response as IDataObject).message,
			};
			break;
		}

		case 'getAPIHealth': {
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			const healthData: IDataObject = {
				timestamp: new Date().toISOString(),
			};
			
			// Check Hub health
			try {
				const hubResponse = await hubApiRequest.call(this, 'GET', 'info', undefined, {
					...(options.includeDbStats && { dbStats: '1' }),
				});
				healthData.hub = {
					status: 'healthy',
					...hubResponse as IDataObject,
				};
			} catch (error) {
				healthData.hub = {
					status: 'unhealthy',
					error: (error as Error).message,
				};
			}
			
			// Check Neynar health if configured
			if (credentials.useNeynar && credentials.neynarApiKey) {
				try {
					const neynarResponse = await neynarApiRequest.call(this, 'GET', 'health');
					healthData.neynar = {
						status: 'healthy',
						...neynarResponse as IDataObject,
					};
				} catch (error) {
					healthData.neynar = {
						status: 'unhealthy',
						error: (error as Error).message,
					};
				}
			}
			
			responseData = healthData;
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
