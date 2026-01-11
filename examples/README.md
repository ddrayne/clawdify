# Clawdify Integration Examples

This directory contains example code showing how to integrate Clawdify into Clawdbot.

## Files

### `clawdbot-command.example.ts`

Complete example of a Clawdbot command that handles Spotify OAuth authentication.

**Features:**
- Loads credentials from config or environment
- Handles VPS/local environment detection
- Saves auth tokens to auth-profiles.json
- Provides helpful error messages
- Can be executed standalone or registered as a command

**Usage:**

1. Copy to Clawdbot's commands directory:
   ```bash
   cp clawdbot-command.example.ts ~/.clawdbot/src/commands/spotify-auth.ts
   ```

2. Register in Clawdbot's command loader:
   ```typescript
   import { command as spotifyAuthCommand } from "./spotify-auth.js";
   registerCommand(spotifyAuthCommand);
   ```

3. Run:
   ```bash
   clawdbot auth-spotify
   ```

## Integration Patterns

### Pattern 1: Direct Script Execution

Execute Spotify scripts directly from Clawdbot:

```typescript
import { execSync } from "child_process";
import { join } from "path";

const skillDir = join(homedir(), ".clawdbot/skills/clawdify");

// Get current track
const output = execSync(`node ${skillDir}/scripts/current.mjs`, {
  encoding: "utf8",
});
console.log(output);
```

### Pattern 2: Skill Runner Integration

If Clawdbot has a skill execution framework:

```typescript
import { runSkillScript } from "../skill-runner";

// Execute skill script
const result = await runSkillScript("clawdify", "current.mjs");

// With arguments
await runSkillScript("clawdify", "play.mjs", ["spotify:track:xxx"]);
```

### Pattern 3: Agent-Driven Execution

Let the agent decide which scripts to run based on user intent:

```typescript
// In agent's tool definitions
const spotifyTools = [
  {
    name: "spotify_get_current",
    description: "Get currently playing track on Spotify",
    async execute() {
      return await runSkillScript("clawdify", "current.mjs");
    },
  },
  {
    name: "spotify_play",
    description: "Play a track on Spotify",
    parameters: {
      uri: {
        type: "string",
        description: "Spotify URI of track to play",
      },
    },
    async execute({ uri }) {
      return await runSkillScript("clawdify", "play.mjs", [uri]);
    },
  },
  {
    name: "spotify_search",
    description: "Search Spotify catalog",
    parameters: {
      query: { type: "string", description: "Search query" },
      type: { type: "string", enum: ["track", "album", "artist", "playlist"] },
      limit: { type: "number", default: 10 },
    },
    async execute({ query, type = "track", limit = 10 }) {
      return await runSkillScript("clawdify", "search.mjs", [
        query,
        "-t",
        type,
        "-n",
        String(limit),
      ]);
    },
  },
];
```

## Testing Examples

### Test Script 1: Authentication Flow

```bash
#!/bin/bash
# test-auth.sh

echo "Testing Spotify OAuth..."

# Set test credentials
export SPOTIFY_CLIENT_ID="your-test-client-id"
export SPOTIFY_CLIENT_SECRET="your-test-client-secret"

# Run auth command
node examples/clawdbot-command.example.ts

# Verify auth profile was created
if [ -f ~/.clawdbot/auth-profiles.json ]; then
  echo "✓ Auth profile created"
else
  echo "✗ Auth profile not found"
  exit 1
fi
```

### Test Script 2: Skill Execution

```bash
#!/bin/bash
# test-skills.sh

SKILL_DIR="$HOME/.clawdbot/skills/clawdify"

echo "Testing Clawdify scripts..."

# Test current playback
echo "1. Testing current.mjs..."
if node "$SKILL_DIR/scripts/current.mjs"; then
  echo "✓ Current playback check succeeded"
fi

# Test device listing
echo "2. Testing devices.mjs..."
if node "$SKILL_DIR/scripts/devices.mjs"; then
  echo "✓ Device listing succeeded"
fi

# Test search
echo "3. Testing search.mjs..."
if node "$SKILL_DIR/scripts/search.mjs" "test" -n 1; then
  echo "✓ Search succeeded"
fi

echo "All tests completed!"
```

## Environment Setup

Example `.env` file for development:

```bash
# .env.example
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

## Common Issues

### Issue: "Module not found"

Make sure the skill is properly installed:

```bash
ls -la ~/.clawdbot/skills/clawdify
```

### Issue: "Permission denied"

Make scripts executable:

```bash
chmod +x ~/.clawdbot/skills/clawdify/scripts/*.mjs
```

### Issue: "Cannot find dist/spotify-oauth.js"

Build the TypeScript code first:

```bash
cd ~/.clawdbot/skills/clawdify
npm install
npm run build
```

## Further Reading

- See `../INTEGRATION.md` for comprehensive integration guide
- See `../README.md` for general setup instructions
- See `../SKILL.md` for complete command reference
