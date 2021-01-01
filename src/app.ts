import * as fs from "fs";
import dotenv from "dotenv";
import express from 'express';
import moment from "moment";
import SpotifyWebApi from "spotify-web-api-node";

dotenv.config();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URL, TOKEN_FILE_PATH, PORT } = process.env;

/**
 * Interface for stoed access token
 */
interface AccessToken {
  access_token: string;
  token_type: string;
  expires_at: string;
  refresh_token: string;
  scope: string;
}

/**
 * Returns Spotify API
 */
const getSpotifyApi = () => {
  return new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
    redirectUri: SPOTIFY_REDIRECT_URL
  });
}

/**
 * Reads access token from the file-system
 */
const readAccessToken = (): AccessToken | null => {
  if (!fs.existsSync(TOKEN_FILE_PATH as string)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(TOKEN_FILE_PATH as string, {
    encoding: "utf-8"
  }));
}

/**
 * Writes access token to the file-system
 * 
 * @param accessToken access token
 */
const writeAccesstoken = (accessToken: AccessToken) => {
  fs.writeFileSync(TOKEN_FILE_PATH as string, JSON.stringify(accessToken));
}

/**
 * Returns authenticated Spotify API
 */
const getAuthorizedSpotifyApi = () => {
  const spotifyApi = getSpotifyApi();

  const token = readAccessToken();
  if (token) {
    spotifyApi.setAccessToken(token.access_token);
  }
  
  return spotifyApi;
}

const app = express();
const port = PORT ? parseInt(PORT) : 3000;

/**
 * Login URL
 */
 app.get('/login', (req, res) => {
  const scopes = ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-modify-playback-state'];
  res.redirect(getAuthorizedSpotifyApi().createAuthorizeURL(scopes, "smarththings"));
});

/**
 * Authentication callback
 */
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    res.status(400).send("Bad request");
    return;
  }

  const grantResponse = (await getAuthorizedSpotifyApi().authorizationCodeGrant(code as string)).body;
  const accessToken: AccessToken = {
    access_token: grantResponse.access_token,
    expires_at: moment().add(grantResponse.expires_in, "seconds").toISOString(),
    refresh_token: grantResponse.refresh_token,
    scope: grantResponse.scope,
    token_type: grantResponse.token_type
  };

  writeAccesstoken(accessToken);

  res.send("Logged in");
});

/**
 * Refresh token endpoint
 */
app.get('/refresh', async (req, res) => {
  const accessToken = readAccessToken();
  if (!accessToken) {
    return res.status(401).send("Unauthorized");
  }

  const expiresAt = accessToken ? moment(accessToken.expires_at).subtract(5, "minutes") : null;

  if (!expiresAt || moment().isAfter(expiresAt)) {
    const spotifyApi = getSpotifyApi();
    spotifyApi.setRefreshToken(accessToken.refresh_token);
    const refreshResponse = (await spotifyApi.refreshAccessToken()).body;

    const refresheToken: AccessToken = {
      access_token: refreshResponse.access_token,
      expires_at: moment().add(refreshResponse.expires_in, "seconds").toISOString(),
      refresh_token: accessToken.refresh_token,
      scope: refreshResponse.scope,
      token_type: refreshResponse.token_type
    };
    
    writeAccesstoken(refresheToken);
    
    res.send("Token refreshed");
  } else {
    res.send(`Token is still valid. Expires at ${moment(expiresAt).format("LLL")}`);
  }
});

/**
 * Lists available playlists
 */
app.get("/ping", async (req, res) => {
  res.send("pong");
});

/**
 * Lists available playlists
 */
app.get("/playlists", async (req, res) => {
  const playlists = (await getAuthorizedSpotifyApi().getUserPlaylists()).body;
  res.send(playlists);
});

/**
 * Lists available devices
 */
app.get("/devices", async (req, res) => {
  const devices = (await getAuthorizedSpotifyApi().getMyDevices()).body;
  res.send(devices);
});

/**
 * Starts to play given context_uri on given device
 */
app.get("/play", async (req, res) => {
  const { device_id, context_uri } = req.query;

  if (!device_id) {
    return res.status(400).send("Missing device_id");
  }
  
  if (!context_uri) {
    return res.status(400).send("Missing context_uri");
  }

  const response = await getAuthorizedSpotifyApi().play({
    device_id: device_id as string,
    context_uri: context_uri as string
  });

  res.send(response.body);
});

/**
 * Pauses playback
 */
app.get("/pause", async (req, res) => {
  const { device_id } = req.query;

  if (!device_id) {
    return res.status(400).send("Missing device_id");
  }

  const response = await getAuthorizedSpotifyApi().pause({
    device_id: device_id as string
  });

  res.send(response.body);
});

/**
 * SmartThings callback endpoint
 */
app.post("/smartthings", async (req, res) => {
  console.log("smartthings", req.query, req.body, req.headers);
  
  res.send({
    ok: true
  });
});

app.listen(port, () => {
  return console.log(`SmartThings Spotify server is listening on ${port}`);
});