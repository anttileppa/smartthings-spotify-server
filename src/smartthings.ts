import { Request, Response } from "express";
import Spotify from "./spotify";
import { partnerHelper, CommandResponse } from "st-schema";
const stPartnerHelper = new partnerHelper({}, {});

interface DiscoveryResponse {
  headers: { [key: string]: string };
  devices: { [key: string]: any };
}

export default class SmartThings {

  private spotify: Spotify;

  constructor(spotify: Spotify) {
    this.spotify = spotify;
  }
  
  public handleGet = async (req: Request, res: Response) => {
    let response
    const { headers, body, query } = req;

    console.log("GET", {
      headers,
      body,
      query
    });

    res.send();
  }

  public handlePost = async (req: Request, res: Response) => {
    let response
    const { headers, body, query } = req;

    console.log("POST", {
      headers,
      body,
      query
    });

    const requestId: string | undefined = headers["x-request-id"] as string;
    if (!requestId) {
      return res.status(400).send("Missing request id");
    }

    const { interactionType } = body;

    // /const { interactionType1, requestId } = headers;
    // const interactionType = req.body.headers.interactionType;
    console.log("request type: ", interactionType);
    try {
      switch (interactionType || "discoveryRequest") {
        case "discoveryRequest":
          response = await this.discoveryRequest(requestId)
          break;
        /**
          case "commandRequest":
          response = commandRequest(req)
          break;
        case "stateRefreshRequest":
          response = stateRefreshRequest(req)
          break;
        case "grantCallbackAccess":
          response = grantCallbackAccess(req)
          break; */
        default:
          response = "error. not supported interactionType" + interactionType
          break;
      }
    } catch (ex) {
      console.log("failed with ex", ex)
    }
    
    console.log({ response });

    res.send(response);
  }

  private discoveryRequest = async (requestId: string) => {
    const devices = (await this.spotify.getAuthorizedSpotifyApi().getMyDevices()).body;

    const headers = {
      "schema": "st-schema",
      "version": "1.0",
      "interactionType": "discoveryResponse",
      "requestId": requestId
    };

    return {
      headers: headers,
      devices: devices.devices.map(device => {
        return {
          "externalDeviceId": device.id,
          "friendlyName": device.name,
          "deviceHandlerType": "c2c-music-player",
          "manufacturerInfo": {
              "manufacturerName": "Spotify",
              "modelName": device.type,
              "hwVersion": "v1",
              "swVersion": "1"
          }
        }
      })
    };
  }

}