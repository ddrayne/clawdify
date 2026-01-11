# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clawdify is a Spotify Web API skill for Clawdbot. It provides OAuth 2.0 authentication and 15 executable scripts for controlling Spotify playback, managing libraries, searching music, and more.

**Key architectural components:**
- **TypeScript OAuth module** (`src/spotify-oauth.ts`) - Compiled to `dist/` for use by Clawdbot
- **Shared API client library** (`scripts/lib/spotify-api.mjs`) - Used by all 15 scripts
- **Standalone executable scripts** (`scripts/*.mjs`) - Direct invocation via Node.js

## Development Commands

### Build & Test
```bash
npm run build              # Compile TypeScript to dist/
npm run build:watch        # Watch mode for development
npm run clean              # Remove dist/ directory
npm test                   # Run all tests (28 tests)
npm run test:watch         # Watch mode for tests
```

### Code Quality
```bash
npm run lint               # Run ESLint
npm run format             # Format with Prettier
npm run format:check       # Check formatting without changes
```

### Testing Individual Components
```bash
# Run single test file
node --test tests/oauth.test.mjs

# Test a specific script (requires valid auth)
export SPOTIFY_CLIENT_ID="..."
export SPOTIFY_CLIENT_SECRET="..."
node scripts/current.mjs
```

## Architecture

### Two-Layer Design

**Layer 1: TypeScript OAuth Module**
- Source: `src/spotify-oauth.ts`
- Output: `dist/spotify-oauth.js` + type declarations
- Purpose: VPS-aware OAuth 2.0 with PKCE for initial authentication
- Exports: `loginSpotifyVpsAware()`, `loginSpotifyLocal()`, `loginSpotifyManual()`

**Layer 2: JavaScript API Scripts**
- Library: `scripts/lib/spotify-api.mjs`
- Scripts: 15 `.mjs` files in `scripts/`
- Purpose: Executable commands that use authenticated API client

### Authentication Flow

1. OAuth module authenticates user, saves to `~/.clawdbot/auth-profiles.json`
2. API library loads credentials from auth-profiles.json
3. API library auto-refreshes tokens (5-minute buffer before expiry)
4. Scripts call `spotifyRequest()` from library for authenticated requests

**Critical:** Scripts depend on profile ID `spotify:default` in auth-profiles.json.

### VPS Detection Logic

The OAuth module auto-detects environment type in `src/spotify-oauth.ts`:
- **Local**: Uses callback server on `localhost:8888`
- **Remote/VPS/SSH**: Shows URL, prompts user to paste callback URL manually
- Detection checks: SSH env vars, containers (Codespaces), WSL, headless Linux

### Token Management

`scripts/lib/spotify-api.mjs` handles token lifecycle:
- Loads from `~/.clawdbot/auth-profiles.json`
- Checks expiry with 5-minute buffer
- Refreshes automatically using client credentials from env vars
- Saves updated tokens back to auth-profiles.json

## TypeScript Strictness

The project uses strict TypeScript with `noPropertyAccessFromIndexSignature` enabled. When accessing `process.env`:

```typescript
// ✓ Correct
process.env["SPOTIFY_CLIENT_ID"]

// ✗ Wrong
process.env.SPOTIFY_CLIENT_ID
```

This applies to all environment variable access in TypeScript files.

## Adding New Scripts

1. Create new `.mjs` file in `scripts/`
2. Import shared library:
   ```javascript
   import { spotifyRequest } from './lib/spotify-api.mjs';
   ```
3. Make authenticated requests:
   ```javascript
   const data = await spotifyRequest('/me/endpoint');
   ```
4. Handle errors and exit codes:
   ```javascript
   try {
     // API logic
   } catch (err) {
     console.error(`Error: ${err.message}`);
     process.exit(1);
   }
   ```

Scripts should:
- Start with `#!/usr/bin/env node` shebang
- Exit with code 0 on success, 1 on error
- Print errors to stderr
- Print results to stdout

## Integration with Clawdbot

The skill expects to be installed at `~/.clawdbot/skills/clawdify/`.

**Configuration sources** (in priority order):
1. Environment variables: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
2. Config file: `~/.clawdbot/config.json5` at `skills.clawdify.clientId/clientSecret`

**Auth storage:**
- Credentials stored in `~/.clawdbot/auth-profiles.json`
- Profile ID must be `spotify:default`
- Format:
  ```json
  {
    "version": 1,
    "profiles": {
      "spotify:default": {
        "type": "oauth",
        "provider": "spotify",
        "access": "...",
        "refresh": "...",
        "expires": 1234567890000,
        "email": "user@example.com"
      }
    }
  }
  ```

## Script Execution Pattern

All scripts follow this pattern:
1. Import `spotifyRequest` from `lib/spotify-api.mjs`
2. Call Spotify Web API endpoint
3. Process response
4. Print formatted output
5. Exit with appropriate code

Scripts are standalone - they can be executed directly:
```bash
node scripts/play.mjs spotify:track:6rqhFgbbKwnb9MLmUQDhG6
```

## API Client Library Details

`scripts/lib/spotify-api.mjs` provides:
- `loadCredentials()` - Read from auth-profiles.json
- `saveCredentials(updated)` - Write to auth-profiles.json
- `getClientCredentials()` - Read from environment variables
- `refreshTokenIfNeeded(creds, id, secret)` - Token refresh logic
- `spotifyRequest(endpoint, options)` - Main API request function

The `spotifyRequest()` function:
- Auto-loads credentials
- Auto-refreshes tokens if needed
- Handles relative/absolute URLs
- Returns parsed JSON or null for 204 responses
- Throws descriptive errors with status codes

## Spotify Web API Specifics

**Premium vs Free:**
- Playback control (play, pause, volume, etc.) requires Spotify Premium
- Search and library operations work with free accounts

**Active Device Requirement:**
- Playback APIs require an active device (phone, desktop, web player)
- Use `scripts/devices.mjs` to list available devices

**Spotify URIs:**
- Format: `spotify:track:xxx`, `spotify:artist:xxx`, `spotify:album:xxx`
- Obtainable via Spotify app: Right-click → Share → Copy Spotify URI

## Testing Notes

Tests use Node.js built-in test runner (no external frameworks).

**Test structure:**
- `tests/oauth.test.mjs` - OAuth environment detection, PKCE
- `tests/api-client.test.mjs` - API client functions, credentials
- `tests/integration.test.mjs` - Project structure, build artifacts

Tests run without Spotify credentials - they test module structure, not live API calls.

## Build Process

TypeScript compilation (`npm run build`):
1. Compiles `src/**/*.ts` to `dist/`
2. Generates `.d.ts` type declarations
3. Creates source maps
4. ES2022 output (ESM modules)

The dist/ directory is gitignored but included in npm publish.

## Common Gotchas

1. **Scripts need auth first**: Run OAuth flow before testing scripts
2. **Bracket notation for env vars**: Required in TypeScript due to strict mode
3. **5-minute token buffer**: Prevents race conditions with token expiry
4. **Profile ID is hardcoded**: Scripts expect `spotify:default` profile
5. **No runtime dependencies**: Project uses only Node.js built-ins

## Documentation Files

- `README.md` - General setup and overview
- `SKILL.md` - Clawdbot skill format documentation
- `INTEGRATION.md` - Detailed integration guide for Clawdbot
- `CHANGELOG.md` - Version history
- `PROJECT_STATUS.md` - Completion checklist
- `examples/` - Integration code examples
