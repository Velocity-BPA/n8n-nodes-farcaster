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
import { createSignedCastAdd, createSignedCastRemove } from '../../utils/signing';
import { returnDataToN8n, extractCastHash, cleanEmbeds } from '../../utils/helpers';

export const castsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['casts'],
			},
		},
		options: [
			{
				name: 'Delete Cast',
				value: 'deleteCast',
				description: 'Remove a cast (requires signer)',
				action: 'Delete cast',
			},
			{
				name: 'Get Cast by Hash',
				value: 'getCastByHash',
				description: 'Get single cast by hash',
				action: 'Get cast by hash',
			},
			{
				name: 'Get Cast Reactions',
				value: 'getCastReactions',
				description: 'Get likes and recasts on cast',
				action: 'Get cast reactions',
			},
			{
				name: 'Get Cast Thread',
				value: 'getCastThread',
				description: 'Get full conversation thread',
				action: 'Get cast thread',
			},
			{
				name: 'Get Casts by FID',
				value: 'getCastsByFID',
				description: "Get user's casts with pagination",
				action: 'Get casts by FID',
			},
			{
				name: 'Get Trending Casts',
				value: 'getTrendingCasts',
				description: 'Get popular casts',
				action: 'Get trending casts',
			},
			{
				name: 'Post Cast',
				value: 'postCast',
				description: 'Create new cast (requires signer)',
				action: 'Post cast',
			},
			{
				name: 'Search Casts',
				value: 'searchCasts',
				description: 'Search casts by query',
				action: 'Search casts',
			},
		],
		default: 'getCastByHash',
	},
];

export const castsFields: INodeProperties[] = [
	// Cast Hash
	{
		displayName: 'Cast Hash',
		name: 'castHash',
		type: 'string',
		required: true,
		default: '',
		description: 'The hash of the cast (with or without 0x prefix)',
		displayOptions: {
			show: {
				resource: ['casts'],
				operation: ['getCastByHash', 'getCastThread', 'getCastReactions', 'deleteCast'],
			},
		},
	},
	// FID for getting casts
	{
		displayName: 'FID',
		name: 'fid',
		type: 'number',
		required: true,
		default: 0,
		description: 'The Farcaster ID of the user',
		displayOptions: {
			show: {
				resource: ['casts'],
				operation: ['getCastsByFID'],
			},
		},
	},
	// Cast Author FID (for operations that need it)
	{
		displayName: 'Author FID',
		name: 'authorFid',
		type: 'number',
		required: true,
		default: 0,
		description: 'FID of the cast author',
		displayOptions: {
			show: {
				resource: ['casts'],
				operation: ['getCastByHash', 'getCastThread', 'getCastReactions', 'deleteCast'],
			},
		},
	},
	// Post Cast fields
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
				resource: ['casts'],
				operation: ['postCast'],
			},
		},
	},
	{
		displayName: 'Parent Cast',
		name: 'parentCast',
		type: 'fixedCollection',
		default: {},
		description: 'Reply to an existing cast',
		displayOptions: {
			show: {
				resource: ['casts'],
				operation: ['postCast'],
			},
		},
		options: [
			{
				name: 'parent',
				displayName: 'Parent Cast',
				values: [
					{
						displayName: 'Parent FID',
						name: 'parentFid',
						type: 'number',
						default: 0,
						description: 'FID of the parent cast author',
					},
					{
						displayName: 'Parent Hash',
						name: 'parentHash',
						type: 'string',
						default: '',
						description: 'Hash of the parent cast',
					},
				],
			},
		],
	},
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		default: '',
		description: 'Post to a specific channel',
		displayOptions: {
			show: {
				resource: ['casts'],
				operation: ['postCast'],
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
				resource: ['casts'],
				operation: ['postCast'],
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
	// Search query
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		description: 'Search query for casts',
		displayOptions: {
			show: {
				resource: ['casts'],
				operation: ['searchCasts'],
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
				resource: ['casts'],
				operation: ['getCastsByFID', 'searchCasts', 'getTrendingCasts', 'getCastReactions'],
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
				resource: ['casts'],
				operation: ['getCastsByFID', 'searchCasts', 'getTrendingCasts'],
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
				resource: ['casts'],
				operation: ['getCastsByFID', 'searchCasts', 'getTrendingCasts'],
			},
		},
		options: [
			{
				displayName: 'Include Replies',
				name: 'includeReplies',
				type: 'boolean',
				default: true,
				description: 'Whether to include reply casts',
			},
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

export async function executeCastsOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'getCastByHash': {
			const castHash = extractCastHash(this.getNodeParameter('castHash', i) as string);
			const authorFid = this.getNodeParameter('authorFid', i) as number;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const identifier = `0x${castHash}`;
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/cast', undefined, {
					identifier,
					type: 'hash',
				});
				responseData = response.cast as IDataObject || response;
			} else {
				responseData = await hubApiRequest.call(this, 'GET', 'castById', undefined, {
					fid: authorFid,
					hash: castHash,
				});
			}
			break;
		}

		case 'getCastsByFID': {
			const fid = this.getNodeParameter('fid', i) as number;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { fid, limit };
				if (cursor) query.cursor = cursor;
				if (options.viewerFid) query.viewer_fid = options.viewerFid;
				if (options.includeReplies !== undefined) query.include_replies = options.includeReplies;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/feed/user/casts', undefined, query);
				responseData = response.casts as IDataObject[] || [];
			} else {
				const query: IDataObject = { fid, pageSize: limit };
				if (cursor) query.pageToken = cursor;
				
				const response = await hubApiRequest.call(this, 'GET', 'castsByFid', undefined, query);
				responseData = response.messages as IDataObject[] || [];
			}
			break;
		}

		case 'getCastThread': {
			const castHash = extractCastHash(this.getNodeParameter('castHash', i) as string);
			const authorFid = this.getNodeParameter('authorFid', i) as number;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const identifier = `0x${castHash}`;
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/cast/conversation', undefined, {
					identifier,
					type: 'hash',
					reply_depth: 2,
				});
				responseData = response.conversation as IDataObject || response;
			} else {
				// Get the cast and its replies
				const cast = await hubApiRequest.call(this, 'GET', 'castById', undefined, {
					fid: authorFid,
					hash: castHash,
				});
				responseData = { cast, replies: [] };
			}
			break;
		}

		case 'postCast': {
			const text = this.getNodeParameter('text', i) as string;
			const parentCast = this.getNodeParameter('parentCast', i) as IDataObject;
			const channelId = this.getNodeParameter('channelId', i) as string;
			const embedsInput = this.getNodeParameter('embeds', i) as IDataObject;
			
			if (!credentials.signerPrivateKey) {
				throw new Error('Signer private key is required for posting casts');
			}
			if (!credentials.fid) {
				throw new Error('FID is required for posting casts');
			}

			const options: {
				parentCastId?: { fid: number; hash: string };
				parentUrl?: string;
				embeds?: Array<{ url?: string; castId?: { fid: number; hash: string } }>;
			} = {};

			// Handle parent cast (reply)
			const parent = (parentCast.parent as IDataObject) || {};
			if (parent.parentFid && parent.parentHash) {
				options.parentCastId = {
					fid: parent.parentFid as number,
					hash: extractCastHash(parent.parentHash as string),
				};
			}

			// Handle channel
			if (channelId) {
				options.parentUrl = `https://warpcast.com/~/channel/${channelId}`;
			}

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

			// Create and sign the message
			const signedMessage = await createSignedCastAdd(
				credentials.fid,
				text,
				credentials.signerPrivateKey,
				options,
			);

			// Submit to Hub
			responseData = await submitMessage.call(this, signedMessage);
			break;
		}

		case 'deleteCast': {
			const castHash = extractCastHash(this.getNodeParameter('castHash', i) as string);
			
			if (!credentials.signerPrivateKey) {
				throw new Error('Signer private key is required for deleting casts');
			}
			if (!credentials.fid) {
				throw new Error('FID is required for deleting casts');
			}

			const signedMessage = await createSignedCastRemove(
				credentials.fid,
				castHash,
				credentials.signerPrivateKey,
			);

			responseData = await submitMessage.call(this, signedMessage);
			break;
		}

		case 'getTrendingCasts': {
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const query: IDataObject = { limit };
				if (cursor) query.cursor = cursor;
				if (options.viewerFid) query.viewer_fid = options.viewerFid;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/feed/trending', undefined, query);
				responseData = response.casts as IDataObject[] || [];
			} else {
				responseData = { message: 'Trending casts requires Neynar API' };
			}
			break;
		}

		case 'searchCasts': {
			const query = this.getNodeParameter('query', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const cursor = this.getNodeParameter('cursor', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const queryParams: IDataObject = { q: query, limit };
				if (cursor) queryParams.cursor = cursor;
				if (options.viewerFid) queryParams.viewer_fid = options.viewerFid;
				
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/cast/search', undefined, queryParams);
				const result = response.result as IDataObject | undefined;
				responseData = (result?.casts as IDataObject[]) || (response.casts as IDataObject[]) || [];
			} else {
				responseData = { message: 'Cast search requires Neynar API' };
			}
			break;
		}

		case 'getCastReactions': {
			const castHash = extractCastHash(this.getNodeParameter('castHash', i) as string);
			const authorFid = this.getNodeParameter('authorFid', i) as number;
			const limit = this.getNodeParameter('limit', i) as number;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const identifier = `0x${castHash}`;
				const [likes, recasts] = await Promise.all([
					neynarApiRequest.call(this, 'GET', 'farcaster/reactions/cast', undefined, {
						hash: identifier,
						types: 'likes',
						limit,
					}),
					neynarApiRequest.call(this, 'GET', 'farcaster/reactions/cast', undefined, {
						hash: identifier,
						types: 'recasts',
						limit,
					}),
				]);
				responseData = {
					likes: likes.reactions || [],
					recasts: recasts.reactions || [],
				};
			} else {
				const [likes, recasts] = await Promise.all([
					hubApiRequest.call(this, 'GET', 'reactionsByCast', undefined, {
						target_fid: authorFid,
						target_hash: castHash,
						reaction_type: 'REACTION_TYPE_LIKE',
					}),
					hubApiRequest.call(this, 'GET', 'reactionsByCast', undefined, {
						target_fid: authorFid,
						target_hash: castHash,
						reaction_type: 'REACTION_TYPE_RECAST',
					}),
				]);
				responseData = {
					likes: likes.messages || [],
					recasts: recasts.messages || [],
				};
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
