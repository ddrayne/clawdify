#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

try {
  const data = await spotifyRequest("/me/playlists?limit=50");

  if (!data.items || data.items.length === 0) {
    console.log("No playlists found.");
    process.exit(0);
  }

  console.log("Your playlists:\n");
  for (const playlist of data.items) {
    console.log(`📋 ${playlist.name}`);
    console.log(`   ${playlist.tracks.total} tracks`);
    console.log(`   URI: ${playlist.uri}\n`);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
