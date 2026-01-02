# n8n-nodes-farcaster

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for the Farcaster decentralized social network protocol, providing 13 resource categories and 80+ operations for user management, social interactions, content creation, identity, and real-time notifications.

![n8n](https://img.shields.io/badge/n8n-community%20node-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **Complete Farcaster API integration** - Full support for Hub HTTP API and enhanced Neynar API
- **13 resource categories** - Users, Casts, Reactions, Follows, Channels, Frames, Notifications, Feed, Storage, Identity, Events, SIWF, and Utility
- **80+ operations** - Comprehensive coverage of all Farcaster functionality
- **Ed25519 signing** - Native support for authenticated write operations (post casts, reactions, follows)
- **Trigger node** - 8 polling-based triggers for real-time event monitoring
- **Dual API support** - Automatic fallback between Hub and Neynar APIs
- **Sign In with Farcaster (SIWF)** - Full authentication flow support

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Select **Install**
4. Enter `n8n-nodes-farcaster` and click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-farcaster
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-farcaster.git
cd n8n-nodes-farcaster

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom nodes directory
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-farcaster

# Restart n8n
n8n start
```

## Credentials Setup

### Farcaster API Credentials

| Field | Required | Description |
|-------|----------|-------------|
| Hub HTTP Endpoint | Yes | Hub API URL (default: https://hub.pinata.cloud/v1/) |
| Use Neynar Enhanced API | No | Enable for enhanced features and better rate limits |
| Neynar API Key | Conditional | Required if using Neynar |
| Farcaster ID (FID) | Conditional | Your numeric Farcaster ID for authenticated operations |
| Signer Private Key | Conditional | Ed25519 private key (hex) for write operations |
| Signer Public Key | Conditional | Ed25519 public key (hex) for signature verification |

### Getting Your Credentials

1. **Hub Endpoint**: Use Pinata's free Hub (https://hub.pinata.cloud/v1/) or run your own
2. **Neynar API Key**: Sign up at [neynar.com](https://neynar.com) for enhanced API access
3. **FID**: Find your FID on Warpcast or lookup by username
4. **Signer Keys**: Generate Ed25519 keypair for app signers (see Farcaster documentation)

## Resources & Operations

### Users
- `getUserByFID` - Get user details by Farcaster ID
- `getUserByUsername` - Lookup user by handle
- `getUserByAddress` - Find user by wallet address
- `searchUsers` - Search for users by query
- `getUserProfile` - Get full profile with bio, pfp, etc.
- `getUserStats` - Get follower/following counts
- `getVerifiedAddresses` - Get connected wallet addresses
- `bulkGetUsers` - Get multiple users by FIDs

### Casts
- `getCastByHash` - Get single cast by hash
- `getCastsByFID` - Get user's casts with pagination
- `getCastThread` - Get full conversation thread
- `postCast` - Create new cast (requires signer)
- `deleteCast` - Remove cast (requires signer)
- `getTrendingCasts` - Get popular casts
- `searchCasts` - Search casts by query
- `getCastReactions` - Get likes and recasts on cast

### Reactions
- `getReactionsByCast` - Get all reactions on a cast
- `getReactionsByUser` - Get user's reactions
- `addReaction` - Like or recast (requires signer)
- `removeReaction` - Remove like/recast (requires signer)
- `getReactionTypes` - Get available reaction types

### Follows
- `getFollowers` - Get user's followers with pagination
- `getFollowing` - Get accounts user follows
- `followUser` - Follow a user (requires signer)
- `unfollowUser` - Unfollow user (requires signer)
- `getMutualFollows` - Get mutual connections
- `checkFollowStatus` - Check if user A follows user B

### Channels
- `getChannelInfo` - Get channel details by ID
- `listAllChannels` - Get all available channels
- `getChannelCasts` - Get posts in channel
- `getChannelMembers` - Get channel followers
- `getChannelModerators` - Get mods and hosts
- `createChannelCast` - Post to channel (requires signer)
- `getTrendingChannels` - Get popular channels
- `searchChannels` - Find channels by query

### Frames
- `validateFrameAction` - Verify frame message signature
- `getFrameByURL` - Get frame metadata from URL
- `getFrameActions` - Get action history for frame
- `createFrameTransaction` - Build frame transaction data
- `getFrameAnalytics` - Get frame usage statistics

### Notifications
- `getNotifications` - Get user notifications
- `getMentions` - Get cast mentions
- `getReplies` - Get reply notifications
- `markAsRead` - Clear notifications

### Feed
- `getHomeFeed` - Get personalized feed
- `getChannelFeed` - Get channel-specific feed
- `getUserFeed` - Get user's posts
- `getTrendingFeed` - Get popular content
- `getForYouFeed` - Get algorithmic recommendations

### Storage
- `getStorageUsage` - Get current storage usage
- `getStorageLimits` - Get FID storage limits
- `getStorageUnits` - Get rent information
- `buyStorage` - Purchase storage units

### Identity
- `getFID` - Get Farcaster ID for address
- `getCustodyAddress` - Get owner address for FID
- `getRecoveryAddress` - Get recovery address
- `getSigners` - Get authorized signers for FID
- `addSigner` - Add app signer (on-chain)
- `removeSigner` - Revoke signer (on-chain)

### Events
- `subscribeEvents` - Get real-time event stream URL
- `getEventsByFID` - Get events for user
- `getHubInfo` - Get hub status
- `getSyncStatus` - Get hub sync state

### SIWF (Sign In with Farcaster)
- `createAuthRequest` - Initialize authentication
- `verifyAuthResponse` - Validate signature and get user
- `getAuthStatus` - Check authentication state

### Utility
- `getFIDByUsername` - Resolve handle to FID
- `getUsernameByFID` - Reverse lookup
- `validateMessage` - Verify message signature
- `getAPIHealth` - Check service status

## Trigger Node

The Farcaster Trigger node provides 8 polling-based triggers:

| Trigger | Description |
|---------|-------------|
| `newCastByUser` | New cast from specific FID |
| `newCastInChannel` | New cast in channel |
| `newFollower` | New follower for FID |
| `newMention` | User mentioned in cast |
| `newReply` | Reply to user's cast |
| `castReachedThreshold` | Cast reached like/recast count |
| `frameInteraction` | Frame button clicked |
| `channelCreated` | New channel created |

## Usage Examples

### Get User Profile

```javascript
// Using the Farcaster node
// Resource: Users
// Operation: getUserByUsername

{
  "username": "dwr.eth"
}

// Returns user profile with bio, pfp, follower counts, etc.
```

### Post a Cast

```javascript
// Resource: Casts
// Operation: postCast

{
  "text": "Hello from n8n! 👋",
  "channelId": "farcaster" // Optional: post to a channel
}

// Requires signer credentials configured
```

### Follow a User

```javascript
// Resource: Follows
// Operation: followUser

{
  "targetFid": 3
}

// Requires signer credentials configured
```

### Search Casts

```javascript
// Resource: Casts
// Operation: searchCasts

{
  "query": "n8n automation",
  "limit": 25
}
```

## Farcaster Concepts

| Concept | Description |
|---------|-------------|
| **FID** | Farcaster ID - unique numeric user identifier |
| **Cast** | Post/message on Farcaster (like a tweet) |
| **Hub** | P2P node storing Farcaster off-chain data |
| **Signer** | Ed25519 key authorized to post on behalf of FID |
| **Frame** | Interactive mini-app embedded in feed |
| **Channel** | Topic-based community/feed |
| **Custody Address** | Wallet that owns the FID on-chain |
| **Storage Unit** | Rental for cast storage capacity |
| **Warpcast** | Most popular Farcaster client |
| **SIWF** | Sign In with Farcaster authentication |

## API Modes

This node supports two API modes:

### Hub HTTP API (Default)
- Direct connection to Farcaster Hub
- Free to use with Pinata's public Hub
- Basic features and rate limits
- Best for self-hosted setups

### Neynar Enhanced API
- Enhanced API with better rate limits
- Additional features (trending, recommendations)
- Requires API key from [neynar.com](https://neynar.com)
- Best for production deployments

## Error Handling

The node implements comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Rate Limiting**: Graceful handling with clear error messages
- **Validation Errors**: Detailed messages for invalid inputs
- **Signing Errors**: Clear feedback for authentication issues

## Security Best Practices

1. **Never share signer private keys** - Keep them secure and rotate if compromised
2. **Use environment variables** - Store sensitive credentials in n8n's credential system
3. **Limit signer permissions** - Use app-specific signers with minimal required permissions
4. **Monitor for abuse** - Set up alerts for unusual activity
5. **Use Neynar for production** - Better rate limits and monitoring

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run linting
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

- **Documentation**: [Farcaster Docs](https://docs.farcaster.xyz)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-farcaster/issues)
- **Community**: [Farcaster Channel](https://warpcast.com/~/channel/farcaster)

## Acknowledgments

- [Farcaster Protocol](https://www.farcaster.xyz/) - The decentralized social network
- [Neynar](https://neynar.com) - Enhanced Farcaster API provider
- [n8n](https://n8n.io) - Workflow automation platform
- [@noble/ed25519](https://github.com/paulmillr/noble-ed25519) - Ed25519 cryptography
