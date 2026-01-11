# Clawdify - Spotify Web API Skill for Clawdbot

A comprehensive clawdbot skill that integrates with the Spotify Web API, enabling agentic control of playback, queue management, library operations, and music discovery.

## Overview

This skill provides:
- **OAuth 2.0 Authentication** - VPS-aware flow with automatic token refresh
- **Playback Control** - Play, pause, skip, volume, shuffle, repeat
- **Queue Management** - Add tracks to queue
- **Device Control** - List devices, transfer playback
- **Search & Discovery** - Search catalog, get recommendations
- **Library Management** - Save/remove tracks, view playlists

## Project Structure

```
clawd-spotify/
├── README.md                         # This file
├── SKILL.md                          # Clawdbot skill documentation
├── src/
│   └── spotify-oauth.ts              # OAuth authentication implementation
└── scripts/
    ├── lib/
    │   └── spotify-api.mjs           # Core API client library
    ├── current.mjs                   # Show currently playing track
    ├── play.mjs                      # Start/resume playback
    ├── pause.mjs                     # Pause playback
    ├── next.mjs                      # Skip to next track
    ├── previous.mjs                  # Go to previous track
    ├── volume.mjs                    # Set volume (0-100)
    ├── shuffle.mjs                   # Toggle shuffle mode
    ├── repeat.mjs                    # Set repeat mode
    ├── queue-add.mjs                 # Add track to queue
    ├── devices.mjs                   # List available devices
    ├── transfer.mjs                  # Transfer playback to device
    ├── search.mjs                    # Search Spotify catalog
    ├── library-tracks.mjs            # Manage saved tracks
    ├── playlists.mjs                 # List user playlists
    └── recommendations.mjs           # Get track recommendations
```

## Installation

### 1. Create Spotify Developer App

1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Set redirect URI to: `http://localhost:8888/callback`
4. Copy your Client ID and Client Secret

### 2. Install to Clawdbot

**Option A: Copy to clawdbot skills directory**

```bash
# Copy the skill to clawdbot's skills directory
cp -r . /path/to/clawdbot/skills/clawdify/

# Copy OAuth command to clawdbot commands
cp src/spotify-oauth.ts /path/to/clawdbot/src/commands/
```

**Option B: Symlink (for development)**

```bash
# Create symlink to skills directory
ln -s $(pwd) /path/to/clawdbot/skills/clawdify

# Create symlink for OAuth command
ln -s $(pwd)/src/spotify-oauth.ts /path/to/clawdbot/src/commands/spotify-oauth.ts
```

### 3. Configure Credentials

Add to your clawdbot config (`~/.clawdbot/config.json5`):

```json5
{
  skills: {
    clawdify: {
      clientId: "your-client-id-here",
      clientSecret: "your-client-secret-here"
    }
  }
}
```

Or set environment variables:

```bash
export SPOTIFY_CLIENT_ID="your-client-id-here"
export SPOTIFY_CLIENT_SECRET="your-client-secret-here"
```

### 4. Authenticate

**OAuth implementation is complete and ready to use.**

To integrate the OAuth command into your Clawdbot installation:

1. **See the complete example**: `examples/clawdbot-command.example.ts`
2. **Read the integration guide**: `INTEGRATION.md` has detailed instructions
3. **Register the command** in your Clawdbot's command system
4. **Run authentication**: `clawdbot auth-spotify` (or your chosen command name)

The OAuth module (`dist/spotify-oauth.js`) provides:
- `loginSpotifyVpsAware()` - Auto-detects local vs VPS/SSH environment
- `loginSpotifyLocal()` - Local callback server on localhost:8888
- `loginSpotifyManual()` - Manual URL paste for remote environments

Once integrated, the OAuth flow will:
- Open authorization URL in your browser (or show URL for VPS/SSH)
- Request necessary Spotify permissions
- Save OAuth tokens to `~/.clawdbot/auth-profiles.json`
- Auto-refresh tokens when expired (5-minute buffer)

## Usage

See `SKILL.md` for complete documentation of all available commands.

### Quick Examples

```bash
# Show currently playing track
node scripts/current.mjs

# Play a specific track
node scripts/play.mjs spotify:track:6rqhFgbbKwnb9MLmUQDhG6

# Search for music
node scripts/search.mjs "Bohemian Rhapsody"

# Add to library
node scripts/library-tracks.mjs add spotify:track:6rqhFgbbKwnb9MLmUQDhG6

# List available devices
node scripts/devices.mjs
```

## Requirements

- **Node.js** - For running the scripts
- **Spotify Premium** - Required for playback control features
- **Active Spotify device** - Must have Spotify open somewhere (phone, desktop, web player)

## Integration Notes

### OAuth Command Integration

**The OAuth implementation is complete.** The compiled module (`dist/spotify-oauth.js`) exports:

- `loginSpotifyVpsAware()` - Main entry point, auto-detects environment
- `loginSpotifyLocal()` - Local callback server mode
- `loginSpotifyManual()` - Manual URL paste mode for VPS/SSH

**To integrate into Clawdbot:**
1. See `examples/clawdbot-command.example.ts` for a complete, ready-to-use command implementation
2. Copy/adapt the example to your Clawdbot's command system
3. The command should:
   - Get client credentials from config or environment
   - Call `loginSpotifyVpsAware()` to run OAuth flow
   - Store credentials in `auth-profiles.json` with profile ID `spotify:default`
4. See `INTEGRATION.md` for detailed integration patterns and examples

### Auth Profiles Storage

Credentials are stored in `~/.clawdbot/auth-profiles.json`:

```json
{
  "version": 1,
  "profiles": {
    "spotify:default": {
      "type": "oauth",
      "provider": "spotify",
      "access": "BQD...",
      "refresh": "AQD...",
      "expires": 1704931200000,
      "email": "user@example.com"
    }
  }
}
```

### Script Library

All scripts use the shared `lib/spotify-api.mjs` library which handles:
- Loading credentials from auth-profiles.json
- Automatic token refresh (5-minute buffer)
- Authenticated API requests
- Error handling

## Development

### Testing Scripts

Each script can be tested independently:

```bash
# Set environment variables
export SPOTIFY_CLIENT_ID="your-client-id"
export SPOTIFY_CLIENT_SECRET="your-client-secret"

# Run a script
node scripts/current.mjs
```

### Adding New Scripts

1. Import the shared library:
   ```javascript
   import { spotifyRequest } from './lib/spotify-api.mjs';
   ```

2. Make API calls:
   ```javascript
   const data = await spotifyRequest('/me/player');
   ```

3. Handle errors gracefully:
   ```javascript
   try {
     // API call
   } catch (err) {
     console.error(`Error: ${err.message}`);
     process.exit(1);
   }
   ```

## Troubleshooting

See the troubleshooting section in `SKILL.md` for common issues and solutions.

## License

This skill is part of the clawdbot ecosystem.

## References

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Authorization Guide](https://developer.spotify.com/documentation/web-api/concepts/authorization)
- [API Reference](https://developer.spotify.com/documentation/web-api/reference)
