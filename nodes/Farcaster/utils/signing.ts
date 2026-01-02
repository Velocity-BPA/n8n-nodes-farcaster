/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { blake3 } from '@noble/hashes/blake3';
import { IDataObject } from 'n8n-workflow';
import {
	FARCASTER_EPOCH,
	FARCASTER_NETWORK,
	MESSAGE_TYPE,
	REACTION_TYPE,
} from '../types/farcaster.types';

// Configure ed25519 to use sha512
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

/**
 * Generate a new Ed25519 key pair
 */
export async function generateKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
	const privateKey = ed.utils.randomPrivateKey();
	const publicKey = await ed.getPublicKeyAsync(privateKey);
	
	return {
		privateKey: Buffer.from(privateKey).toString('hex'),
		publicKey: Buffer.from(publicKey).toString('hex'),
	};
}

/**
 * Sign a message with Ed25519
 */
export async function signMessage(
	messageBytes: Uint8Array,
	privateKeyHex: string,
): Promise<Uint8Array> {
	const privateKey = hexToBytes(privateKeyHex);
	const signature = await ed.signAsync(messageBytes, privateKey);
	return signature;
}

/**
 * Verify an Ed25519 signature
 */
export async function verifySignature(
	messageBytes: Uint8Array,
	signatureBytes: Uint8Array,
	publicKeyHex: string,
): Promise<boolean> {
	const publicKey = hexToBytes(publicKeyHex);
	return ed.verifyAsync(signatureBytes, messageBytes, publicKey);
}

/**
 * Hash message data using Blake3
 */
export function hashMessage(messageData: Uint8Array): Uint8Array {
	return blake3(messageData, { dkLen: 20 }); // 20 bytes = 160 bits
}

/**
 * Get current Farcaster timestamp
 */
export function getFarcasterTimestamp(): number {
	return Math.floor(Date.now() / 1000) - FARCASTER_EPOCH;
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
	const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
	}
	return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Encode a string to bytes (UTF-8)
 */
export function stringToBytes(str: string): Uint8Array {
	return new TextEncoder().encode(str);
}

/**
 * Encode message data for signing
 */
export function encodeMessageData(data: IDataObject): Uint8Array {
	// Simple JSON encoding - in production would use protobuf
	const jsonString = JSON.stringify(data);
	return stringToBytes(jsonString);
}

/**
 * Create a signed Cast Add message
 */
export async function createSignedCastAdd(
	fid: number,
	text: string,
	privateKeyHex: string,
	options: {
		parentCastId?: { fid: number; hash: string };
		parentUrl?: string;
		embeds?: Array<{ url?: string; castId?: { fid: number; hash: string } }>;
		mentions?: number[];
		mentionsPositions?: number[];
	} = {},
): Promise<IDataObject> {
	const timestamp = getFarcasterTimestamp();
	
	const messageData: IDataObject = {
		type: MESSAGE_TYPE.CAST_ADD,
		fid,
		timestamp,
		network: FARCASTER_NETWORK,
		castAddBody: {
			text,
			embeds: options.embeds || [],
			embedsDeprecated: [],
			mentions: options.mentions || [],
			mentionsPositions: options.mentionsPositions || [],
			...(options.parentCastId && { parentCastId: options.parentCastId }),
			...(options.parentUrl && { parentUrl: options.parentUrl }),
		},
	};

	return signMessageData(messageData, privateKeyHex);
}

/**
 * Create a signed Cast Remove message
 */
export async function createSignedCastRemove(
	fid: number,
	targetHash: string,
	privateKeyHex: string,
): Promise<IDataObject> {
	const timestamp = getFarcasterTimestamp();
	
	const messageData: IDataObject = {
		type: MESSAGE_TYPE.CAST_REMOVE,
		fid,
		timestamp,
		network: FARCASTER_NETWORK,
		castRemoveBody: {
			targetHash: targetHash.startsWith('0x') ? targetHash.slice(2) : targetHash,
		},
	};

	return signMessageData(messageData, privateKeyHex);
}

/**
 * Create a signed Reaction Add message (like or recast)
 */
export async function createSignedReactionAdd(
	fid: number,
	reactionType: 'like' | 'recast',
	targetFid: number,
	targetHash: string,
	privateKeyHex: string,
): Promise<IDataObject> {
	const timestamp = getFarcasterTimestamp();
	
	const messageData: IDataObject = {
		type: MESSAGE_TYPE.REACTION_ADD,
		fid,
		timestamp,
		network: FARCASTER_NETWORK,
		reactionBody: {
			type: reactionType === 'like' ? REACTION_TYPE.LIKE : REACTION_TYPE.RECAST,
			targetCastId: {
				fid: targetFid,
				hash: targetHash.startsWith('0x') ? targetHash.slice(2) : targetHash,
			},
		},
	};

	return signMessageData(messageData, privateKeyHex);
}

/**
 * Create a signed Reaction Remove message
 */
export async function createSignedReactionRemove(
	fid: number,
	reactionType: 'like' | 'recast',
	targetFid: number,
	targetHash: string,
	privateKeyHex: string,
): Promise<IDataObject> {
	const timestamp = getFarcasterTimestamp();
	
	const messageData: IDataObject = {
		type: MESSAGE_TYPE.REACTION_REMOVE,
		fid,
		timestamp,
		network: FARCASTER_NETWORK,
		reactionBody: {
			type: reactionType === 'like' ? REACTION_TYPE.LIKE : REACTION_TYPE.RECAST,
			targetCastId: {
				fid: targetFid,
				hash: targetHash.startsWith('0x') ? targetHash.slice(2) : targetHash,
			},
		},
	};

	return signMessageData(messageData, privateKeyHex);
}

/**
 * Create a signed Link Add message (follow)
 */
export async function createSignedLinkAdd(
	fid: number,
	targetFid: number,
	privateKeyHex: string,
): Promise<IDataObject> {
	const timestamp = getFarcasterTimestamp();
	
	const messageData: IDataObject = {
		type: MESSAGE_TYPE.LINK_ADD,
		fid,
		timestamp,
		network: FARCASTER_NETWORK,
		linkBody: {
			type: 'follow',
			targetFid,
		},
	};

	return signMessageData(messageData, privateKeyHex);
}

/**
 * Create a signed Link Remove message (unfollow)
 */
export async function createSignedLinkRemove(
	fid: number,
	targetFid: number,
	privateKeyHex: string,
): Promise<IDataObject> {
	const timestamp = getFarcasterTimestamp();
	
	const messageData: IDataObject = {
		type: MESSAGE_TYPE.LINK_REMOVE,
		fid,
		timestamp,
		network: FARCASTER_NETWORK,
		linkBody: {
			type: 'follow',
			targetFid,
		},
	};

	return signMessageData(messageData, privateKeyHex);
}

/**
 * Sign message data and return complete signed message
 */
async function signMessageData(
	messageData: IDataObject,
	privateKeyHex: string,
): Promise<IDataObject> {
	const dataBytes = encodeMessageData(messageData);
	const hash = hashMessage(dataBytes);
	const signature = await signMessage(hash, privateKeyHex);
	const publicKey = await ed.getPublicKeyAsync(hexToBytes(privateKeyHex));
	
	return {
		data: messageData,
		hash: bytesToHex(hash),
		hashScheme: 'HASH_SCHEME_BLAKE3',
		signature: bytesToHex(signature),
		signatureScheme: 'SIGNATURE_SCHEME_ED25519',
		signer: bytesToHex(publicKey),
	};
}

/**
 * Validate a signed message
 */
export async function validateSignedMessage(
	signedMessage: IDataObject,
): Promise<{ valid: boolean; error?: string }> {
	try {
		const data = signedMessage.data as IDataObject;
		const hash = signedMessage.hash as string;
		const signature = signedMessage.signature as string;
		const signer = signedMessage.signer as string;
		
		// Verify hash
		const dataBytes = encodeMessageData(data);
		const computedHash = hashMessage(dataBytes);
		const expectedHash = bytesToHex(computedHash);
		
		if (hash !== expectedHash) {
			return { valid: false, error: 'Hash mismatch' };
		}
		
		// Verify signature
		const hashBytes = hexToBytes(hash);
		const signatureBytes = hexToBytes(signature);
		const isValid = await verifySignature(hashBytes, signatureBytes, signer);
		
		if (!isValid) {
			return { valid: false, error: 'Invalid signature' };
		}
		
		return { valid: true };
	} catch (error) {
		return { valid: false, error: (error as Error).message };
	}
}

/**
 * Create Frame action message
 */
export async function createFrameActionMessage(
	fid: number,
	url: string,
	buttonIndex: number,
	castFid: number,
	castHash: string,
	privateKeyHex: string,
	options: {
		inputText?: string;
		state?: string;
		transactionId?: string;
	} = {},
): Promise<IDataObject> {
	const timestamp = getFarcasterTimestamp();
	
	const messageData: IDataObject = {
		type: MESSAGE_TYPE.FRAME_ACTION,
		fid,
		timestamp,
		network: FARCASTER_NETWORK,
		frameActionBody: {
			url,
			buttonIndex,
			castId: {
				fid: castFid,
				hash: castHash.startsWith('0x') ? castHash.slice(2) : castHash,
			},
			...(options.inputText && { inputText: options.inputText }),
			...(options.state && { state: options.state }),
			...(options.transactionId && { transactionId: options.transactionId }),
		},
	};

	return signMessageData(messageData, privateKeyHex);
}
