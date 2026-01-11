---
name: clawdify
description: Control Spotify playback, manage library, search music, and interact with playlists via Spotify Web API.
homepage: https://developer.spotify.com/documentation/web-api
metadata: {"clawdbot":{"emoji":"🎵","requires":{"bins":["node"],"config":["skills.clawdify.clientId","skills.clawdify.clientSecret"]},"primaryEnv":null,"install":[{"id":"node-brew","kind":"brew","formula":"node","bins":["node"],"label":"Install Node.js (brew)"}]}}
---

# Clawdify

Control Spotify playback, manage your library, search for music, and interact with playlists using the Spotify Web API.

## Prerequisites

1. **Spotify Premium account** - Required for playback control features
2. **Spotify Developer App**:
   - Create app at https://developer.spotify.com/dashboard
   - Set redirect URI: `http://localhost:8888/callback`
   - Copy Client ID and Client Secret

## Setup

### 1. Configure Credentials

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

### 2. Authenticate

**OAuth implementation is complete.** To integrate into Clawdbot:

1. Use the compiled OAuth module: `dist/spotify-oauth.js`
2. See `examples/clawdbot-command.example.ts` for a complete command implementation
3. See `INTEGRATION.md` for detailed integration instructions

Once integrated and run, the OAuth flow will:
- Open authorization URL in your browser (or show URL for VPS/SSH)
- Request necessary permissions
- Save OAuth tokens to `~/.clawdbot/auth-profiles.json`
- Auto-refresh tokens when expired (5-minute buffer)

## Playback Control

### Currently Playing

```bash
node {baseDir}/scripts/current.mjs
```

Shows: track name, artist, album, progress, device, playback state

### Play/Pause

```bash
node {baseDir}/scripts/play.mjs                    # Resume playback
node {baseDir}/scripts/play.mjs spotify:track:xxx  # Play specific track
node {baseDir}/scripts/pause.mjs                   # Pause
```

### Skip Tracks

```bash
node {baseDir}/scripts/next.mjs                    # Next track
node {baseDir}/scripts/previous.mjs                # Previous track
```

### Playback Settings

```bash
node {baseDir}/scripts/volume.mjs 50               # Set volume (0-100)
node {baseDir}/scripts/shuffle.mjs on              # Enable shuffle
node {baseDir}/scripts/shuffle.mjs off             # Disable shuffle
node {baseDir}/scripts/shuffle.mjs toggle          # Toggle shuffle
node {baseDir}/scripts/repeat.mjs track            # Repeat current track
node {baseDir}/scripts/repeat.mjs context          # Repeat playlist/album
node {baseDir}/scripts/repeat.mjs off              # Turn off repeat
```

## Queue

```bash
node {baseDir}/scripts/queue-add.mjs spotify:track:xxx  # Add to queue
```

Note: Reading queue contents is not supported by Spotify API

## Devices

```bash
node {baseDir}/scripts/devices.mjs                      # List devices
node {baseDir}/scripts/transfer.mjs <device_id>         # Transfer playback
node {baseDir}/scripts/transfer.mjs <device_id> --play  # Transfer and play
```

## Search & Discovery

### Search

```bash
node {baseDir}/scripts/search.mjs "query"
node {baseDir}/scripts/search.mjs "query" -t artist
node {baseDir}/scripts/search.mjs "query" -t album -n 20
node {baseDir}/scripts/search.mjs "query" -t playlist
```

Types: `track` (default), `album`, `artist`, `playlist`

### Recommendations

```bash
node {baseDir}/scripts/recommendations.mjs --seed-tracks spotify:track:xxx,spotify:track:yyy
node {baseDir}/scripts/recommendations.mjs --seed-artists spotify:artist:xxx --limit 20
```

## Library

### Saved Tracks

```bash
node {baseDir}/scripts/library-tracks.mjs list
node {baseDir}/scripts/library-tracks.mjs add spotify:track:xxx
node {baseDir}/scripts/library-tracks.mjs remove spotify:track:xxx
```

### Playlists

```bash
node {baseDir}/scripts/playlists.mjs               # List your playlists
```

## Getting Spotify URIs

Right-click any item in Spotify:
- Share → Copy Spotify URI
- Format: `spotify:track:xxx`, `spotify:artist:xxx`, `spotify:album:xxx`, etc.

## Notes

- **Playback control requires Spotify Premium**
- You must have an active device (open Spotify somewhere)
- Tokens auto-refresh; re-authenticate if issues persist
- Search and library features work with free accounts

## Troubleshooting

### "No active device found"

Open Spotify on any device (phone, desktop, web player at https://open.spotify.com)

### "This feature requires Spotify Premium"

Playback control APIs only work with Premium accounts. Search and library features work with free accounts.

### "Token expired" or auth errors

Re-run the OAuth flow to re-authenticate.

### Rate limiting

Wait a few seconds between rapid API calls. Spotify has rate limits per app/user.

## API Reference

For advanced usage, the agent can make direct API calls to any Spotify Web API endpoint using the shared library:

```javascript
import { spotifyRequest } from './lib/spotify-api.mjs';

// GET request
const data = await spotifyRequest('/me/player/currently-playing');

// POST request
await spotifyRequest('/me/player/play', {
  method: 'PUT',
  body: JSON.stringify({ uris: ['spotify:track:xxx'] })
});
```

See full API documentation at: https://developer.spotify.com/documentation/web-api/reference
