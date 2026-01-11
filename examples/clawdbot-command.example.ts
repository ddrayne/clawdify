/**
 * Example Clawdbot command implementation for Spotify OAuth
 *
 * This file shows how to integrate the Clawdify OAuth flow into Clawdbot's command system.
 * Copy this to your Clawdbot's src/commands/ directory and modify as needed.
 */

import { loginSpotifyVpsAware, type SpotifyOAuthCredentials } from "../skills/clawdify/dist/spotify-oauth.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Paths
const CLAWDBOT_DIR = join(homedir(), ".clawdbot");
const CONFIG_PATH = join(CLAWDBOT_DIR, "config.json5");
const AUTH_PROFILES_PATH = join(CLAWDBOT_DIR, "auth-profiles.json");

interface AuthProfile {
  type: "oauth";
  provider: string;
  access: string;
  refresh: string;
  expires: number;
  email?: string;
  displayName?: string;
}

interface AuthProfiles {
  version: number;
  profiles: Record<string, AuthProfile>;
}

/**
 * Load Spotify credentials from config or environment
 */
function loadSpotifyCredentials(): { clientId: string; clientSecret: string } {
  let clientId = process.env.SPOTIFY_CLIENT_ID;
  let clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  // Try to load from config file if env vars not set
  if ((!clientId || !clientSecret) && existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
      clientId = clientId || config.skills?.clawdify?.clientId;
      clientSecret = clientSecret || config.skills?.clawdify?.clientSecret;
    } catch (err) {
      // Config parsing failed, continue with env vars
    }
  }

  if (!clientId || !clientSecret) {
    console.error("Error: Spotify credentials not configured.");
    console.error("");
    console.error("Please add them to ~/.clawdbot/config.json5:");
    console.error("{");
    console.error("  skills: {");
    console.error("    clawdify: {");
    console.error('      clientId: "your-client-id",');
    console.error('      clientSecret: "your-client-secret"');
    console.error("    }");
    console.error("  }");
    console.error("}");
    console.error("");
    console.error("Or set environment variables:");
    console.error("  export SPOTIFY_CLIENT_ID='your-client-id'");
    console.error("  export SPOTIFY_CLIENT_SECRET='your-client-secret'");
    console.error("");
    console.error("Get credentials at: https://developer.spotify.com/dashboard");
    process.exit(1);
  }

  return { clientId, clientSecret };
}

/**
 * Save OAuth credentials to auth-profiles.json
 */
function saveAuthProfile(profileId: string, credentials: SpotifyOAuthCredentials): void {
  // Ensure directory exists
  if (!existsSync(CLAWDBOT_DIR)) {
    mkdirSync(CLAWDBOT_DIR, { recursive: true });
  }

  // Load existing profiles or create new
  let profiles: AuthProfiles;
  if (existsSync(AUTH_PROFILES_PATH)) {
    profiles = JSON.parse(readFileSync(AUTH_PROFILES_PATH, "utf8"));
  } else {
    profiles = {
      version: 1,
      profiles: {},
    };
  }

  // Add/update profile
  profiles.profiles[profileId] = {
    type: "oauth",
    provider: "spotify",
    access: credentials.access,
    refresh: credentials.refresh,
    expires: credentials.expires,
    email: credentials.email,
    displayName: credentials.displayName,
  };

  // Save
  writeFileSync(AUTH_PROFILES_PATH, JSON.stringify(profiles, null, 2), "utf8");
}

/**
 * Main command handler
 */
export async function spotifyAuthCommand(): Promise<void> {
  console.log("🎵 Spotify Authentication");
  console.log("========================\n");

  const { clientId, clientSecret } = loadSpotifyCredentials();

  console.log("Starting OAuth flow...\n");

  try {
    const credentials = await loginSpotifyVpsAware(
      clientId,
      clientSecret,
      async (url: string) => {
        console.log("Authorization URL:");
        console.log(url);
        console.log("");
      },
      (message: string) => {
        console.log(message);
      }
    );

    if (credentials) {
      // Save credentials
      saveAuthProfile("spotify:default", credentials);

      console.log("\n✓ Successfully authenticated with Spotify!\n");

      if (credentials.email) {
        console.log(`  Account:      ${credentials.email}`);
      }
      if (credentials.displayName) {
        console.log(`  Display name: ${credentials.displayName}`);
      }

      console.log(`  Credentials saved to: ${AUTH_PROFILES_PATH}\n`);
      console.log("You can now use Spotify commands with Clawdbot!");
    } else {
      console.error("\n✗ Authentication failed\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n✗ Authentication error:");
    console.error(error instanceof Error ? error.message : String(error));
    console.error("");
    process.exit(1);
  }
}

// Command metadata for registration
export const command = {
  name: "auth-spotify",
  aliases: ["spotify-auth", "login-spotify"],
  description: "Authenticate with Spotify Web API",
  usage: "auth-spotify",
  category: "Authentication",
  handler: spotifyAuthCommand,
};

// Allow direct execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  spotifyAuthCommand().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
