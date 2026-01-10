#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

try {
  await spotifyRequest("/me/player/next", { method: "POST" });
  console.log("⏭️  Skipped to next track");
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
