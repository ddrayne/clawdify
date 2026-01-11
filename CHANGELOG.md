# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-11

### Added

#### Core Functionality
- VPS-aware OAuth 2.0 authentication with PKCE flow
- Automatic token refresh with 5-minute buffer
- 15 Spotify Web API script commands:
  - **Playback Control**: play, pause, next, previous, current
  - **Playback Settings**: volume, shuffle, repeat
  - **Queue Management**: queue-add
  - **Device Control**: devices, transfer
  - **Search & Discovery**: search, recommendations
  - **Library Management**: library-tracks, playlists

#### Build System
- TypeScript compilation with type declarations
- ESM module support (ES2022)
- Source maps for debugging
- Strict TypeScript configuration

#### Testing
- 28 automated tests across 3 test suites
- OAuth environment detection tests
- API client functionality tests
- Integration tests for project structure

#### Documentation
- Complete README.md with installation and usage
- SKILL.md with Clawdbot skill documentation
- INTEGRATION.md with detailed integration guide
- Example Clawdbot command implementation
- Examples directory with integration patterns

#### Development Tools
- NPM scripts for build, test, lint, format
- Watch mode for development
- Clean script for build artifacts
- Pre-publish build hook

#### Project Files
- MIT License
- Package configuration with proper metadata
- .gitignore for version control
- .npmignore for publishing
- TypeScript configuration

### Technical Details

#### OAuth Implementation
- Local callback server mode for desktop environments
- Manual URL paste mode for VPS/SSH/headless environments
- WSL and WSL2 detection
- Container environment detection (Codespaces, Remote Containers)
- PKCE (Proof Key for Code Exchange) for enhanced security

#### API Client
- Shared library for all scripts (scripts/lib/spotify-api.mjs)
- Credential loading from auth-profiles.json
- Automatic token refresh
- Comprehensive error handling
- Support for all HTTP methods

#### Script Architecture
- Standalone executable scripts
- Consistent error reporting
- JSON output for programmatic use
- Human-readable formatted output

### Dependencies

#### Production
- No runtime dependencies (uses Node.js built-ins)

#### Development
- TypeScript 5.3.3
- @types/node 20.11.0
- ESLint 8.56.0
- Prettier 3.2.4

### Requirements
- Node.js >= 18.0.0
- Spotify Premium account (for playback control)
- Spotify Developer App with OAuth credentials

### Files Structure
```
clawdify/
├── dist/                      # Compiled TypeScript code
│   ├── spotify-oauth.js       # OAuth module
│   └── spotify-oauth.d.ts     # Type declarations
├── src/
│   └── spotify-oauth.ts       # OAuth source code
├── scripts/
│   ├── lib/
│   │   └── spotify-api.mjs    # Shared API client
│   └── [15 command scripts]   # Individual Spotify commands
├── tests/
│   ├── oauth.test.mjs         # OAuth tests
│   ├── api-client.test.mjs    # API client tests
│   └── integration.test.mjs   # Integration tests
├── examples/
│   ├── clawdbot-command.example.ts  # Example command
│   └── README.md              # Integration examples
├── README.md                  # Project documentation
├── SKILL.md                   # Skill documentation
├── INTEGRATION.md             # Integration guide
├── LICENSE                    # MIT License
├── package.json               # NPM configuration
├── tsconfig.json              # TypeScript config
├── .gitignore                 # Git ignore rules
└── .npmignore                 # NPM ignore rules
```

### Integration Support
- Clawdbot skill format compatibility
- VPS-aware authentication flow
- Environment variable configuration
- Config file support (config.json5)
- Auth profiles storage (auth-profiles.json)

### Known Limitations
- Playback control requires Spotify Premium
- Reading queue contents not supported by Spotify API
- Rate limiting per Spotify's API policies
- Active device required for playback operations

### Future Considerations
- Additional playlist management operations
- Podcast support
- User profile management
- Recently played tracks
- Top tracks/artists
- Following/unfollowing operations

[1.0.0]: https://github.com/yourusername/clawdify/releases/tag/v1.0.0
