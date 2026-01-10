#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

function usage() {
  console.error("Usage: transfer.mjs <device_id> [--play]");
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

const deviceId = args[0];
const play = args.includes("--play");

try {
  await spotifyRequest("/me/player", {
    method: "PUT",
    body: JSON.stringify({
      device_ids: [deviceId],
      play,
    }),
  });
  console.log(`🔄 Transferred playback to device: ${deviceId}`);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
