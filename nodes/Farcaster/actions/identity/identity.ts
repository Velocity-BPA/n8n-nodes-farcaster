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

export const identityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['identity'],
			},
		},
		options: [
			{
				name: 'Add Signer',
				value: 'addSigner',
				description: 'Add app signer (on-chain)',
				action: 'Add signer',
			},
			{
				name: 'Get Custody Address',
				value: 'getCustodyAddress',
				description: 'Get owner address for FID',
				action: 'Get custody address',
			},
			{
				name: 'Get FID',
				value: 'getFID',
				description: 'Get Farcaster ID for address',
				action: 'Get FID',
			},
			{
				name: 'Get Recovery Address',
				value: 'getRecoveryAddress',
				description: 'Get recovery address for FID',
				action: 'Get recovery address',
			},
			{
				name: 'Get Signers',
				value: 'getSigners',
				description: 'Get authorized signers for FID',
				action: 'Get signers',
			},
			{
				name: 'Remove Signer',
				value: 'removeSigner',
				description: 'Revoke signer (on-chain)',
				action: 'Remove signer',
			},
		],
		default: 'getFID',
	},
];

export const identityFields: INodeProperties[] = [
	// Address for getFID
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		default: '',
		description: 'The Ethereum address to lookup',
		displayOptions: {
			show: {
				resource: ['identity'],
				operation: ['getFID'],
			},
		},
	},
	// FID for identity operations
	{
		displayName: 'FID',
		name: 'fid',
		type: 'number',
		required: true,
		default: 0,
		description: 'The Farcaster ID',
		displayOptions: {
			show: {
				resource: ['identity'],
				operation: ['getCustodyAddress', 'getRecoveryAddress', 'getSigners', 'addSigner', 'removeSigner'],
			},
		},
	},
	// Signer public key
	{
		displayName: 'Signer Public Key',
		name: 'signerPublicKey',
		type: 'string',
		required: true,
		default: '',
		description: 'The Ed25519 public key of the signer (hex)',
		displayOptions: {
			show: {
				resource: ['identity'],
				operation: ['addSigner', 'removeSigner'],
			},
		},
	},
	// Signer metadata
	{
		displayName: 'Signer Name',
		name: 'signerName',
		type: 'string',
		default: '',
		description: 'Display name for the signer/app',
		displayOptions: {
			show: {
				resource: ['identity'],
				operation: ['addSigner'],
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
				resource: ['identity'],
			},
		},
		options: [
			{
				displayName: 'Include Inactive',
				name: 'includeInactive',
				type: 'boolean',
				default: false,
				description: 'Whether to include revoked/inactive signers',
			},
		],
	},
];

export async function executeIdentityOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	const credentials = await getCredentials.call(this);
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'getFID': {
			const address = this.getNodeParameter('address', i) as string;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user/by_verification', undefined, {
					address,
				});
				responseData = response as IDataObject;
			} else {
				// Hub API - lookup FID by address
				const response = await hubApiRequest.call(this, 'GET', 'onChainIdRegistryEventByAddress', undefined, {
					address,
				});
				responseData = response as IDataObject;
			}
			break;
		}

		case 'getCustodyAddress': {
			const fid = this.getNodeParameter('fid', i) as number;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/custody-address', undefined, { fid });
				responseData = response as IDataObject;
			} else {
				const response = await hubApiRequest.call(this, 'GET', 'onChainIdRegistryEventByFid', undefined, { fid });
				responseData = response as IDataObject;
			}
			break;
		}

		case 'getRecoveryAddress': {
			const fid = this.getNodeParameter('fid', i) as number;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				// Recovery address is part of the FID registration
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/user', undefined, { fid });
				responseData = {
					fid,
					recoveryAddress: (response as IDataObject).recovery_address,
				};
			} else {
				const response = await hubApiRequest.call(this, 'GET', 'onChainIdRegistryEventByFid', undefined, { fid });
				const eventBody = (response as IDataObject).idRegisterEventBody as IDataObject | undefined;
				responseData = {
					fid,
					recoveryAddress: eventBody?.recoveryAddress,
				};
			}
			break;
		}

		case 'getSigners': {
			const fid = this.getNodeParameter('fid', i) as number;
			const options = this.getNodeParameter('options', i) as IDataObject;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'GET', 'farcaster/signer/developer_managed', undefined, {
					fid,
				});
				responseData = response.signers as IDataObject[] || [];
			} else {
				const response = await hubApiRequest.call(this, 'GET', 'onChainSignersByFid', undefined, {
					fid,
					...(options.includeInactive && { state: 'all' }),
				});
				responseData = response.events as IDataObject[] || [];
			}
			break;
		}

		case 'addSigner': {
			const fid = this.getNodeParameter('fid', i) as number;
			const signerPublicKey = this.getNodeParameter('signerPublicKey', i) as string;
			const signerName = this.getNodeParameter('signerName', i) as string;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				// Neynar provides sponsored signer registration
				const response = await neynarApiRequest.call(this, 'POST', 'farcaster/signer/developer_managed/signed_key', {
					public_key: signerPublicKey,
					app_fid: fid,
					...(signerName && { name: signerName }),
				});
				responseData = response as IDataObject;
			} else {
				responseData = {
					message: 'Adding signers requires on-chain transaction',
					fid,
					signerPublicKey,
					note: 'Use Warpcast or an on-chain method to add signers',
				};
			}
			break;
		}

		case 'removeSigner': {
			const fid = this.getNodeParameter('fid', i) as number;
			const signerPublicKey = this.getNodeParameter('signerPublicKey', i) as string;
			
			if (credentials.useNeynar && credentials.neynarApiKey) {
				const response = await neynarApiRequest.call(this, 'DELETE', 'farcaster/signer/developer_managed', undefined, {
					public_key: signerPublicKey,
				});
				responseData = response as IDataObject;
			} else {
				responseData = {
					message: 'Removing signers requires on-chain transaction',
					fid,
					signerPublicKey,
					note: 'Use Warpcast or an on-chain method to revoke signers',
				};
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return returnDataToN8n(responseData);
}
