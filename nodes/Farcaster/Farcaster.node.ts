/**
 * Copyright (c) 2026 Velocity BPA
 * 
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     https://github.com/VelocityBPA/n8n-nodes-farcaster/blob/main/LICENSE
 * 
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeApiError,
} from 'n8n-workflow';

export class Farcaster implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Farcaster',
    name: 'farcaster',
    icon: 'file:farcaster.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with the Farcaster API',
    defaults: {
      name: 'Farcaster',
    },
    inputs: ['main'],
    outputs: ['main'],
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
            name: 'Casts',
            value: 'casts',
          },
          {
            name: 'Users',
            value: 'users',
          },
          {
            name: 'Channels',
            value: 'channels',
          },
          {
            name: 'Frames',
            value: 'frames',
          },
          {
            name: 'Authentication',
            value: 'authentication',
          },
          {
            name: 'Notifications',
            value: 'notifications',
          }
        ],
        default: 'casts',
      },
      // Operation dropdowns per resource
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
      name: 'Get Cast',
      value: 'getCast',
      description: 'Retrieve a specific cast by hash',
      action: 'Get cast',
    },
    {
      name: 'Create Cast',
      value: 'createCast',
      description: 'Publish a new cast',
      action: 'Create cast',
    },
    {
      name: 'Delete Cast',
      value: 'deleteCast',
      description: 'Delete a cast',
      action: 'Delete cast',
    },
    {
      name: 'Get Feed',
      value: 'getFeed',
      description: 'Get feed of casts',
      action: 'Get feed',
    },
    {
      name: 'Get Trending Casts',
      value: 'getTrendingCasts',
      description: 'Get trending casts',
      action: 'Get trending casts',
    },
    {
      name: 'Get Cast Conversation',
      value: 'getCastConversation',
      description: 'Get cast replies thread',
      action: 'Get cast conversation',
    },
    {
      name: 'Like Cast',
      value: 'likeCast',
      description: 'Like or unlike a cast',
      action: 'Like cast',
    },
    {
      name: 'Recast Cast',
      value: 'recastCast',
      description: 'Recast or unrecast a cast',
      action: 'Recast cast',
    },
  ],
  default: 'getCast',
},
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
      name: 'Get Users',
      value: 'getUsers',
      description: 'Retrieve multiple users',
      action: 'Get multiple users',
    },
    {
      name: 'Search Users',
      value: 'searchUsers',
      description: 'Search for users',
      action: 'Search users',
    },
    {
      name: 'Follow User',
      value: 'followUser',
      description: 'Follow or unfollow a user',
      action: 'Follow or unfollow user',
    },
    {
      name: 'Get Followers',
      value: 'getFollowers',
      description: 'Get user followers',
      action: 'Get user followers',
    },
    {
      name: 'Get Following',
      value: 'getFollowing',
      description: 'Get users that a user follows',
      action: 'Get users following',
    },
    {
      name: 'Get Power Users',
      value: 'getPowerUsers',
      description: 'Get power users',
      action: 'Get power users',
    },
    {
      name: 'Lookup User by Verification',
      value: 'lookupUserByVerification',
      description: 'Lookup user by verification address',
      action: 'Lookup user by verification',
    },
  ],
  default: 'getUsers',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['channels'],
    },
  },
  options: [
    {
      name: 'Get Channel',
      value: 'getChannel',
      description: 'Get channel details',
      action: 'Get channel details',
    },
    {
      name: 'Search Channels',
      value: 'searchChannels',
      description: 'Search for channels',
      action: 'Search for channels',
    },
    {
      name: 'Get Channels',
      value: 'getChannels',
      description: 'List all channels',
      action: 'List all channels',
    },
    {
      name: 'Get Channel Users',
      value: 'getChannelUsers',
      description: 'Get channel members',
      action: 'Get channel members',
    },
    {
      name: 'Follow Channel',
      value: 'followChannel',
      description: 'Follow or unfollow a channel',
      action: 'Follow or unfollow a channel',
    },
    {
      name: 'Get Channel Followers',
      value: 'getChannelFollowers',
      description: 'Get channel followers',
      action: 'Get channel followers',
    },
    {
      name: 'Invite to Channel',
      value: 'inviteToChannel',
      description: 'Send channel invite',
      action: 'Send channel invite',
    },
  ],
  default: 'getChannel',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['frames'],
    },
  },
  options: [
    {
      name: 'Validate Frame',
      value: 'validateFrame',
      description: 'Validate frame metadata',
      action: 'Validate frame metadata',
    },
    {
      name: 'Process Frame Action',
      value: 'processFrameAction',
      description: 'Process frame button action',
      action: 'Process frame button action',
    },
    {
      name: 'Get Frame',
      value: 'getFrame',
      description: 'Get frame metadata',
      action: 'Get frame metadata',
    },
    {
      name: 'Create Developer Frame',
      value: 'createDeveloperFrame',
      description: 'Create developer-managed frame',
      action: 'Create developer-managed frame',
    },
    {
      name: 'Update Developer Frame',
      value: 'updateDeveloperFrame',
      description: 'Update developer-managed frame',
      action: 'Update developer-managed frame',
    },
    {
      name: 'Delete Developer Frame',
      value: 'deleteDeveloperFrame',
      description: 'Delete developer-managed frame',
      action: 'Delete developer-managed frame',
    },
  ],
  default: 'validateFrame',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['authentication'],
    },
  },
  options: [
    {
      name: 'Sign In With Farcaster',
      value: 'signInWithFarcaster',
      description: 'Initiate SIWF authentication',
      action: 'Sign in with Farcaster',
    },
    {
      name: 'Verify Signature',
      value: 'verifySignature',
      description: 'Verify Ed25519 signature',
      action: 'Verify signature',
    },
    {
      name: 'Get Custody Address',
      value: 'getCustodyAddress',
      description: 'Get custody address for FID',
      action: 'Get custody address',
    },
    {
      name: 'Create Signer',
      value: 'createSigner',
      description: 'Register new signer',
      action: 'Create signer',
    },
    {
      name: 'Get Signer',
      value: 'getSigner',
      description: 'Get signer details',
      action: 'Get signer',
    },
    {
      name: 'Delete Signer',
      value: 'deleteSigner',
      description: 'Remove signer',
      action: 'Delete signer',
    },
  ],
  default: 'signInWithFarcaster',
},
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
      name: 'Get Notifications',
      value: 'getNotifications',
      description: 'Get user notifications',
      action: 'Get notifications',
    },
    {
      name: 'Mark Notifications Seen',
      value: 'markNotificationsSeen',
      description: 'Mark notifications as seen',
      action: 'Mark notifications as seen',
    },
    {
      name: 'Get Mentions and Replies',
      value: 'getMentionsAndReplies',
      description: 'Get mentions and replies',
      action: 'Get mentions and replies',
    },
    {
      name: 'Create Webhook',
      value: 'createWebhook',
      description: 'Create notification webhook',
      action: 'Create webhook',
    },
    {
      name: 'Update Webhook',
      value: 'updateWebhook',
      description: 'Update webhook',
      action: 'Update webhook',
    },
    {
      name: 'Delete Webhook',
      value: 'deleteWebhook',
      description: 'Delete webhook',
      action: 'Delete webhook',
    },
  ],
  default: 'getNotifications',
},
      // Parameter definitions
{
  displayName: 'Cast Hash',
  name: 'hash',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getCast'],
    },
  },
  default: '',
  description: 'The hash of the cast to retrieve',
},
{
  displayName: 'Type',
  name: 'type',
  type: 'options',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getCast'],
    },
  },
  options: [
    {
      name: 'Hash',
      value: 'hash',
    },
    {
      name: 'URL',
      value: 'url',
    },
  ],
  default: 'hash',
  description: 'The type of identifier used',
},
{
  displayName: 'Viewer FID',
  name: 'viewer_fid',
  type: 'number',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getCast'],
    },
  },
  default: 0,
  description: 'The FID of the user viewing the cast',
},
{
  displayName: 'Text',
  name: 'text',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['createCast'],
    },
  },
  default: '',
  description: 'The text content of the cast',
},
{
  displayName: 'Embeds',
  name: 'embeds',
  type: 'json',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['createCast'],
    },
  },
  default: '',
  description: 'JSON array of embeds to include in the cast',
},
{
  displayName: 'Parent',
  name: 'parent',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['createCast'],
    },
  },
  default: '',
  description: 'The hash of the parent cast for replies',
},
{
  displayName: 'Signer UUID',
  name: 'signer_uuid',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['createCast', 'deleteCast', 'likeCast', 'recastCast'],
    },
  },
  default: '',
  description: 'The UUID of the signer',
},
{
  displayName: 'Target Hash',
  name: 'target_hash',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['deleteCast', 'likeCast', 'recastCast'],
    },
  },
  default: '',
  description: 'The hash of the target cast',
},
{
  displayName: 'FID',
  name: 'fid',
  type: 'number',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getFeed'],
    },
  },
  default: 0,
  description: 'The FID of the user whose feed to retrieve',
},
{
  displayName: 'FIDs',
  name: 'fids',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getFeed'],
    },
  },
  default: '',
  description: 'Comma-separated list of FIDs to get feed from',
},
{
  displayName: 'Filter Type',
  name: 'filter_type',
  type: 'options',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getFeed'],
    },
  },
  options: [
    {
      name: 'Following',
      value: 'following',
    },
    {
      name: 'Global Trending',
      value: 'global_trending',
    },
  ],
  default: 'following',
  description: 'The type of feed filter to apply',
},
{
  displayName: 'Limit',
  name: 'limit',
  type: 'number',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getFeed', 'getTrendingCasts'],
    },
  },
  default: 25,
  description: 'The maximum number of casts to return',
},
{
  displayName: 'Cursor',
  name: 'cursor',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getFeed', 'getTrendingCasts'],
    },
  },
  default: '',
  description: 'Pagination cursor',
},
{
  displayName: 'Time Window',
  name: 'time_window',
  type: 'options',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getTrendingCasts'],
    },
  },
  options: [
    {
      name: '1h',
      value: '1h',
    },
    {
      name: '6h',
      value: '6h',
    },
    {
      name: '24h',
      value: '24h',
    },
  ],
  default: '24h',
  description: 'Time window for trending casts',
},
{
  displayName: 'Cast Hash',
  name: 'hash',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getCastConversation'],
    },
  },
  default: '',
  description: 'The hash of the cast to get conversation for',
},
{
  displayName: 'Type',
  name: 'type',
  type: 'options',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getCastConversation'],
    },
  },
  options: [
    {
      name: 'Hash',
      value: 'hash',
    },
    {
      name: 'URL',
      value: 'url',
    },
  ],
  default: 'hash',
  description: 'The type of identifier used',
},
{
  displayName: 'Reply Depth',
  name: 'reply_depth',
  type: 'number',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getCastConversation'],
    },
  },
  default: 2,
  description: 'The maximum depth of replies to fetch',
},
{
  displayName: 'Include Chronological Parent Casts',
  name: 'include_chronological_parent_casts',
  type: 'boolean',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['getCastConversation'],
    },
  },
  default: false,
  description: 'Whether to include chronological parent casts',
},
{
  displayName: 'Like',
  name: 'like',
  type: 'boolean',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['likeCast'],
    },
  },
  default: true,
  description: 'Whether to like (true) or unlike (false) the cast',
},
{
  displayName: 'Recast',
  name: 'recast',
  type: 'boolean',
  displayOptions: {
    show: {
      resource: ['casts'],
      operation: ['recastCast'],
    },
  },
  default: true,
  description: 'Whether to recast (true) or unrecast (false) the cast',
},
{
  displayName: 'FIDs',
  name: 'fids',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['users'],
      operation: ['getUsers'],
    },
  },
  default: '',
  description: 'Comma-separated list of FIDs',
},
{
  displayName: 'Usernames',
  name: 'usernames',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['users'],
      operation: ['getUsers'],
    },
  },
  default: '',
  description: 'Comma-separated list of usernames',
},
{
  displayName: 'Viewer FID',
  name: 'viewer_fid',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['users'],
      operation: ['getUsers', 'searchUsers', 'getFollowers', 'getFollowing', 'getPowerUsers', 'lookupUserByVerification'],
    },
  },
  default: '',
  description: 'FID of the viewer',
},
{
  displayName: 'Query',
  name: 'q',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['users'],
      operation: ['searchUsers'],
    },
  },
  default: '',
  description: 'Search query',
},
{
  displayName: 'Limit',
  name: 'limit',
  type: 'number',
  displayOptions: {
    show: {
      resource: ['users'],
      operation: ['searchUsers', 'getFollowers', 'getFollowing', 'getPowerUsers'],
    },
  },
  default: 25,
  description: 'Maximum number of results',
},
{
  displayName: 'Signer UUID',
  name: 'signer_uuid',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['users'],
      operation: ['followUser'],
    },
  },
  default: '',
  description: 'UUID of the signer',
},
{
  displayName: 'Target FIDs',
  name: 'target_fids',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['users'],
      operation: ['followUser'],
    },
  },
  default: '',
  description: 'Comma-separated list of target FIDs to follow/unfollow',
},
{
  displayName: 'Follow',
  name: 'follow',
  type: 'boolean',
  displayOptions: {
    show: {
      resource: ['users'],
      operation: ['followUser'],
    },
  },
  default: true,
  description: 'Whether to follow (true) or unfollow (false)',
},
{
  displayName: 'FID',
  name: 'fid',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['users'],
      operation: ['getFollowers', 'getFollowing'],
    },
  },
  default: '',
  description: 'FID of the user',
},
{
  displayName: 'Sort Type',
  name: 'sort_type',
  type: 'options',
  displayOptions: {
    show: {
      resource: ['users'],
      operation: ['getFollowers', 'getFollowing'],
    },
  },
  options: [
    {
      name: 'Desc By Follower Count',
      value: 'desc_by_follower_count',
    },
    {
      name: 'Desc By Timestamp',
      value: 'desc_by_timestamp',
    },
    {
      name: 'Asc By Timestamp',
      value: 'asc_by_timestamp',
    },
  ],
  default: 'desc_by_follower_count',
  description: 'Sort order for results',
},
{
  displayName: 'Cursor',
  name: 'cursor',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['users'],
      operation: ['getFollowers', 'getFollowing'],
    },
  },
  default: '',
  description: 'Pagination cursor',
},
{
  displayName: 'Verification Address',
  name: 'verification_address',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['users'],
      operation: ['lookupUserByVerification'],
    },
  },
  default: '',
  description: 'Ethereum address to lookup',
},
{
  displayName: 'Channel ID',
  name: 'id',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['getChannel'],
    },
  },
  default: '',
  description: 'The channel ID',
},
{
  displayName: 'Type',
  name: 'type',
  type: 'options',
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['getChannel'],
    },
  },
  options: [
    {
      name: 'ID',
      value: 'id',
    },
    {
      name: 'Parent URL',
      value: 'parent_url',
    },
  ],
  default: 'id',
  description: 'Type of channel identifier',
},
{
  displayName: 'Viewer FID',
  name: 'viewer_fid',
  type: 'number',
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['getChannel', 'searchChannels', 'getChannelFollowers'],
    },
  },
  default: 0,
  description: 'FID of the viewer for personalized results',
},
{
  displayName: 'Search Query',
  name: 'q',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['searchChannels'],
    },
  },
  default: '',
  description: 'Search query for channels',
},
{
  displayName: 'Limit',
  name: 'limit',
  type: 'number',
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['searchChannels', 'getChannels', 'getChannelUsers', 'getChannelFollowers'],
    },
  },
  default: 25,
  description: 'Maximum number of results to return',
},
{
  displayName: 'Cursor',
  name: 'cursor',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['getChannels', 'getChannelUsers', 'getChannelFollowers'],
    },
  },
  default: '',
  description: 'Pagination cursor',
},
{
  displayName: 'Channel ID',
  name: 'id',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['getChannelUsers', 'getChannelFollowers'],
    },
  },
  default: '',
  description: 'The channel ID',
},
{
  displayName: 'Has Root Cast Authors',
  name: 'has_root_cast_authors',
  type: 'boolean',
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['getChannelUsers'],
    },
  },
  default: false,
  description: 'Include users who are root cast authors',
},
{
  displayName: 'Has Cast Likers',
  name: 'has_cast_likers',
  type: 'boolean',
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['getChannelUsers'],
    },
  },
  default: false,
  description: 'Include users who have liked casts',
},
{
  displayName: 'Has Cast Recasters',
  name: 'has_cast_recasters',
  type: 'boolean',
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['getChannelUsers'],
    },
  },
  default: false,
  description: 'Include users who have recasted',
},
{
  displayName: 'Signer UUID',
  name: 'signer_uuid',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['followChannel', 'inviteToChannel'],
    },
  },
  default: '',
  description: 'UUID of the signer to perform the action',
},
{
  displayName: 'Channel ID',
  name: 'channel_id',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['followChannel', 'inviteToChannel'],
    },
  },
  default: '',
  description: 'The channel ID',
},
{
  displayName: 'Follow',
  name: 'follow',
  type: 'boolean',
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['followChannel'],
    },
  },
  default: true,
  description: 'True to follow, false to unfollow',
},
{
  displayName: 'FID',
  name: 'fid',
  type: 'number',
  required: true,
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['inviteToChannel'],
    },
  },
  default: 0,
  description: 'Farcaster ID to invite',
},
{
  displayName: 'Role',
  name: 'role',
  type: 'options',
  displayOptions: {
    show: {
      resource: ['channels'],
      operation: ['inviteToChannel'],
    },
  },
  options: [
    {
      name: 'Member',
      value: 'member',
    },
    {
      name: 'Moderator',
      value: 'moderator',
    },
    {
      name: 'Admin',
      value: 'admin',
    },
  ],
  default: 'member',
  description: 'Role to assign to the invited user',
},
{
  displayName: 'URL',
  name: 'url',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['frames'],
      operation: ['validateFrame', 'getFrame', 'createDeveloperFrame', 'updateDeveloperFrame', 'deleteDeveloperFrame'],
    },
  },
  default: '',
  description: 'The URL of the frame',
},
{
  displayName: 'Frames URL',
  name: 'framesUrl',
  type: 'string',
  required: false,
  displayOptions: {
    show: {
      resource: ['frames'],
      operation: ['validateFrame'],
    },
  },
  default: '',
  description: 'The frames URL for validation',
},
{
  displayName: 'Action',
  name: 'action',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['frames'],
      operation: ['processFrameAction'],
    },
  },
  default: '',
  description: 'The frame action to process',
},
{
  displayName: 'Untrusted Data',
  name: 'untrustedData',
  type: 'json',
  required: true,
  displayOptions: {
    show: {
      resource: ['frames'],
      operation: ['processFrameAction'],
    },
  },
  default: '{}',
  description: 'The untrusted data from the frame interaction',
},
{
  displayName: 'Trusted Data',
  name: 'trustedData',
  type: 'json',
  required: true,
  displayOptions: {
    show: {
      resource: ['frames'],
      operation: ['processFrameAction'],
    },
  },
  default: '{}',
  description: 'The trusted data from the frame interaction',
},
{
  displayName: 'Name',
  name: 'name',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['frames'],
      operation: ['createDeveloperFrame', 'updateDeveloperFrame'],
    },
  },
  default: '',
  description: 'The name of the frame',
},
{
  displayName: 'Image',
  name: 'image',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['frames'],
      operation: ['createDeveloperFrame', 'updateDeveloperFrame'],
    },
  },
  default: '',
  description: 'The image URL for the frame',
},
{
  displayName: 'Buttons',
  name: 'buttons',
  type: 'json',
  required: false,
  displayOptions: {
    show: {
      resource: ['frames'],
      operation: ['createDeveloperFrame', 'updateDeveloperFrame'],
    },
  },
  default: '[]',
  description: 'The buttons configuration for the frame',
},
{
  displayName: 'Input',
  name: 'input',
  type: 'json',
  required: false,
  displayOptions: {
    show: {
      resource: ['frames'],
      operation: ['createDeveloperFrame', 'updateDeveloperFrame'],
    },
  },
  default: '{}',
  description: 'The input configuration for the frame',
},
{
  displayName: 'State',
  name: 'state',
  type: 'json',
  required: false,
  displayOptions: {
    show: {
      resource: ['frames'],
      operation: ['createDeveloperFrame', 'updateDeveloperFrame'],
    },
  },
  default: '{}',
  description: 'The state data for the frame',
},
{
  displayName: 'Domain',
  name: 'domain',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['authentication'],
      operation: ['signInWithFarcaster'],
    },
  },
  default: '',
  description: 'The domain requesting authentication',
},
{
  displayName: 'URI',
  name: 'uri',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['authentication'],
      operation: ['signInWithFarcaster'],
    },
  },
  default: '',
  description: 'The URI of the request',
},
{
  displayName: 'Nonce',
  name: 'nonce',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['authentication'],
      operation: ['signInWithFarcaster'],
    },
  },
  default: '',
  description: 'Unique nonce for the authentication request',
},
{
  displayName: 'Statement',
  name: 'statement',
  type: 'string',
  required: false,
  displayOptions: {
    show: {
      resource: ['authentication'],
      operation: ['signInWithFarcaster'],
    },
  },
  default: '',
  description: 'Optional statement for the authentication request',
},
{
  displayName: 'Signature',
  name: 'signature',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['authentication'],
      operation: ['verifySignature'],
    },
  },
  default: '',
  description: 'The Ed25519 signature to verify',
},
{
  displayName: 'Message',
  name: 'message',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['authentication'],
      operation: ['verifySignature'],
    },
  },
  default: '',
  description: 'The original message that was signed',
},
{
  displayName: 'Public Key',
  name: 'publicKey',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['authentication'],
      operation: ['verifySignature', 'createSigner'],
    },
  },
  default: '',
  description: 'The Ed25519 public key',
},
{
  displayName: 'FID',
  name: 'fid',
  type: 'number',
  required: true,
  displayOptions: {
    show: {
      resource: ['authentication'],
      operation: ['verifySignature', 'getCustodyAddress', 'createSigner'],
    },
  },
  default: 0,
  description: 'The Farcaster ID',
},
{
  displayName: 'Request ID',
  name: 'requestId',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['authentication'],
      operation: ['createSigner'],
    },
  },
  default: '',
  description: 'The request ID for signer creation',
},
{
  displayName: 'Deadline',
  name: 'deadline',
  type: 'number',
  required: true,
  displayOptions: {
    show: {
      resource: ['authentication'],
      operation: ['createSigner'],
    },
  },
  default: 0,
  description: 'The deadline timestamp for the signer request',
},
{
  displayName: 'Signer UUID',
  name: 'signerUuid',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['authentication'],
      operation: ['getSigner', 'deleteSigner'],
    },
  },
  default: '',
  description: 'The unique identifier for the signer',
},
{
  displayName: 'FID (Farcaster ID)',
  name: 'fid',
  type: 'number',
  required: true,
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['getNotifications'],
    },
  },
  default: 0,
  description: 'The Farcaster ID of the user',
},
{
  displayName: 'Priority Mode',
  name: 'priority_mode',
  type: 'boolean',
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['getNotifications'],
    },
  },
  default: false,
  description: 'Whether to use priority mode for notifications',
},
{
  displayName: 'Cursor',
  name: 'cursor',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['getNotifications'],
    },
  },
  default: '',
  description: 'Cursor for pagination',
},
{
  displayName: 'Signer UUID',
  name: 'signer_uuid',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['markNotificationsSeen'],
    },
  },
  default: '',
  description: 'The UUID of the signer',
},
{
  displayName: 'Type',
  name: 'type',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['markNotificationsSeen'],
    },
  },
  default: '',
  description: 'The type of notification to mark as seen',
},
{
  displayName: 'FID (Farcaster ID)',
  name: 'fid',
  type: 'number',
  required: true,
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['getMentionsAndReplies'],
    },
  },
  default: 0,
  description: 'The Farcaster ID of the user',
},
{
  displayName: 'Priority Mode',
  name: 'priority_mode',
  type: 'boolean',
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['getMentionsAndReplies'],
    },
  },
  default: false,
  description: 'Whether to use priority mode for mentions and replies',
},
{
  displayName: 'Cursor',
  name: 'cursor',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['getMentionsAndReplies'],
    },
  },
  default: '',
  description: 'Cursor for pagination',
},
{
  displayName: 'Webhook Name',
  name: 'name',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['createWebhook'],
    },
  },
  default: '',
  description: 'The name of the webhook',
},
{
  displayName: 'Webhook URL',
  name: 'url',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['createWebhook'],
    },
  },
  default: '',
  description: 'The URL for the webhook',
},
{
  displayName: 'Subscription',
  name: 'subscription',
  type: 'json',
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['createWebhook'],
    },
  },
  default: '{}',
  description: 'Subscription configuration for the webhook',
},
{
  displayName: 'Webhook ID',
  name: 'webhook_id',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['updateWebhook'],
    },
  },
  default: '',
  description: 'The ID of the webhook to update',
},
{
  displayName: 'Webhook Name',
  name: 'name',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['updateWebhook'],
    },
  },
  default: '',
  description: 'The updated name of the webhook',
},
{
  displayName: 'Webhook URL',
  name: 'url',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['updateWebhook'],
    },
  },
  default: '',
  description: 'The updated URL for the webhook',
},
{
  displayName: 'Subscription',
  name: 'subscription',
  type: 'json',
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['updateWebhook'],
    },
  },
  default: '{}',
  description: 'Updated subscription configuration for the webhook',
},
{
  displayName: 'Webhook ID',
  name: 'webhook_id',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['notifications'],
      operation: ['deleteWebhook'],
    },
  },
  default: '',
  description: 'The ID of the webhook to delete',
},
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const resource = this.getNodeParameter('resource', 0) as string;

    switch (resource) {
      case 'casts':
        return [await executeCastsOperations.call(this, items)];
      case 'users':
        return [await executeUsersOperations.call(this, items)];
      case 'channels':
        return [await executeChannelsOperations.call(this, items)];
      case 'frames':
        return [await executeFramesOperations.call(this, items)];
      case 'authentication':
        return [await executeAuthenticationOperations.call(this, items)];
      case 'notifications':
        return [await executeNotificationsOperations.call(this, items)];
      default:
        throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not supported`);
    }
  }
}

// ============================================================
// Resource Handler Functions
// ============================================================

async function executeCastsOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('farcasterApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;

      switch (operation) {
        case 'getCast': {
          const hash = this.getNodeParameter('hash', i) as string;
          const type = this.getNodeParameter('type', i) as string;
          const viewerFid = this.getNodeParameter('viewer_fid', i) as number;

          const params: any = {
            identifier: hash,
            type: type,
          };

          if (viewerFid) {
            params.viewer_fid = viewerFid;
          }

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/cast`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            qs: params,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'createCast': {
          const text = this.getNodeParameter('text', i) as string;
          const embeds = this.getNodeParameter('embeds', i) as string;
          const parent = this.getNodeParameter('parent', i) as string;
          const signerUuid = this.getNodeParameter('signer_uuid', i) as string;

          const body: any = {
            signer_uuid: signerUuid,
            text: text,
          };

          if (embeds) {
            body.embeds = typeof embeds === 'string' ? JSON.parse(embeds) : embeds;
          }

          if (parent) {
            body.parent = parent;
          }

          const options: any = {
            method: 'POST',
            url: `${credentials.baseUrl}/cast`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: body,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'deleteCast': {
          const signerUuid = this.getNodeParameter('signer_uuid', i) as string;
          const targetHash = this.getNodeParameter('target_hash', i) as string;

          const options: any = {
            method: 'DELETE',
            url: `${credentials.baseUrl}/cast`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: {
              signer_uuid: signerUuid,
              target_hash: targetHash,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getFeed': {
          const fid = this.getNodeParameter('fid', i) as number;
          const fids = this.getNodeParameter('fids', i) as string;
          const filterType = this.getNodeParameter('filter_type', i) as string;
          const limit = this.getNodeParameter('limit', i) as number;
          const cursor = this.getNodeParameter('cursor', i) as string;

          const params: any = {
            filter_type: filterType,
            limit: limit,
          };

          if (fid) {
            params.fid = fid;
          }

          if (fids) {
            params.fids = fids;
          }

          if (cursor) {
            params.cursor = cursor;
          }

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/feed`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            qs: params,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getTrendingCasts': {
          const limit = this.getNodeParameter('limit', i) as number;
          const cursor = this.getNodeParameter('cursor', i) as string;
          const timeWindow = this.getNodeParameter('time_window', i) as string;

          const params: any = {
            limit: limit,
            time_window: timeWindow,
          };

          if (cursor) {
            params.cursor = cursor;
          }

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/feed/trending`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            qs: params,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getCastConversation': {
          const hash = this.getNodeParameter('hash', i) as string;
          const type = this.getNodeParameter('type', i) as string;
          const replyDepth = this.getNodeParameter('reply_depth', i) as number;
          const includeChronologicalParentCasts = this.getNodeParameter('include_chronological_parent_casts', i) as boolean;

          const params: any = {
            identifier: hash,
            type: type,
            reply_depth: replyDepth,
            include_chronological_parent_casts: includeChronologicalParentCasts,
          };

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/cast/conversation`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            qs: params,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'likeCast': {
          const signerUuid = this.getNodeParameter('signer_uuid', i) as string;
          const targetHash = this.getNodeParameter('target_hash', i) as string;
          const like = this.getNodeParameter('like', i) as boolean;

          const options: any = {
            method: 'PUT',
            url: `${credentials.baseUrl}/cast/like`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: {
              signer_uuid: signerUuid,
              target_hash: targetHash,
              like: like,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'recastCast': {
          const signerUuid = this.getNodeParameter('signer_uuid', i) as string;
          const targetHash = this.getNodeParameter('target_hash', i) as string;
          const recast = this.getNodeParameter('recast', i) as boolean;

          const options: any = {
            method: 'POST',
            url: `${credentials.baseUrl}/cast/recast`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: {
              signer_uuid: signerUuid,
              target_hash: targetHash,
              recast: recast,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      returnData.push({ json: result, pairedItem: { item: i } });

    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
      } else {
        if (error.response?.body?.message) {
          throw new NodeApiError(this.getNode(), { message: error.response.body.message });
        }
        throw error;
      }
    }
  }

  return returnData;
}

async function executeUsersOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('farcasterApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;

      switch (operation) {
        case 'getUsers': {
          const fids = this.getNodeParameter('fids', i) as string;
          const usernames = this.getNodeParameter('usernames', i) as string;
          const viewerFid = this.getNodeParameter('viewer_fid', i) as string;

          const params: any = {};
          if (fids) params.fids = fids;
          if (usernames) params.usernames = usernames;
          if (viewerFid) params.viewer_fid = viewerFid;

          const queryString = new URLSearchParams(params).toString();
          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/user/bulk?${queryString}`,
            headers: {
              'api_key': credentials.apiKey,
              'Content-Type': 'application/json',
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'searchUsers': {
          const q = this.getNodeParameter('q', i) as string;
          const viewerFid = this.getNodeParameter('viewer_fid', i) as string;
          const limit = this.getNodeParameter('limit', i) as number;

          const params: any = { q };
          if (viewerFid) params.viewer_fid = viewerFid;
          if (limit) params.limit = limit.toString();

          const queryString = new URLSearchParams(params).toString();
          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/user/search?${queryString}`,
            headers: {
              'api_key': credentials.apiKey,
              'Content-Type': 'application/json',
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'followUser': {
          const signerUuid = this.getNodeParameter('signer_uuid', i) as string;
          const targetFids = this.getNodeParameter('target_fids', i) as string;
          const follow = this.getNodeParameter('follow', i) as boolean;

          const body: any = {
            signer_uuid: signerUuid,
            target_fids: targetFids.split(',').map((fid: string) => parseInt(fid.trim())),
            follow: follow,
          };

          const options: any = {
            method: 'PUT',
            url: `${credentials.baseUrl}/user/follow`,
            headers: {
              'api_key': credentials.apiKey,
              'Content-Type': 'application/json',
            },
            body: body,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getFollowers': {
          const fid = this.getNodeParameter('fid', i) as string;
          const viewerFid = this.getNodeParameter('viewer_fid', i) as string;
          const sortType = this.getNodeParameter('sort_type', i) as string;
          const limit = this.getNodeParameter('limit', i) as number;
          const cursor = this.getNodeParameter('cursor', i) as string;

          const params: any = { fid };
          if (viewerFid) params.viewer_fid = viewerFid;
          if (sortType) params.sort_type = sortType;
          if (limit) params.limit = limit.toString();
          if (cursor) params.cursor = cursor;

          const queryString = new URLSearchParams(params).toString();
          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/followers?${queryString}`,
            headers: {
              'api_key': credentials.apiKey,
              'Content-Type': 'application/json',
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getFollowing': {
          const fid = this.getNodeParameter('fid', i) as string;
          const viewerFid = this.getNodeParameter('viewer_fid', i) as string;
          const sortType = this.getNodeParameter('sort_type', i) as string;
          const limit = this.getNodeParameter('limit', i) as number;
          const cursor = this.getNodeParameter('cursor', i) as string;

          const params: any = { fid };
          if (viewerFid) params.viewer_fid = viewerFid;
          if (sortType) params.sort_type = sortType;
          if (limit) params.limit = limit.toString();
          if (cursor) params.cursor = cursor;

          const queryString = new URLSearchParams(params).toString();
          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/following?${queryString}`,
            headers: {
              'api_key': credentials.apiKey,
              'Content-Type': 'application/json',
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getPowerUsers': {
          const viewerFid = this.getNodeParameter('viewer_fid', i) as string;
          const limit = this.getNodeParameter('limit', i) as number;

          const params: any = {};
          if (viewerFid) params.viewer_fid = viewerFid;
          if (limit) params.limit = limit.toString();

          const queryString = new URLSearchParams(params).toString();
          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/user/power-users${queryString ? '?' + queryString : ''}`,
            headers: {
              'api_key': credentials.apiKey,
              'Content-Type': 'application/json',
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'lookupUserByVerification': {
          const verificationAddress = this.getNodeParameter('verification_address', i) as string;
          const viewerFid = this.getNodeParameter('viewer_fid', i) as string;

          const body: any = {
            verification_address: verificationAddress,
          };
          if (viewerFid) body.viewer_fid = viewerFid;

          const options: any = {
            method: 'POST',
            url: `${credentials.baseUrl}/user/lookup`,
            headers: {
              'api_key': credentials.apiKey,
              'Content-Type': 'application/json',
            },
            body: body,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      returnData.push({ json: result, pairedItem: { item: i } });
    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({ 
          json: { error: error.message }, 
          pairedItem: { item: i } 
        });
      } else {
        throw new NodeApiError(this.getNode(), error);
      }
    }
  }

  return returnData;
}

async function executeChannelsOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('farcasterApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;
      
      switch (operation) {
        case 'getChannel': {
          const id = this.getNodeParameter('id', i) as string;
          const type = this.getNodeParameter('type', i) as string;
          const viewerFid = this.getNodeParameter('viewer_fid', i) as number;
          
          const params = new URLSearchParams();
          params.append('id', id);
          params.append('type', type);
          if (viewerFid > 0) {
            params.append('viewer_fid', viewerFid.toString());
          }

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/channel?${params.toString()}`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            json: true,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'searchChannels': {
          const q = this.getNodeParameter('q', i) as string;
          const viewerFid = this.getNodeParameter('viewer_fid', i) as number;
          const limit = this.getNodeParameter('limit', i) as number;
          
          const params = new URLSearchParams();
          params.append('q', q);
          if (viewerFid > 0) {
            params.append('viewer_fid', viewerFid.toString());
          }
          if (limit > 0) {
            params.append('limit', limit.toString());
          }

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/channel/search?${params.toString()}`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            json: true,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'getChannels': {
          const limit = this.getNodeParameter('limit', i) as number;
          const cursor = this.getNodeParameter('cursor', i) as string;
          
          const params = new URLSearchParams();
          if (limit > 0) {
            params.append('limit', limit.toString());
          }
          if (cursor) {
            params.append('cursor', cursor);
          }

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/channel/list?${params.toString()}`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            json: true,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'getChannelUsers': {
          const id = this.getNodeParameter('id', i) as string;
          const hasRootCastAuthors = this.getNodeParameter('has_root_cast_authors', i) as boolean;
          const hasCastLikers = this.getNodeParameter('has_cast_likers', i) as boolean;
          const hasCastRecasters = this.getNodeParameter('has_cast_recasters', i) as boolean;
          const limit = this.getNodeParameter('limit', i) as number;
          const cursor = this.getNodeParameter('cursor', i) as string;
          
          const params = new URLSearchParams();
          params.append('id', id);
          if (hasRootCastAuthors) {
            params.append('has_root_cast_authors', 'true');
          }
          if (hasCastLikers) {
            params.append('has_cast_likers', 'true');
          }
          if (hasCastRecasters) {
            params.append('has_cast_recasters', 'true');
          }
          if (limit > 0) {
            params.append('limit', limit.toString());
          }
          if (cursor) {
            params.append('cursor', cursor);
          }

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/channel/users?${params.toString()}`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            json: true,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'followChannel': {
          const signerUuid = this.getNodeParameter('signer_uuid', i) as string;
          const channelId = this.getNodeParameter('channel_id', i) as string;
          const follow = this.getNodeParameter('follow', i) as boolean;
          
          const body = {
            signer_uuid: signerUuid,
            channel_id: channelId,
            follow: follow,
          };

          const options: any = {
            method: 'PUT',
            url: `${credentials.baseUrl}/channel/follow`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: body,
            json: true,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'getChannelFollowers': {
          const id = this.getNodeParameter('id', i) as string;
          const viewerFid = this.getNodeParameter('viewer_fid', i) as number;
          const limit = this.getNodeParameter('limit', i) as number;
          const cursor = this.getNodeParameter('cursor', i) as string;
          
          const params = new URLSearchParams();
          params.append('id', id);
          if (viewerFid > 0) {
            params.append('viewer_fid', viewerFid.toString());
          }
          if (limit > 0) {
            params.append('limit', limit.toString());
          }
          if (cursor) {
            params.append('cursor', cursor);
          }

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/channel/followers?${params.toString()}`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            json: true,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'inviteToChannel': {
          const signerUuid = this.getNodeParameter('signer_uuid', i) as string;
          const channelId = this.getNodeParameter('channel_id', i) as string;
          const fid = this.getNodeParameter('fid', i) as number;
          const role = this.getNodeParameter('role', i) as string;
          
          const body = {
            signer_uuid: signerUuid,
            channel_id: channelId,
            fid: fid,
            role: role,
          };

          const options: any = {
            method: 'POST',
            url: `${credentials.baseUrl}/channel/invite`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: body,
            json: true,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }
      
      returnData.push({ json: result, pairedItem: { item: i } });
      
    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
      } else {
        throw new NodeApiError(this.getNode(), error);
      }
    }
  }
  
  return returnData;
}

async function executeFramesOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('farcasterApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;

      switch (operation) {
        case 'validateFrame': {
          const url = this.getNodeParameter('url', i) as string;
          const framesUrl = this.getNodeParameter('framesUrl', i) as string;
          
          const body: any = { url };
          if (framesUrl) {
            body.frames_url = framesUrl;
          }

          const options: any = {
            method: 'POST',
            url: `${credentials.baseUrl}/farcaster/frame/validate`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'processFrameAction': {
          const action = this.getNodeParameter('action', i) as string;
          const untrustedData = this.getNodeParameter('untrustedData', i) as any;
          const trustedData = this.getNodeParameter('trustedData', i) as any;

          const options: any = {
            method: 'POST',
            url: `${credentials.baseUrl}/farcaster/frame/action`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: {
              action,
              untrusted_data: typeof untrustedData === 'string' ? JSON.parse(untrustedData) : untrustedData,
              trusted_data: typeof trustedData === 'string' ? JSON.parse(trustedData) : trustedData,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getFrame': {
          const url = this.getNodeParameter('url', i) as string;

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/farcaster/frame`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            qs: { url },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'createDeveloperFrame': {
          const url = this.getNodeParameter('url', i) as string;
          const name = this.getNodeParameter('name', i) as string;
          const image = this.getNodeParameter('image', i) as string;
          const buttons = this.getNodeParameter('buttons', i) as any;
          const input = this.getNodeParameter('input', i) as any;
          const state = this.getNodeParameter('state', i) as any;

          const body: any = {
            url,
            name,
            image,
          };

          if (buttons) {
            body.buttons = typeof buttons === 'string' ? JSON.parse(buttons) : buttons;
          }
          if (input) {
            body.input = typeof input === 'string' ? JSON.parse(input) : input;
          }
          if (state) {
            body.state = typeof state === 'string' ? JSON.parse(state) : state;
          }

          const options: any = {
            method: 'POST',
            url: `${credentials.baseUrl}/farcaster/frame/developer-managed`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'updateDeveloperFrame': {
          const url = this.getNodeParameter('url', i) as string;
          const name = this.getNodeParameter('name', i) as string;
          const image = this.getNodeParameter('image', i) as string;
          const buttons = this.getNodeParameter('buttons', i) as any;
          const input = this.getNodeParameter('input', i) as any;
          const state = this.getNodeParameter('state', i) as any;

          const body: any = {
            url,
            name,
            image,
          };

          if (buttons) {
            body.buttons = typeof buttons === 'string' ? JSON.parse(buttons) : buttons;
          }
          if (input) {
            body.input = typeof input === 'string' ? JSON.parse(input) : input;
          }
          if (state) {
            body.state = typeof state === 'string' ? JSON.parse(state) : state;
          }

          const options: any = {
            method: 'PUT',
            url: `${credentials.baseUrl}/farcaster/frame/developer-managed`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'deleteDeveloperFrame': {
          const url = this.getNodeParameter('url', i) as string;

          const options: any = {
            method: 'DELETE',
            url: `${credentials.baseUrl}/farcaster/frame/developer-managed`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: { url },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      returnData.push({ json: result, pairedItem: { item: i } });
    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
      } else {
        throw new NodeApiError(this.getNode(), error);
      }
    }
  }

  return returnData;
}

async function executeAuthenticationOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('farcasterApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;

      switch (operation) {
        case 'signInWithFarcaster': {
          const domain = this.getNodeParameter('domain', i) as string;
          const uri = this.getNodeParameter('uri', i) as string;
          const nonce = this.getNodeParameter('nonce', i) as string;
          const statement = this.getNodeParameter('statement', i) as string;

          const body: any = {
            domain,
            uri,
            nonce,
          };

          if (statement) {
            body.statement = statement;
          }

          const options: any = {
            method: 'POST',
            url: `${credentials.baseUrl}/auth/siwf`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'verifySignature': {
          const signature = this.getNodeParameter('signature', i) as string;
          const message = this.getNodeParameter('message', i) as string;
          const publicKey = this.getNodeParameter('publicKey', i) as string;
          const fid = this.getNodeParameter('fid', i) as number;

          const options: any = {
            method: 'POST',
            url: `${credentials.baseUrl}/auth/verify`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: {
              signature,
              message,
              public_key: publicKey,
              fid,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getCustodyAddress': {
          const fid = this.getNodeParameter('fid', i) as number;

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/auth/custody-address`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            qs: {
              fid,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'createSigner': {
          const publicKey = this.getNodeParameter('publicKey', i) as string;
          const requestId = this.getNodeParameter('requestId', i) as string;
          const signature = this.getNodeParameter('signature', i) as string;
          const deadline = this.getNodeParameter('deadline', i) as number;
          const fid = this.getNodeParameter('fid', i) as number;

          const options: any = {
            method: 'POST',
            url: `${credentials.baseUrl}/signer`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: {
              public_key: publicKey,
              requestId,
              signature,
              deadline,
              fid,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getSigner': {
          const signerUuid = this.getNodeParameter('signerUuid', i) as string;

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/signer`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            qs: {
              signer_uuid: signerUuid,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'deleteSigner': {
          const signerUuid = this.getNodeParameter('signerUuid', i) as string;

          const options: any = {
            method: 'DELETE',
            url: `${credentials.baseUrl}/signer`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: {
              signer_uuid: signerUuid,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      returnData.push({ json: result, pairedItem: { item: i } });

    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({ 
          json: { error: error.message }, 
          pairedItem: { item: i } 
        });
      } else {
        throw new NodeApiError(this.getNode(), error);
      }
    }
  }

  return returnData;
}

async function executeNotificationsOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('farcasterApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;

      switch (operation) {
        case 'getNotifications': {
          const fid = this.getNodeParameter('fid', i) as number;
          const priority_mode = this.getNodeParameter('priority_mode', i) as boolean;
          const cursor = this.getNodeParameter('cursor', i) as string;

          const queryParams = new URLSearchParams();
          queryParams.append('fid', fid.toString());
          if (priority_mode) {
            queryParams.append('priority_mode', 'true');
          }
          if (cursor) {
            queryParams.append('cursor', cursor);
          }

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/notifications?${queryParams.toString()}`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'markNotificationsSeen': {
          const signer_uuid = this.getNodeParameter('signer_uuid', i) as string;
          const type = this.getNodeParameter('type', i) as string;

          const body: any = {
            signer_uuid,
          };

          if (type) {
            body.type = type;
          }

          const options: any = {
            method: 'PUT',
            url: `${credentials.baseUrl}/notifications/seen`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getMentionsAndReplies': {
          const fid = this.getNodeParameter('fid', i) as number;
          const priority_mode = this.getNodeParameter('priority_mode', i) as boolean;
          const cursor = this.getNodeParameter('cursor', i) as string;

          const queryParams = new URLSearchParams();
          queryParams.append('fid', fid.toString());
          if (priority_mode) {
            queryParams.append('priority_mode', 'true');
          }
          if (cursor) {
            queryParams.append('cursor', cursor);
          }

          const options: any = {
            method: 'GET',
            url: `${credentials.baseUrl}/mentions-and-replies?${queryParams.toString()}`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'createWebhook': {
          const name = this.getNodeParameter('name', i) as string;
          const url = this.getNodeParameter('url', i) as string;
          const subscription = this.getNodeParameter('subscription', i) as any;

          let parsedSubscription: any = {};
          if (typeof subscription === 'string') {
            try {
              parsedSubscription = JSON.parse(subscription);
            } catch (error: any) {
              throw new NodeOperationError(this.getNode(), 'Invalid JSON in subscription parameter');
            }
          } else {
            parsedSubscription = subscription;
          }

          const body: any = {
            name,
            url,
            subscription: parsedSubscription,
          };

          const options: any = {
            method: 'POST',
            url: `${credentials.baseUrl}/webhook`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'updateWebhook': {
          const webhook_id = this.getNodeParameter('webhook_id', i) as string;
          const name = this.getNodeParameter('name', i) as string;
          const url = this.getNodeParameter('url', i) as string;
          const subscription = this.getNodeParameter('subscription', i) as any;

          let parsedSubscription: any = {};
          if (typeof subscription === 'string') {
            try {
              parsedSubscription = JSON.parse(subscription);
            } catch (error: any) {
              throw new NodeOperationError(this.getNode(), 'Invalid JSON in subscription parameter');
            }
          } else {
            parsedSubscription = subscription;
          }

          const body: any = {
            webhook_id,
          };

          if (name) {
            body.name = name;
          }
          if (url) {
            body.url = url;
          }
          if (Object.keys(parsedSubscription).length > 0) {
            body.subscription = parsedSubscription;
          }

          const options: any = {
            method: 'PUT',
            url: `${credentials.baseUrl}/webhook`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'deleteWebhook': {
          const webhook_id = this.getNodeParameter('webhook_id', i) as string;

          const options: any = {
            method: 'DELETE',
            url: `${credentials.baseUrl}/webhook`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: {
              webhook_id,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      returnData.push({
        json: result,
        pairedItem: { item: i },
      });
    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({
          json: { error: error.message },
          pairedItem: { item: i },
        });
      } else {
        throw new NodeApiError(this.getNode(), error);
      }
    }
  }

  return returnData;
}
