#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

try {
  await spotifyRequest("/me/player/pause", { method: "PUT" });
  console.log("⏸️  Playback paused");
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
