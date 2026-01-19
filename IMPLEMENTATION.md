# Approval Service MVP - Implementation Guide

## Overview

The Approval Service is a secure, production-ready deal approval system that enables clients to review and approve deals via time-limited, single-use tokens. The system tracks every interaction with complete audit trails and integrates with external systems via webhooks.

## Architecture

### Database Schema

The system uses four core tables:

**DealSnapshot** - Stores immutable deal data at the moment of approval link generation
- `id` (UUID) - Primary key
- `clientName` - Client organization name
- `clientEmail` - Optional client contact email
- `currency` - Deal currency (EUR, USD, GBP, CZK)
- `total` - Deal total in cents (integer)
- `itemsJSON` - JSON array of line items
- `status` - Deal status (DRAFT, SENT, APPROVED, REJECTED, EXPIRED)
- `createdAt`, `updatedAt` - Timestamps

**ApprovalToken** - Manages secure approval tokens
- `id` (UUID) - Primary key
- `dealId` - Foreign key to DealSnapshot
- `tokenHash` - SHA-256 hash of the actual token (never store plaintext)
- `expiresAt` - Token expiration time (14 days)
- `usedAt` - Timestamp when token was used (null if unused)
- `createdAt` - Creation timestamp

**ApprovalEvent** - Complete audit trail of all interactions
- `id` (UUID) - Primary key
- `dealId` - Foreign key to DealSnapshot
- `type` - Event type (SENT, VIEWED, APPROVED, REJECTED)
- `metaJSON` - JSON with IP address, user agent, and other metadata
- `createdAt` - Event timestamp

**WebhookConfig** - External system integration configuration
- `id` (UUID) - Primary key
- `dealId` - Optional foreign key (null for global webhooks)
- `url` - Webhook endpoint URL
- `events` - Comma-separated event types to trigger on
- `isActive` - Enable/disable flag
- `createdAt`, `updatedAt` - Timestamps

## Security Implementation

### Token Generation & Storage

The system implements industry-standard token security:

1. **Generation**: 32+ bytes (256 bits) of cryptographically secure random data
   - Generated using Node.js `crypto.randomBytes(32)`
   - Encoded as hex string (64 characters)
   - Unique per deal

2. **Storage**: SHA-256 hashing prevents enumeration attacks
   - Raw token never stored in database
   - Only hash is persisted
   - Verification uses timing-safe comparison

3. **Single-Use**: Tokens invalidate after first use
   - `usedAt` timestamp set upon confirmation
   - Subsequent attempts rejected with "Token already used" error

4. **Expiration**: 14-day validity window
   - Calculated at generation time
   - Automatic rejection of expired tokens
   - Background cleanup job recommended for production

### Audit Trail

Every interaction is logged with:
- **Event Type**: SENT, VIEWED, APPROVED, REJECTED
- **IP Address**: Extracted from x-forwarded-for or socket.remoteAddress
- **User Agent**: Browser/client identification
- **Timestamp**: UTC timestamp of event
- **Deal Reference**: Immutable link to deal snapshot

## API Endpoints

### Deal Management (Protected - Requires Authentication)

**POST /api/trpc/deals.create**
Creates a new deal and generates an approval token.

Request:
```json
{
  "clientName": "Acme Corp",
  "clientEmail": "contact@acme.com",
  "currency": "EUR",
  "total": 50000,
  "items": [
    {
      "description": "Consulting Services",
      "quantity": 10,
      "unitPrice": 5000
    }
  ],
  "webhookUrl": "https://example.com/webhook"
}
```

Response:
```json
{
  "dealId": "550e8400-e29b-41d4-a716-446655440000",
  "approvalLink": "https://approval.service/approve/abc123def456...",
  "token": "abc123def456..."
}
```

**GET /api/trpc/deals.list**
Lists all deals with their current status.

Response:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clientName": "Acme Corp",
    "currency": "EUR",
    "total": 50000,
    "status": "SENT",
    "createdAt": "2026-01-19T18:00:00Z"
  }
]
```

**GET /api/trpc/deals.getById**
Retrieves deal details and complete audit trail.

Request:
```json
{
  "dealId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Response:
```json
{
  "deal": { /* deal snapshot */ },
  "auditTrail": [
    {
      "id": "...",
      "type": "SENT",
      "metaJSON": "{\"ip\": \"192.168.1.1\", \"userAgent\": \"Mozilla/5.0...\"}",
      "createdAt": "2026-01-19T18:00:00Z"
    }
  ]
}
```

### Approval Flow (Public - No Authentication)

**GET /api/trpc/approval.getDeal**
Retrieves deal data for public approval page. Validates token and logs VIEWED event.

Request:
```json
{
  "token": "abc123def456..."
}
```

Response:
```json
{
  "token": "abc123def456...",
  "deal": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clientName": "Acme Corp",
    "currency": "EUR",
    "total": 50000,
    "items": [ /* line items */ ],
    "createdAt": "2026-01-19T18:00:00Z"
  }
}
```

**POST /api/trpc/approval.confirm**
Confirms or rejects a deal. Marks token as used and updates deal status.

Request:
```json
{
  "token": "abc123def456...",
  "approved": true
}
```

Response:
```json
{
  "success": true,
  "status": "APPROVED"
}
```

## Email Notifications

The system sends automated emails at key points:

1. **Approval Link Email** (to client)
   - Sent when deal is created
   - Contains approval link
   - Includes deal summary

2. **Approval Confirmation Email** (to owner)
   - Sent when deal is approved
   - Contains client name and deal amount
   - Includes timestamp

3. **Rejection Notification Email** (to owner)
   - Sent when deal is rejected
   - Contains client name and deal amount
   - Suggests follow-up action

**Note**: Current implementation logs emails to console. For production, integrate with SendGrid, Mailgun, or similar service.

## Webhook Integration

Webhooks enable real-time synchronization with external systems (e.g., TradeFlow).

### Webhook Payload

```json
{
  "event": "APPROVED",
  "dealId": "550e8400-e29b-41d4-a716-446655440000",
  "dealStatus": "APPROVED",
  "clientName": "Acme Corp",
  "clientEmail": "contact@acme.com",
  "total": 50000,
  "currency": "EUR",
  "timestamp": "2026-01-19T18:30:00Z",
  "metadata": {}
}
```

### Webhook Events

- **SENT**: Triggered when approval link is generated
- **VIEWED**: Triggered when client opens approval page
- **APPROVED**: Triggered when client approves deal
- **REJECTED**: Triggered when client rejects deal

### Retry Logic

Failed webhook deliveries are retried with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 2 seconds later
- Attempt 3: 4 seconds later

Client errors (4xx) are not retried. Server errors (5xx) trigger retries.

## Frontend Pages

### Home Page (`/`)
- Landing page with feature overview
- Sign-in redirect for unauthenticated users
- Quick action cards for authenticated users

### Dashboard (`/dashboard`)
- Deal management interface (protected)
- Create new deals with line items
- View all deals with status indicators
- Inspect individual deal details
- Review complete audit trail
- Copy approval links

### Approval Page (`/approve/:token`)
- Public deal review interface
- Display deal details and line items
- Confirmation checkbox
- Approve/Reject buttons
- Error handling for invalid/expired tokens
- Success confirmation screen

## Testing

The project includes comprehensive vitest unit tests:

**Token Tests** (`server/token.test.ts`)
- Token generation (randomness, uniqueness)
- Token hashing (consistency, security)
- Token verification (valid/invalid cases)
- Expiration calculation
- IP extraction
- User agent extraction

**Auth Tests** (`server/auth.logout.test.ts`)
- Session cookie clearing
- Logout functionality

Run tests with:
```bash
pnpm test
```

## Environment Variables

The following environment variables are required:

```env
DATABASE_URL=mysql://user:password@host/database
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_EMAIL=owner@example.com
VITE_FRONTEND_URL=https://approval.service
```

## Deployment

### Build

```bash
pnpm build
```

### Start

```bash
pnpm start
```

### Development

```bash
pnpm dev
```

## Future Enhancements

1. **Email Service Integration**
   - Replace console logging with SendGrid/Mailgun
   - Add email templates
   - Support HTML and plain text

2. **Advanced Filtering**
   - Filter deals by status, date range, client
   - Search functionality
   - Export audit logs

3. **Webhook Management UI**
   - Configure webhooks per deal
   - Test webhook delivery
   - View webhook logs

4. **Bulk Operations**
   - Bulk create deals from CSV
   - Bulk export audit trails
   - Batch status updates

5. **Analytics**
   - Approval rate metrics
   - Average approval time
   - Rejection reasons

6. **Role-Based Access**
   - Admin users
   - Read-only access
   - Team management

## Security Considerations

1. **Token Storage**: Never log or display raw tokens after generation
2. **HTTPS Only**: Always use HTTPS in production
3. **CORS**: Configure CORS appropriately for webhook endpoints
4. **Rate Limiting**: Implement rate limiting on approval endpoints
5. **Input Validation**: All inputs validated with Zod schemas
6. **SQL Injection**: Protected by Drizzle ORM parameterized queries
7. **XSS Protection**: React automatically escapes JSX content

## Support

For issues or questions, refer to the implementation details in this document or contact the development team.
