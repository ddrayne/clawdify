# Clawdbot Integration Guide

This document provides detailed integration examples for incorporating the Clawdify skill into Clawdbot.

## Installation

### 1. Install the Skill

Copy or symlink the skill to Clawdbot's skills directory:

```bash
# Option A: Copy
cp -r /path/to/clawdify ~/.clawdbot/skills/clawdify

# Option B: Symlink (for development)
ln -s /path/to/clawdify ~/.clawdbot/skills/clawdify
```

### 2. Configure Credentials

Add to `~/.clawdbot/config.json5`:

```json5
{
  skills: {
    clawdify: {
      clientId: "your-spotify-client-id",
      clientSecret: "your-spotify-client-secret"
    }
  }
}
```

Or use environment variables:

```bash
export SPOTIFY_CLIENT_ID="your-client-id"
export SPOTIFY_CLIENT_SECRET="your-client-secret"
```

## OAuth Integration

### Command Registration

The OAuth command should be registered in Clawdbot's command system. Here's an example integration:

**In Clawdbot's command loader (`src/commands/index.ts` or similar):**

```typescript
import { loginSpotifyVpsAware, SpotifyOAuthCredentials } from "./spotify-oauth.js";
import { loadConfig } from "../config.js";
import { saveAuthProfile } from "../auth-profiles.js";

/**
 * Register the Spotify OAuth command
 */
export async function registerSpotifyAuthCommand() {
  return {
    name: "auth-spotify",
    description: "Authenticate with Spotify Web API",
    async execute() {
      const config = loadConfig();
      const clientId = config.skills?.clawdify?.clientId || process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = config.skills?.clawdify?.clientSecret || process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.error("Error: Spotify credentials not configured.");
        console.error("Add them to config.json5 or set environment variables:");
        console.error("  SPOTIFY_CLIENT_ID");
        console.error("  SPOTIFY_CLIENT_SECRET");
        process.exit(1);
      }

      console.log("Starting Spotify authentication...\n");

      const credentials = await loginSpotifyVpsAware(
        clientId,
        clientSecret,
        async (url: string) => {
          console.log("Open this URL in your browser:");
          console.log(url);
          console.log();
        },
        (message: string) => {
          console.log(message);
        }
      );

      if (credentials) {
        // Save to auth-profiles.json
        saveAuthProfile("spotify:default", {
          type: "oauth",
          provider: "spotify",
          ...credentials,
        });

        console.log("\n✓ Successfully authenticated with Spotify!");
        if (credentials.email) {
          console.log(`  Account: ${credentials.email}`);
        }
        if (credentials.displayName) {
          console.log(`  Display name: ${credentials.displayName}`);
        }
      } else {
        console.error("\n✗ Authentication failed");
        process.exit(1);
      }
    },
  };
}
```

### Example Usage

```bash
# Authenticate with Spotify
clawdbot auth-spotify

# Or using the compiled command directly
node ~/.clawdbot/skills/clawdify/dist/spotify-oauth.js
```

## Skill Usage Examples

### In Clawdbot Conversations

Once authenticated, the agent can invoke Spotify commands:

**Example 1: Check currently playing track**

```
User: What's playing on Spotify?
Agent: Let me check...
[Executes: node {skillDir}/scripts/current.mjs]
Agent: You're listening to "Bohemian Rhapsody" by Queen from the album "A Night at the Opera"
```

**Example 2: Control playback**

```
User: Skip to the next track
Agent: [Executes: node {skillDir}/scripts/next.mjs]
Agent: Skipped to next track

User: Turn the volume down to 30%
Agent: [Executes: node {skillDir}/scripts/volume.mjs 30]
Agent: Volume set to 30%
```

**Example 3: Search and play**

```
User: Play "Stairway to Heaven"
Agent: Let me search for that...
[Executes: node {skillDir}/scripts/search.mjs "Stairway to Heaven" -t track -n 1]
Agent: Found the track! Playing now...
[Executes: node {skillDir}/scripts/play.mjs spotify:track:5CQ30WqJwcep0pYcV4AMNc]
```

**Example 4: Queue management**

```
User: Add "Hotel California" to my queue
Agent: [Executes: node {skillDir}/scripts/search.mjs "Hotel California" -t track -n 1]
[Executes: node {skillDir}/scripts/queue-add.mjs spotify:track:40riOy7x9W7GXjyGp4pjAv]
Agent: Added "Hotel California" by Eagles to your queue
```

**Example 5: Device management**

```
User: What Spotify devices are available?
Agent: [Executes: node {skillDir}/scripts/devices.mjs]
Agent: Available devices:
  • iPhone (active)
  • Desktop Speaker
  • Living Room TV

User: Switch to Desktop Speaker
Agent: [Executes: node {skillDir}/scripts/transfer.mjs <device-id> --play]
Agent: Transferred playback to Desktop Speaker
```

**Example 6: Library management**

```
User: Save this song to my library
Agent: [Executes: node {skillDir}/scripts/current.mjs]
[Executes: node {skillDir}/scripts/library-tracks.mjs add <track-uri>]
Agent: Saved "Song Title" to your library

User: Show me my playlists
Agent: [Executes: node {skillDir}/scripts/playlists.mjs]
Agent: Your playlists:
  • Chill Vibes (142 tracks)
  • Workout Mix (87 tracks)
  • Road Trip (215 tracks)
```

## Script Invocation Patterns

### Direct Script Execution

All scripts can be executed directly:

```bash
# Current playback status
node ~/.clawdbot/skills/clawdify/scripts/current.mjs

# Play specific track
node ~/.clawdbot/skills/clawdify/scripts/play.mjs spotify:track:xxx

# Search for music
node ~/.clawdbot/skills/clawdify/scripts/search.mjs "query" -t track -n 10
```

### From Clawdbot Skill System

If Clawdbot has a skill execution framework:

```typescript
import { executeSkillScript } from "../skill-runner.js";

// Execute a skill script
const result = await executeSkillScript("clawdify", "current.mjs");

// Execute with arguments
const searchResult = await executeSkillScript(
  "clawdify",
  "search.mjs",
  ["Bohemian Rhapsody", "-t", "track", "-n", "5"]
);
```

### Error Handling

Scripts follow standard conventions:
- Exit code 0 = success
- Exit code 1 = error
- Error messages printed to stderr
- Results printed to stdout

```typescript
try {
  const result = await executeSkillScript("clawdify", "play.mjs", [trackUri]);
  console.log("Playback started");
} catch (error) {
  if (error.message.includes("No active device")) {
    console.error("Please open Spotify on a device first");
  } else if (error.message.includes("Premium required")) {
    console.error("This feature requires Spotify Premium");
  } else {
    console.error(`Playback failed: ${error.message}`);
  }
}
```

## Advanced Integration

### Custom API Calls

For operations not covered by existing scripts, use the shared API library:

```javascript
import { spotifyRequest } from "./scripts/lib/spotify-api.mjs";

// Get user's top tracks
const topTracks = await spotifyRequest("/me/top/tracks?limit=10");

// Create a playlist
const playlist = await spotifyRequest("/me/playlists", {
  method: "POST",
  body: JSON.stringify({
    name: "My New Playlist",
    description: "Created by Clawdbot",
    public: false,
  }),
});

// Add tracks to playlist
await spotifyRequest(`/playlists/${playlist.id}/tracks`, {
  method: "POST",
  body: JSON.stringify({
    uris: ["spotify:track:xxx", "spotify:track:yyy"],
  }),
});
```

### Token Refresh

The API library handles token refresh automatically with a 5-minute buffer. If authentication expires:

1. User will see "Token expired" or auth errors
2. Run the OAuth flow again: `clawdbot auth-spotify`
3. Scripts will work again immediately

### Configuration Loading

Example of loading config in custom integrations:

```typescript
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

function loadSpotifyConfig() {
  const configPath = join(homedir(), ".clawdbot", "config.json5");
  const config = JSON5.parse(readFileSync(configPath, "utf8"));

  return {
    clientId: config.skills?.clawdify?.clientId || process.env.SPOTIFY_CLIENT_ID,
    clientSecret: config.skills?.clawdify?.clientSecret || process.env.SPOTIFY_CLIENT_SECRET,
  };
}
```

## Troubleshooting Integration

### Issue: "No auth credentials found"

**Solution:** Run the OAuth flow first:

```bash
clawdbot auth-spotify
```

### Issue: "Missing Spotify credentials"

**Solution:** Configure credentials in config.json5 or environment variables

### Issue: Scripts can't be executed

**Solution:** Ensure scripts have executable permissions:

```bash
chmod +x ~/.clawdbot/skills/clawdify/scripts/*.mjs
```

### Issue: "No active device found"

**Solution:** User needs to open Spotify on any device (phone, desktop, web player)

### Issue: "This feature requires Spotify Premium"

**Solution:** Playback control features require a Premium account. Search and library features work with free accounts.

## Testing the Integration

### Quick Test Script

Create a test script to verify the integration:

```bash
#!/bin/bash

echo "Testing Clawdify integration..."

# Test 1: Check if OAuth is configured
if [ -f ~/.clawdbot/auth-profiles.json ]; then
  echo "✓ Auth profiles found"
else
  echo "✗ No auth profiles. Run: clawdbot auth-spotify"
  exit 1
fi

# Test 2: Check current playback
if node ~/.clawdbot/skills/clawdify/scripts/current.mjs; then
  echo "✓ Current playback check succeeded"
else
  echo "⚠ No active playback (may need to start Spotify)"
fi

# Test 3: List devices
if node ~/.clawdbot/skills/clawdify/scripts/devices.mjs; then
  echo "✓ Device listing succeeded"
else
  echo "✗ Device listing failed"
  exit 1
fi

echo ""
echo "Integration test completed!"
```

## Next Steps

1. Implement the OAuth command registration
2. Test the authentication flow
3. Verify script execution from Clawdbot
4. Add skill-specific prompts/commands to Clawdbot's agent
5. Document any custom integrations or extensions

## API Reference

For complete Spotify Web API documentation:
- https://developer.spotify.com/documentation/web-api
- https://developer.spotify.com/documentation/web-api/reference
