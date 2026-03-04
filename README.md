# n8n-nodes-farcaster

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

This n8n community node provides comprehensive integration with Farcaster, a decentralized social network built on Ethereum. With 6 core resources implemented, it enables automated workflows for social media management, content distribution, user engagement tracking, and real-time notifications across the Farcaster protocol.

![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Farcaster](https://img.shields.io/badge/Farcaster-Protocol-purple)
![Web3](https://img.shields.io/badge/Web3-Social-green)

## Features

- **Cast Management** - Create, retrieve, update, and delete casts with full metadata support
- **User Operations** - Comprehensive user profile management and follower relationship handling
- **Channel Integration** - Complete channel administration including member management and content curation
- **Frame Support** - Create and manage interactive frames for enhanced user engagement
- **Real-time Notifications** - Monitor mentions, reactions, follows, and cast interactions instantly
- **Secure Authentication** - API key-based authentication with proper credential management
- **Webhook Integration** - Real-time event streaming for immediate workflow triggers
- **Bulk Operations** - Efficient batch processing for high-volume social media automation

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-farcaster`
5. Click **Install**

### Manual Installation

```bash
cd ~/.n8n
npm install n8n-nodes-farcaster
```

### Development Installation

```bash
git clone https://github.com/Velocity-BPA/n8n-nodes-farcaster.git
cd n8n-nodes-farcaster
npm install
npm run build
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-farcaster
n8n start
```

## Credentials Setup

| Field | Description | Required |
|-------|-------------|----------|
| API Key | Your Farcaster API key from the developer dashboard | ✓ |
| Environment | Choose between 'mainnet' or 'testnet' | ✓ |
| App Name | Your application identifier for API requests | ✓ |
| Rate Limit | Requests per minute limit (default: 100) | ✗ |

## Resources & Operations

### 1. Casts

| Operation | Description |
|-----------|-------------|
| Create | Publish a new cast to Farcaster |
| Get | Retrieve a specific cast by hash or URL |
| Update | Edit an existing cast's content or metadata |
| Delete | Remove a cast from your profile |
| List | Get casts from timeline, user, or channel |
| React | Add or remove reactions (like, recast, etc.) |
| Reply | Create a reply to an existing cast |

### 2. Users

| Operation | Description |
|-----------|-------------|
| Get Profile | Retrieve detailed user profile information |
| Update Profile | Modify profile details, bio, or display name |
| Follow | Follow another user |
| Unfollow | Unfollow a user |
| Get Followers | List users following a specific account |
| Get Following | List users that an account follows |
| Search | Search for users by username or display name |
| Block | Block a user account |
| Unblock | Remove user from blocked list |

### 3. Channels

| Operation | Description |
|-----------|-------------|
| Create | Create a new channel |
| Get | Retrieve channel information and metadata |
| Update | Modify channel settings and description |
| Delete | Remove a channel (admin only) |
| Join | Join an existing channel |
| Leave | Leave a channel |
| List Members | Get all channel members |
| Moderate | Perform moderation actions (ban, mute, etc.) |
| Get Feed | Retrieve channel's cast feed |

### 4. Frames

| Operation | Description |
|-----------|-------------|
| Create | Build and deploy interactive frames |
| Get | Retrieve frame configuration and metadata |
| Update | Modify frame content or interaction logic |
| Delete | Remove a frame from circulation |
| List | Get all frames associated with your account |
| Analytics | Retrieve frame interaction statistics |
| Test | Validate frame functionality before deployment |

### 5. Authentication

| Operation | Description |
|-----------|-------------|
| Verify Token | Validate API key and permissions |
| Refresh | Regenerate authentication credentials |
| Get Limits | Check current rate limits and usage |
| Revoke | Invalidate authentication tokens |

### 6. Notifications

| Operation | Description |
|-----------|-------------|
| List | Retrieve recent notifications |
| Mark Read | Mark notifications as read |
| Subscribe | Set up webhook subscriptions for events |
| Unsubscribe | Remove webhook subscriptions |
| Get Settings | Retrieve notification preferences |
| Update Settings | Modify notification preferences |

## Usage Examples

```javascript
// Create a new cast with mentions and links
{
  "resource": "casts",
  "operation": "create",
  "text": "Building the future of decentralized social! 🚀 @dwr @v",
  "embeds": ["https://farcaster.xyz"],
  "channel": "builders"
}
```

```javascript
// Follow multiple users and get their recent casts
{
  "resource": "users",
  "operation": "follow",
  "username": "dwr.eth"
}
```

```javascript
// Set up real-time notifications for mentions
{
  "resource": "notifications",
  "operation": "subscribe",
  "events": ["mention", "reply", "reaction"],
  "webhook_url": "https://your-n8n-instance.com/webhook/farcaster"
}
```

```javascript
// Create an interactive frame for user engagement
{
  "resource": "frames",
  "operation": "create",
  "title": "Vote on Our Proposal",
  "image": "https://example.com/voting-frame.png",
  "buttons": [
    {"text": "Yes", "action": "post", "target": "/vote/yes"},
    {"text": "No", "action": "post", "target": "/vote/no"}
  ]
}
```

## Error Handling

| Error | Description | Solution |
|-------|-------------|----------|
| 401 Unauthorized | Invalid or expired API key | Verify API key in credentials settings |
| 429 Rate Limited | Too many requests in time window | Implement delays or reduce request frequency |
| 403 Forbidden | Insufficient permissions for operation | Check API key permissions in Farcaster dashboard |
| 404 Not Found | Cast, user, or channel doesn't exist | Verify the resource identifier is correct |
| 422 Validation Error | Invalid data format or missing fields | Check required fields and data types |
| 500 Server Error | Farcaster API temporary issue | Implement retry logic with exponential backoff |

## Development

```bash
npm install
npm run build
npm test
npm run lint
npm run dev
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
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please ensure:

1. Code follows existing style conventions
2. All tests pass (`npm test`)
3. Linting passes (`npm run lint`)
4. Documentation is updated for new features
5. Commit messages are descriptive

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-farcaster/issues)
- **Farcaster Documentation**: [docs.farcaster.xyz](https://docs.farcaster.xyz)
- **Farcaster Developer Community**: [warpcast.com/~/channel/fc-devs](https://warpcast.com/~/channel/fc-devs)