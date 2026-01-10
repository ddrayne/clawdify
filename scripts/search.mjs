#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

function usage() {
  console.error(
    "Usage: search.mjs <query> [-t track|album|artist|playlist] [-n 10]",
  );
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

const query = args[0];
let type = "track";
let limit = 10;

for (let i = 1; i < args.length; i++) {
  if (args[i] === "-t" && args[i + 1]) {
    type = args[i + 1];
    i++;
  } else if (args[i] === "-n" && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    i++;
  }
}

if (!["track", "album", "artist", "playlist"].includes(type)) {
  console.error("Type must be: track, album, artist, or playlist");
  process.exit(1);
}

try {
  const params = new URLSearchParams({
    q: query,
    type,
    limit: String(Math.min(limit, 50)),
  });

  const data = await spotifyRequest(`/search?${params}`);
  const results = data[`${type}s`]?.items || [];

  if (results.length === 0) {
    console.log(`No ${type}s found for: ${query}`);
    process.exit(0);
  }

  console.log(`Search results for "${query}" (${type}):\n`);

  for (const item of results) {
    if (type === "track") {
      const artists = item.artists.map((a) => a.name).join(", ");
      console.log(`🎵 ${item.name}`);
      console.log(`   ${artists} - ${item.album.name}`);
      console.log(`   URI: ${item.uri}\n`);
    } else if (type === "album") {
      const artists = item.artists.map((a) => a.name).join(", ");
      console.log(`💿 ${item.name}`);
      console.log(`   ${artists} (${item.release_date})`);
      console.log(`   URI: ${item.uri}\n`);
    } else if (type === "artist") {
      console.log(`🎤 ${item.name}`);
      console.log(`   Followers: ${item.followers?.total || 0}`);
      console.log(`   URI: ${item.uri}\n`);
    } else if (type === "playlist") {
      console.log(`📋 ${item.name}`);
      console.log(`   By: ${item.owner.display_name}`);
      console.log(`   ${item.tracks.total} tracks`);
      console.log(`   URI: ${item.uri}\n`);
    }
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
