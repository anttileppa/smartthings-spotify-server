import dotenv from "dotenv";
import express from 'express';
import SmartThings from "./smartthings";
import Spotify from "./spotify";

dotenv.config();
const { PORT } = process.env;

const spotify = new Spotify();
const smartThings = new SmartThings(spotify);

const app = express();
const port = PORT ? parseInt(PORT) : 3000;

/**
 * Login URL
 */
 app.get('/login', (req, res) => {
  const scopes = ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-modify-playback-state'];
  res.redirect(spotify.getAuthorizedSpotifyApi().createAuthorizeURL(scopes, "smarththings"));
});

/**
 * Authentication callback
 */
app.get('/callback', spotify.handleLoginCallback);

/**
 * Refresh token endpoint
 */
app.get('/refresh', spotify.handleRefresh);

/**
 * Lists available playlists
 */
app.get("/ping", async (req, res) => {
  res.send("pong");
});

/**
 * Lists available playlists
 */
app.get("/playlists", spotify.handlePlaylists);

/**
 * Lists available devices
 */
app.get("/devices", spotify.handleDevices);

/**
 * Starts to play given context_uri on given device
 */
app.get("/play", spotify.handlePlay);

/**
 * Pauses playback
 */
app.get("/pause", spotify.handlePause);

/**
 * SmartThings callback endpoint
 */
app.post("/smartthings", smartThings.handlePost);

app.listen(port, () => {
  return console.log(`SmartThings Spotify server is listening on ${port}`);
});