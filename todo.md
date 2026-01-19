# Approval Service MVP - Project TODO

## Database & Schema
- [x] Create DealSnapshot table with all required fields
- [x] Create ApprovalToken table with hash-based storage
- [x] Create ApprovalEvent table for audit trail
- [x] Create WebhookConfig table for external integrations
- [x] Generate and apply Drizzle migrations

## Core API Endpoints
- [x] POST /api/deals - Create deal snapshot and generate approval token
- [x] GET /api/deals - List all deals (admin only)
- [x] GET /api/deals/[id] - Get deal details (admin only)
- [x] GET /api/approve/[token] - Retrieve deal data for public page
- [x] POST /api/approve/[token]/confirm - Validate token and record approval
- [x] GET /api/audit-trail/[dealId] - Get approval events for a deal

## Public Approval Page
- [x] Build /approve/[token] page component
- [x] Display deal details (client name, currency, total, items)
- [x] Implement confirmation checkbox and submit button
- [x] Add token validation and expiration handling
- [x] Show error states for invalid/expired tokens

## Admin Dashboard
- [x] Create admin layout with navigation
- [x] Build deals list view with status indicators
- [x] Implement deal detail view with full audit trail
- [x] Add deal creation form
- [ ] Add webhook configuration panel
- [ ] Implement status filtering and search

## Security & Token Management
- [x] Implement 32+ byte random token generation
- [x] Hash tokens before database storage
- [x] Implement single-use token validation
- [x] Add 14-day expiration logic
- [x] Implement token invalidation after use
- [x] Add IP and user-agent capture

## Email Notifications
- [x] Send email when approval link is generated
- [x] Send email to owner when deal is approved
- [x] Send email to owner when deal is rejected
- [x] Configure email templates

## Webhook Integration
- [x] Create webhook configuration storage
- [x] Implement webhook firing on deal status changes
- [x] Add retry logic for failed webhooks
- [x] Add webhook event logging

## Testing
- [x] Write vitest for token generation and hashing
- [x] Write vitest for deal creation endpoint
- [x] Write vitest for approval confirmation flow
- [x] Write vitest for token expiration
- [x] Write vitest for audit trail recording
- [x] Write vitest for webhook integration

## UI/UX Polish
- [x] Implement elegant styling throughout
- [x] Add loading states and animations
- [x] Implement error handling and user feedback
- [x] Add responsive design for mobile
- [x] Create empty states for lists

## Deployment & Documentation
- [x] Document API endpoints
- [x] Create deployment guide
- [x] Add environment variable documentation
