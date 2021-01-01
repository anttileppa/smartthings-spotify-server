import { Request, Response } from "express";
import * as fs from "fs";
import SpotifyWebApi from "spotify-web-api-node";
import moment from "moment";

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URL, TOKEN_FILE_PATH } = process.env;

/**
 * Interface for stoed access token
 */
export interface AccessToken {
  access_token: string;
  token_type: string;
  expires_at: string;
  refresh_token: string;
  scope: string;
}

export default class Spotify {

  public handleLoginCallback = async (req: Request, res: Response) => {
    const { code } = req.query;
    if (!code) {
      res.status(400).send("Bad request");
      return;
    }

    const grantResponse = (await this.getAuthorizedSpotifyApi().authorizationCodeGrant(code as string)).body;
    const accessToken: AccessToken = {
      access_token: grantResponse.access_token,
      expires_at: moment().add(grantResponse.expires_in, "seconds").toISOString(),
      refresh_token: grantResponse.refresh_token,
      scope: grantResponse.scope,
      token_type: grantResponse.token_type
    };

    this.writeAccesstoken(accessToken);

    res.send("Logged in");
  }

  public handleRefresh = async (req: Request, res: Response) => {
    const accessToken = this.readAccessToken();
    if (!accessToken) {
      return res.status(401).send("Unauthorized");
    }

    const expiresAt = accessToken ? moment(accessToken.expires_at).subtract(5, "minutes") : null;

    if (!expiresAt || moment().isAfter(expiresAt)) {
      const spotifyApi = this.getSpotifyApi();
      spotifyApi.setRefreshToken(accessToken.refresh_token);
      const refreshResponse = (await spotifyApi.refreshAccessToken()).body;

      const refresheToken: AccessToken = {
        access_token: refreshResponse.access_token,
        expires_at: moment().add(refreshResponse.expires_in, "seconds").toISOString(),
        refresh_token: accessToken.refresh_token,
        scope: refreshResponse.scope,
        token_type: refreshResponse.token_type
      };

      this.writeAccesstoken(refresheToken);

      res.send("Token refreshed");
    } else {
      res.send(`Token is still valid. Expires at ${moment(expiresAt).format("LLL")}`);
    }
  }

  public handlePlaylists = async (req: Request, res: Response) => {
    const playlists = (await this.getAuthorizedSpotifyApi().getUserPlaylists()).body;
    res.send(playlists);
  }

  public handleDevices = async (req: Request, res: Response) => {
    const devices = (await this.getAuthorizedSpotifyApi().getMyDevices()).body;
    res.send(devices);
  }

  public handlePlay = async (req: Request, res: Response) => {
    const { device_id, context_uri } = req.query;

    if (!device_id) {
      return res.status(400).send("Missing device_id");
    }
    
    if (!context_uri) {
      return res.status(400).send("Missing context_uri");
    }

    const response = await this.getAuthorizedSpotifyApi().play({
      device_id: device_id as string,
      context_uri: context_uri as string
    });

    res.send(response.body);
  }

  public handlePause = async (req: Request, res: Response) => {
    const { device_id } = req.query;

    if (!device_id) {
      return res.status(400).send("Missing device_id");
    }

    const response = await this.getAuthorizedSpotifyApi().pause({
      device_id: device_id as string
    });

    res.send(response.body);
  }

  /**
   * Returns Spotify API
   */
  public getSpotifyApi = () => {
    return new SpotifyWebApi({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      redirectUri: SPOTIFY_REDIRECT_URL
    });
  }

  /**
   * Returns authenticated Spotify API
   */
  public getAuthorizedSpotifyApi = () => {
    const spotifyApi = this.getSpotifyApi();

    const token = this.readAccessToken();
    if (token) {
      spotifyApi.setAccessToken(token.access_token);
    }

    return spotifyApi;
  }

  /**
   * Reads access token from the file-system
   */
  private readAccessToken = (): AccessToken | null => {
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
  private writeAccesstoken = (accessToken: AccessToken) => {
    fs.writeFileSync(TOKEN_FILE_PATH as string, JSON.stringify(accessToken));
  }

}