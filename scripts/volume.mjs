#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

function usage() {
  console.error("Usage: volume.mjs <0-100>");
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

const volume = parseInt(args[0], 10);
if (isNaN(volume) || volume < 0 || volume > 100) {
  console.error("Volume must be between 0 and 100");
  process.exit(1);
}

try {
  await spotifyRequest(`/me/player/volume?volume_percent=${volume}`, {
    method: "PUT",
  });
  console.log(`🔊 Volume set to ${volume}%`);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
