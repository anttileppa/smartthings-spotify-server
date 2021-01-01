const { SchemaConnector } = require('st-schema');
import Spotify from "./spotify";

const spotify = new Spotify();

const connector = new SchemaConnector()  
  .clientId(process.env.ST_CLIENT_ID)
  .clientSecret(process.env.ST_CLIENT_SECRET)
  .discoveryHandler(async (accessToken: any, response: any) => {
    const devices = (await spotify.getAuthorizedSpotifyApi().getMyDevices()).body.devices;

    console.log("discoveryHandler", {
      accessToken,
      response
    });

    devices.forEach(device => {
      response.addDevice(device.id, device.name, "c2c-music-player")
        .manufacturerName('Spotify')
        .modelName(device.type);
    });
  })
  .stateRefreshHandler((accessToken: any, response: any) => {
    console.log("stateRefreshHandler", {
      accessToken,
      response
    });
    /**
    response.addDevice('external-device-1', [
      {
        component: 'main',
        capability: 'st.switch',
        attribute: 'switch',
        value: deviceStates.switch
      },
      {
        component: 'main',
        capability: 'st.switchLevel',
        attribute: 'level',
        value: deviceStates.level
      }
    ])
    **/
  })
  .commandHandler((accessToken: any, response: any, devices: any) => {
    console.log("commandHandler", {
      accessToken,
      response,
      devices
    });
    /**
    for (const device of devices) {
      const deviceResponse = response.addDevice(device.externalDeviceId);
      for (cmd of device.commands) {
        const state = {
          component: cmd.component,
          capability: cmd.capability
        };
        if (cmd.capability === 'st.switchLevel' && cmd.command === 'setLevel') {
          state.attribute = 'level';
          state.value = deviceStates.level = cmd.arguments[0];
          deviceResponse.addState(state);
 
        } else if (cmd.capability === 'st.switch') {
          state.attribute = 'switch';
          state.value = deviceStates.switch = cmd.command === 'on' ? 'on' : 'off';
          deviceResponse.addState(state);
 
        } else {
          deviceResponse.setError(
            `Command '${cmd.command} of capability '${cmd.capability}' not supported`,
            DeviceErrorTypes.CAPABILITY_NOT_SUPPORTED)
        }
      }
    } */
  });

export default connector;