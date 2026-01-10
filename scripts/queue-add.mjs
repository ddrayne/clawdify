#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

function usage() {
  console.error("Usage: queue-add.mjs <spotify:track:URI>");
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

const uri = args[0];
if (!uri.startsWith("spotify:track:")) {
  console.error("Invalid Spotify track URI. Must start with spotify:track:");
  process.exit(1);
}

try {
  await spotifyRequest(`/me/player/queue?uri=${encodeURIComponent(uri)}`, {
    method: "POST",
  });
  console.log(`➕ Added to queue: ${uri}`);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
