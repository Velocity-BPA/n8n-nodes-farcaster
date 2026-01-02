/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

// User Types
export interface FarcasterUser {
	fid: number;
	username: string;
	displayName: string;
	pfp: {
		url: string;
		verified: boolean;
	};
	profile: {
		bio: {
			text: string;
			mentions: string[];
		};
		location?: {
			placeId?: string;
			description?: string;
		};
	};
	followerCount: number;
	followingCount: number;
	verifications: string[];
	verifiedAddresses: {
		ethAddresses: string[];
		solAddresses: string[];
	};
	activeStatus: 'active' | 'inactive';
	powerBadge: boolean;
	viewerContext?: {
		following: boolean;
		followedBy: boolean;
	};
}

export interface UserData {
	type: string;
	fid: number;
	timestamp: number;
	network: string;
	userDataBody: {
		type: string;
		value: string;
	};
}

// Cast Types
export interface Cast {
	hash: string;
	parentHash?: string;
	parentUrl?: string;
	rootParentUrl?: string;
	parentAuthor?: {
		fid: number;
	};
	author: FarcasterUser;
	text: string;
	timestamp: string;
	embeds: CastEmbed[];
	frames?: Frame[];
	reactions: {
		likes: ReactionUser[];
		recasts: ReactionUser[];
		likesCount: number;
		recastsCount: number;
	};
	replies: {
		count: number;
	};
	channel?: Channel;
	mentionedProfiles: FarcasterUser[];
	viewerContext?: {
		liked: boolean;
		recasted: boolean;
	};
}

export interface CastEmbed {
	url?: string;
	castId?: {
		fid: number;
		hash: string;
	};
}

export interface ReactionUser {
	fid: number;
	fname: string;
}

export interface CastAdd {
	type: string;
	fid: number;
	timestamp: number;
	network: string;
	castAddBody: {
		embedsDeprecated: string[];
		mentions: number[];
		parentCastId?: {
			fid: number;
			hash: string;
		};
		parentUrl?: string;
		text: string;
		mentionsPositions: number[];
		embeds: CastEmbed[];
	};
}

// Reaction Types
export interface Reaction {
	type: 'like' | 'recast';
	hash: string;
	reactor: FarcasterUser;
	timestamp: string;
	cast: Cast;
	castHash: string;
}

export interface ReactionBody {
	type: string;
	fid: number;
	timestamp: number;
	network: string;
	reactionBody: {
		type: 'REACTION_TYPE_LIKE' | 'REACTION_TYPE_RECAST';
		targetCastId: {
			fid: number;
			hash: string;
		};
	};
}

// Follow Types
export interface Follow {
	follower: FarcasterUser;
	following: FarcasterUser;
	timestamp: string;
}

export interface Link {
	type: string;
	fid: number;
	timestamp: number;
	network: string;
	linkBody: {
		type: string;
		targetFid: number;
	};
}

// Channel Types
export interface Channel {
	id: string;
	url: string;
	name: string;
	description: string;
	imageUrl: string;
	headerImageUrl?: string;
	leadFid: number;
	lead?: FarcasterUser;
	hostFids?: number[];
	moderatorFids?: number[];
	createdAt: number;
	followerCount: number;
	object: 'channel';
	parentUrl: string;
	viewerContext?: {
		following: boolean;
		role?: string;
	};
}

// Frame Types
export interface Frame {
	version: string;
	title: string;
	image: string;
	imageAspectRatio?: '1.91:1' | '1:1';
	buttons: FrameButton[];
	inputText?: string;
	state?: string;
	postUrl?: string;
	framesUrl?: string;
}

export interface FrameButton {
	index: number;
	title: string;
	actionType: 'post' | 'post_redirect' | 'link' | 'mint' | 'tx';
	target?: string;
}

export interface FrameAction {
	fid: number;
	url: string;
	messageHash: string;
	timestamp: string;
	network: number;
	buttonIndex: number;
	inputText?: string;
	state?: string;
	castId: {
		fid: number;
		hash: string;
	};
	interactor: FarcasterUser;
	transaction?: {
		hash: string;
	};
}

export interface FrameValidationResult {
	valid: boolean;
	action?: FrameAction;
	message?: string;
}

// Notification Types
export interface Notification {
	type: 'like' | 'recast' | 'follow' | 'mention' | 'reply';
	timestamp: string;
	cast?: Cast;
	user?: FarcasterUser;
	reaction?: Reaction;
}

// Storage Types
export interface StorageUsage {
	object: 'storage_usage';
	user: FarcasterUser;
	casts: {
		object: 'storage_usage_casts';
		used: number;
		capacity: number;
	};
	reactions: {
		object: 'storage_usage_reactions';
		used: number;
		capacity: number;
	};
	links: {
		object: 'storage_usage_links';
		used: number;
		capacity: number;
	};
	userData: {
		object: 'storage_usage_user_data';
		used: number;
		capacity: number;
	};
	verifications: {
		object: 'storage_usage_verifications';
		used: number;
		capacity: number;
	};
	signers: {
		object: 'storage_usage_signers';
		used: number;
		capacity: number;
	};
}

export interface StorageLimits {
	object: 'storage_limits';
	limits: {
		casts: number;
		reactions: number;
		links: number;
		userData: number;
		verifications: number;
		signers: number;
	};
	units: number;
}

// Identity Types
export interface Signer {
	signerUuid?: string;
	publicKey: string;
	status: 'pending_approval' | 'approved' | 'revoked';
	fid?: number;
}

export interface CustodyAddress {
	fid: number;
	custodyAddress: string;
}

export interface RecoveryAddress {
	fid: number;
	recoveryAddress: string;
}

// Event Types
export interface HubEvent {
	type: string;
	id: number;
	mergeMessageBody?: {
		message: unknown;
		deletedMessages: unknown[];
	};
	pruneMessageBody?: {
		message: unknown;
	};
}

export interface HubInfo {
	version: string;
	isSyncing: boolean;
	nickname: string;
	rootHash: string;
	dbStats: {
		numMessages: number;
		numFidEvents: number;
		numFnameEvents: number;
	};
}

export interface SyncStatus {
	isSyncing: boolean;
	syncStatus: {
		peerId: string;
		inSync: string;
		shouldSync: boolean;
		divergencePrefix: string;
		divergenceSecondsAgo: number;
		theirMessages: number;
		ourMessages: number;
		lastBadSync: number;
		score: number;
	}[];
	engineStarted: boolean;
}

// SIWF Types
export interface SIWFRequest {
	siweUri: string;
	domain: string;
	nonce: string;
	notBefore?: string;
	expirationTime?: string;
	requestId?: string;
}

export interface SIWFResponse {
	message: string;
	signature: string;
	fid: number;
	custody: string;
	username: string;
	displayName: string;
	pfpUrl: string;
	bio?: string;
}

export interface SIWFVerificationResult {
	valid: boolean;
	fid?: number;
	user?: FarcasterUser;
	error?: string;
}

// Message Types
export interface MessageData {
	type: string;
	fid: number;
	timestamp: number;
	network: string;
	body: unknown;
}

export interface SignedMessage {
	data: MessageData;
	hash: string;
	hashScheme: string;
	signature: string;
	signatureScheme: string;
	signer: string;
}

// API Response Types
export interface PaginatedResponse<T> {
	messages?: T[];
	users?: T[];
	casts?: T[];
	reactions?: T[];
	channels?: T[];
	notifications?: T[];
	nextPageToken?: string;
	cursor?: string;
}

export interface HubResponse<T> {
	messages: T[];
	nextPageToken?: string;
}

export interface NeynarResponse<T> {
	result: T;
	cursor?: string;
}

// Feed Types
export interface FeedItem {
	cast: Cast;
	replies?: Cast[];
	rootParentUrl?: string;
	threadHash?: string;
}

export interface Feed {
	casts: Cast[];
	next?: {
		cursor?: string;
	};
}

// Error Types
export interface FarcasterError {
	code: string;
	message: string;
	details?: unknown;
}

// Request Types
export interface PostCastRequest {
	text: string;
	parentCastId?: {
		fid: number;
		hash: string;
	};
	parentUrl?: string;
	embeds?: CastEmbed[];
	mentions?: number[];
	mentionsPositions?: number[];
	channelId?: string;
}

export interface ReactionRequest {
	type: 'like' | 'recast';
	targetCastId: {
		fid: number;
		hash: string;
	};
}

export interface FollowRequest {
	targetFid: number;
}

// Trigger Types
export interface TriggerState {
	lastPollTimestamp?: number;
	lastCastHash?: string;
	lastFollowerFid?: number;
	lastMentionHash?: string;
	lastReplyHash?: string;
	seenItems?: string[];
}

// Constants
export const FARCASTER_EPOCH = 1609459200; // Jan 1, 2021 UTC
export const FARCASTER_NETWORK = 1; // Mainnet

export const MESSAGE_TYPE = {
	CAST_ADD: 'MESSAGE_TYPE_CAST_ADD',
	CAST_REMOVE: 'MESSAGE_TYPE_CAST_REMOVE',
	REACTION_ADD: 'MESSAGE_TYPE_REACTION_ADD',
	REACTION_REMOVE: 'MESSAGE_TYPE_REACTION_REMOVE',
	LINK_ADD: 'MESSAGE_TYPE_LINK_ADD',
	LINK_REMOVE: 'MESSAGE_TYPE_LINK_REMOVE',
	VERIFICATION_ADD: 'MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS',
	VERIFICATION_REMOVE: 'MESSAGE_TYPE_VERIFICATION_REMOVE',
	USER_DATA_ADD: 'MESSAGE_TYPE_USER_DATA_ADD',
	FRAME_ACTION: 'MESSAGE_TYPE_FRAME_ACTION',
} as const;

export const REACTION_TYPE = {
	LIKE: 'REACTION_TYPE_LIKE',
	RECAST: 'REACTION_TYPE_RECAST',
} as const;

export const USER_DATA_TYPE = {
	PFP: 'USER_DATA_TYPE_PFP',
	DISPLAY: 'USER_DATA_TYPE_DISPLAY',
	BIO: 'USER_DATA_TYPE_BIO',
	URL: 'USER_DATA_TYPE_URL',
	USERNAME: 'USER_DATA_TYPE_USERNAME',
} as const;
