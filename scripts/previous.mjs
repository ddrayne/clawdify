#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

try {
  await spotifyRequest("/me/player/previous", { method: "POST" });
  console.log("⏮️  Skipped to previous track");
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
