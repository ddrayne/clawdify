#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

function usage() {
  console.error("Usage: library-tracks.mjs [list|add <uri>|remove <uri>]");
  process.exit(2);
}

const args = process.argv.slice(2);
const cmd = args[0] || "list";

try {
  if (cmd === "list") {
    const limit = 20;
    const data = await spotifyRequest(`/me/tracks?limit=${limit}`);

    if (!data.items || data.items.length === 0) {
      console.log("No saved tracks found.");
      process.exit(0);
    }

    console.log("Your saved tracks:\n");
    for (const item of data.items) {
      const track = item.track;
      const artists = track.artists.map((a) => a.name).join(", ");
      console.log(`🎵 ${track.name}`);
      console.log(`   ${artists} - ${track.album.name}`);
      console.log(`   URI: ${track.uri}\n`);
    }
  } else if (cmd === "add" && args[1]) {
    const trackId = args[1].replace("spotify:track:", "");
    await spotifyRequest("/me/tracks", {
      method: "PUT",
      body: JSON.stringify({ ids: [trackId] }),
    });
    console.log(`💚 Added to library: ${args[1]}`);
  } else if (cmd === "remove" && args[1]) {
    const trackId = args[1].replace("spotify:track:", "");
    await spotifyRequest("/me/tracks", {
      method: "DELETE",
      body: JSON.stringify({ ids: [trackId] }),
    });
    console.log(`❌ Removed from library: ${args[1]}`);
  } else {
    usage();
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
