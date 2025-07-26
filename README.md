# Rodeo Device-Based Authentication System

A production-ready, passwordless authentication system for Next.js 14 applications using device-based ECDSA P-256 cryptographic keys. No personal information required - authentication is purely device-based.

## 🚀 Features

- **Passwordless Authentication**: No passwords, emails, or phone numbers required
- **Device-Based Security**: Each device generates a unique ECDSA P-256 key pair
- **WebCrypto API**: Leverages browser's native cryptographic capabilities
- **Secure Session Management**: HTTP-only cookies with HMAC signatures
- **Rate Limiting**: Built-in protection against brute force attacks
- **MongoDB Integration**: Scalable data persistence with TTL indexes
- **TypeScript**: Full type safety throughout the application
- **Comprehensive Testing**: Unit tests and E2E tests included

## 🏗️ Architecture

### Authentication Flow

1. **First Visit**: Client generates ECDSA P-256 key pair using WebCrypto API
2. **Registration**: Client sends public key JWK to server, receives deviceId
3. **Challenge**: Server generates a cryptographic challenge (nonce)
4. **Verification**: Client signs challenge with private key, server verifies signature
5. **Session**: Server creates secure session and sets HTTP-only cookie

### Database Schema

- **Device**: Stores public keys, status, and metadata
- **Session**: Manages active sessions with TTL expiration
- **Challenge**: Short-lived authentication challenges (2-minute expiry)

## 🛠️ Setup

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for local MongoDB)
- MongoDB instance (local or cloud)

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd rodeo_v1
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# MongoDB Connection
MONGODB_URI=mongodb://rodeo_user:rodeo_password@localhost:27017/rodeo

# Session Security (generate with: openssl rand -hex 32)
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Environment
NODE_ENV=development
```

3. **Start MongoDB with Docker**:
```bash
docker-compose up -d mongodb
```

Wait for MongoDB to be healthy:
```bash
docker-compose ps
```

4. **Start the development server**:
```bash
npm run dev
```

5. **Access the application**:
- App: http://localhost:3000
- MongoDB Admin: http://localhost:8081 (admin/admin123)

## 🧪 Testing

### Unit Tests
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### E2E Tests
```bash
npm run test:e2e        # Playwright tests
```

### Manual Testing Flow

1. Visit http://localhost:3000
2. Click "Continue on this device"
3. Verify authentication succeeds
4. Visit /settings to see device information
5. Test "Reset This Device" functionality

## 📡 API Reference

### Device Registration
```http
POST /api/device/register
Content-Type: application/json

{
  "publicKeyJwk": {
    "kty": "EC",
    "crv": "P-256",
    "x": "...",
    "y": "...",
    "use": "sig"
  }
}
```

### Authentication Challenge
```http
POST /api/auth/challenge
Content-Type: application/json

{
  "deviceId": "string"
}
```

### Challenge Verification
```http
POST /api/auth/verify
Content-Type: application/json

{
  "deviceId": "string",
  "challengeId": "string", 
  "signature": "base64url-encoded-signature"
}
```

### Session Management
```http
POST /api/auth/refresh    # Extend session
POST /api/auth/logout     # Revoke session
GET  /api/me             # Check auth status
```

## 🔒 Security Features

### Cryptographic Security
- **ECDSA P-256**: Industry-standard elliptic curve cryptography
- **JWK Thumbprints**: RFC 7638 compliant key deduplication
- **Challenge-Response**: Prevents replay attacks with single-use nonces
- **Signature Verification**: Server-side ECDSA signature validation

### Session Security
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Secure Cookies**: HTTPS-only in production
- **SameSite=Lax**: CSRF protection
- **HMAC Signatures**: Prevents cookie tampering
- **15-minute TTL**: Short session lifetime with refresh capability

### Rate Limiting
- **10 requests/minute** per IP for auth endpoints
- **5 failed attempts** triggers device lock
- **423 Locked** status for locked devices

### Data Protection
- **Private keys never leave device**: Stored in IndexedDB
- **No PII collection**: Only technical metadata
- **TTL indexes**: Automatic cleanup of expired data

## 🏭 Production Deployment

### Environment Setup
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rodeo
SESSION_SECRET=<64-character-hex-string>
```

### Security Checklist
- [ ] Generate cryptographically secure SESSION_SECRET
- [ ] Use MongoDB Atlas or secured MongoDB instance
- [ ] Enable HTTPS (cookies automatically become Secure)
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting with Redis/external store
- [ ] Set up monitoring and alerting
- [ ] Regular security audits

## 🚨 Troubleshooting

### Common Issues

**Authentication fails with "No private key found"**
- Clear browser data and try again
- Check browser console for IndexedDB errors
- Verify WebCrypto API support

**Database connection errors**
- Ensure MongoDB is running: `docker-compose ps`
- Check MONGODB_URI in .env.local
- Verify database credentials

**Session issues**
- Check SESSION_SECRET is set
- Clear cookies and retry
- Verify middleware configuration

**Rate limiting errors**
- Wait for rate limit window to reset
- Check IP addressing in development
- Clear rate limit cache (restart server)

## 🔧 Development

### Scripts

- `npm run dev` – start the dev server
- `npm run lint` – ESLint checks
- `npm run typecheck` – TypeScript type checking
- `npm run build` – production build
- `npm test` – run unit tests
- `npm run test:e2e` – run Playwright E2E tests

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── device/        # Device management
│   ├── auth/              # Auth UI page
│   └── settings/          # Settings with device management
├── components/            # React components
│   └── auth/              # Authentication components
├── lib/                   # Utilities and models
│   ├── client/            # Client-side utilities
│   ├── models/            # MongoDB models
│   ├── crypto.ts          # Cryptographic utilities
│   └── mongodb.ts         # Database connection
└── middleware.ts          # Next.js middleware
```

### Routes

- `/` – Home (with authentication)
- `/auth` – Authentication page
- `/scores`
- `/schedule`
- `/competitors`
- `/replays`
- `/map`  
- `/shop`
- `/settings` – Device settings and management

### Global State

The Zustand store is defined in `src/lib/state/useAppStore.ts` and exposes `currentEvent` and `userSession`.

The authentication state is managed by the `AuthProvider` component in `src/components/auth/AuthProvider.tsx`.

## 📄 Threat Model

### Assumptions
- Device storage (IndexedDB) is trusted
- Network communication uses HTTPS in production
- Server infrastructure is secured
- Users understand device-based authentication

### Protections
- **Private key compromise**: Keys are device-bound and non-exportable
- **Session hijacking**: HTTP-only, signed cookies with short TTL
- **Replay attacks**: Single-use challenges with 2-minute expiry
- **Brute force**: Rate limiting and device locking
- **CSRF**: SameSite cookie policy

### Recovery Options
- **Device loss**: No built-in recovery (by design)
- **Optional**: 12-word recovery phrase implementation available
- **Admin recovery**: Device reset via backend API (if implemented)

---

**⚠️ Important**: This is a production-ready implementation, but ensure proper security review and testing before deploying to production environments.
