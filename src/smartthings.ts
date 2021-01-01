import { Request, Response } from "express";
import Spotify from "./spotify";

interface DiscoveryResponse {
  headers: { [key: string]: string };
  devices: { [key: string]: any };
}

export default class SmartThings {

  private spotify: Spotify;

  constructor(spotify: Spotify) {
    this.spotify = spotify;
  }
  
  public handlePost = async (req: Request, res: Response) => {
    console.log('Request received: ' + JSON.stringify(req.body));
  
    let response
    const { headers, authentication, devices } = req as any;

    console.log({
      headers,
      authentication,
      devices
    });

    const { interactionType1, requestId } = headers;
    const interactionType = req.body.headers.interactionType;
    console.log("request type: ", interactionType);
    try {
      switch (interactionType) {
        case "discoveryRequest":
          response = await this.discoveryRequest(headers.requestId)
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

    /**
    

    const devices = [{
      "externalDeviceId": "fake-c2c-dimmer",
      "friendlyName": "Virtual Switch",
      "deviceHandlerType": "c2c-dimmer",
      "manufacturerInfo": {
          "manufacturerName": "SmartThings",
          "modelName": "Virtual Viper device",
          "hwVersion": "v1 US bulb",
          "swVersion": "23.123.231"
      }
    }]; */

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