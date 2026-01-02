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
import { createSignedReactionAdd, createSignedReactionRemove } from '../../utils/signing';
import { returnDataToN8n, extractCastHash } from '../../utils/helpers';

export const reactionsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['reactions'],
			},
		},
		options: [
			{
				name: 'Add Reaction',
				value: 'addReaction',
				description: 'Like or recast (requires signer)',
				action: 'Add reaction',
			},
			{
				name: 'Get Reaction Types',
				value: 'getReactionTypes',
				description: 'Get available reaction types',
				action: 'Get reaction types',
			},
			{
				name: 'Get Reactions by Cast',
				value: 'getReactionsByCast',
				description: 'Get all reactions on a cast',
				action: 'Get reactions by cast',
			},
			{
				name: 'Get Reactions by User',
				value: 'getReactionsByUser',
				description: "Get user's reactions",
				action: 'Get reactions by user',
			},
			{
				name: 'Remove Reaction',
				value: 'removeReaction',
				description: 'Remove like/recast (requires signer)',
				action: 'Remove reaction',
			},
		],
		default: 'getReactionsByCast',
	},
];

export const reactionsFields: INodeProperties[] = [
	// Reaction Type
	{
		displayName: 'Reaction Type',
		name: 'reactionType',
		type: 'options',
		options: [
			{ name: 'Like', value: 'like' },
			{ name: 'Recast', value: 'recast' },
		],
		required: true,
		default: 'like',
		displayOptions: {
			show: {
				resource: ['reactions'],
				operation: ['addReaction', 'removeReaction', 'getReactionsByCast', 'getReactionsByUser'],
			},
		},
	},
	// Target Cast Hash
	{
		displayName: 'Cast Hash',
		name: 'castHash',
		type: 'string',
		required: true,
		default: '',
		description: 'The hash of the target cast',
		displayOptions: {
			show: {
				resource: ['reactions'],
				operation: ['addReaction', 'removeReaction', 'getReactionsByCast'],
			},
		},
	},
	// Target Cast Author FID
	{
		displayName: 'Cast Author FID',
		name: 'castAuthorFid',
		type: 'number',
		required: true,
		default: 0,
		description: 'FID of the cast author',
		displayOptions: {
			show: {
				resource: ['reactions'],
				operation: ['addReaction', 'removeReaction', 'getReactionsByCast'],
			},
		},
	},
	// FID for user reactions
	{
		displayName: 'FID',
		name: 'fid',
		type: 'number',
		required: true,
		default: 0,
		description: 'The Farcaster ID of the user',
		displayOptions: {
			show: {
				resource: ['reactions'],
				operation: ['getReactionsByUser'],
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
				resource: ['reactions'],
				operation: ['getReactionsByCast', 'getReactionsByUser'],
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
				resource: ['reactions'],
				operation: ['getReactionsByCast', 'getReactionsByUser'],
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
				resource: ['reactions'],
				operation: ['getReactionsByCast', 'getReactionsByUser'],
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
		],
	},
];

export async function executeReactionsOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'getReactionsByCast': {
			const castHash = extractCastHash(this.getNodeParameter('castHash', i) as string);
			const castAuthorFid = this.getNodeParameter('castAuthorFid', i) as number;
			const reactionType = this.getNodeParameter('reactionType', i) as 'like' | 'recast';
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = {
					hash: `0x${castHash}`,
					types: reactionType === 'like' ? 'likes' : 'recasts',
					limit,
				};
				if (cursor) query.cursor = cursor;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/reactions/cast', undefined, query);
				responseData = response.reactions as IDataObject[] || [];
			} else {
				const response = await hubApiRequest.call(this, 'GET', 'reactionsByCast', undefined, {
					target_fid: castAuthorFid,
					target_hash: castHash,
					reaction_type: reactionType === 'like' ? 'REACTION_TYPE_LIKE' : 'REACTION_TYPE_RECAST',
					pageSize: limit,
					...(cursor && { pageToken: cursor }),
				});
				responseData = response.messages as IDataObject[] || [];
			}
			break;
		}

		case 'getReactionsByUser': {
			const fid = this.getNodeParameter('fid', i) as number;
			const reactionType = this.getNodeParameter('reactionType', i) as 'like' | 'recast';
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = {
					fid,
					type: reactionType === 'like' ? 'likes' : 'recasts',
					limit,
				};
				if (cursor) query.cursor = cursor;
				if (options.viewerFid) query.viewer_fid = options.viewerFid;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/reactions/user', undefined, query);
				responseData = response.reactions as IDataObject[] || [];
			} else {
				const response = await hubApiRequest.call(this, 'GET', 'reactionsByFid', undefined, {
					fid,
					reaction_type: reactionType === 'like' ? 'REACTION_TYPE_LIKE' : 'REACTION_TYPE_RECAST',
					pageSize: limit,
					...(cursor && { pageToken: cursor }),
				});
				responseData = response.messages as IDataObject[] || [];
			}
			break;
		}

		case 'addReaction': {
			const castHash = extractCastHash(this.getNodeParameter('castHash', i) as string);
			const castAuthorFid = this.getNodeParameter('castAuthorFid', i) as number;
			const reactionType = this.getNodeParameter('reactionType', i) as 'like' | 'recast';
			
			if (!credentials.signerPrivateKey) {
				throw new Error('Signer private key is required for adding reactions');
			}
			if (!credentials.fid) {
				throw new Error('FID is required for adding reactions');
			}

			const signedMessage = await createSignedReactionAdd(
				credentials.fid,
				reactionType,
				castAuthorFid,
				castHash,
				credentials.signerPrivateKey,
			);

			responseData = await submitMessage.call(this, signedMessage);
			break;
		}

		case 'removeReaction': {
			const castHash = extractCastHash(this.getNodeParameter('castHash', i) as string);
			const castAuthorFid = this.getNodeParameter('castAuthorFid', i) as number;
			const reactionType = this.getNodeParameter('reactionType', i) as 'like' | 'recast';
			
			if (!credentials.signerPrivateKey) {
				throw new Error('Signer private key is required for removing reactions');
			}
			if (!credentials.fid) {
				throw new Error('FID is required for removing reactions');
			}

			const signedMessage = await createSignedReactionRemove(
				credentials.fid,
				reactionType,
				castAuthorFid,
				castHash,
				credentials.signerPrivateKey,
			);

			responseData = await submitMessage.call(this, signedMessage);
			break;
		}

		case 'getReactionTypes': {
			responseData = {
				types: [
					{
						name: 'Like',
						value: 'like',
						hubValue: 'REACTION_TYPE_LIKE',
						description: 'Like a cast (similar to a heart or thumbs up)',
					},
					{
						name: 'Recast',
						value: 'recast',
						hubValue: 'REACTION_TYPE_RECAST',
						description: 'Recast/share a cast (similar to retweet)',
					},
				],
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
