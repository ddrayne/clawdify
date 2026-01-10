#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

function usage() {
  console.error(
    "Usage: recommendations.mjs --seed-tracks <uri1,uri2> [--limit 10]",
  );
  console.error(
    "       recommendations.mjs --seed-artists <uri1,uri2> [--limit 10]",
  );
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

let seedTracks = [];
let seedArtists = [];
let limit = 10;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--seed-tracks" && args[i + 1]) {
    seedTracks = args[i + 1]
      .split(",")
      .map((uri) => uri.replace(/spotify:(track|artist):/, ""));
    i++;
  } else if (args[i] === "--seed-artists" && args[i + 1]) {
    seedArtists = args[i + 1]
      .split(",")
      .map((uri) => uri.replace(/spotify:(track|artist):/, ""));
    i++;
  } else if (args[i] === "--limit" && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    i++;
  }
}

if (seedTracks.length === 0 && seedArtists.length === 0) {
  usage();
}

try {
  const params = new URLSearchParams({ limit: String(limit) });
  if (seedTracks.length > 0) params.set("seed_tracks", seedTracks.join(","));
  if (seedArtists.length > 0)
    params.set("seed_artists", seedArtists.join(","));

  const data = await spotifyRequest(`/recommendations?${params}`);

  if (!data.tracks || data.tracks.length === 0) {
    console.log("No recommendations found.");
    process.exit(0);
  }

  console.log("Recommended tracks:\n");
  for (const track of data.tracks) {
    const artists = track.artists.map((a) => a.name).join(", ");
    console.log(`🎵 ${track.name}`);
    console.log(`   ${artists} - ${track.album.name}`);
    console.log(`   URI: ${track.uri}\n`);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
