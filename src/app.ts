import dotenv from "dotenv";
import express from 'express';
import smartThingsConnector from "./smartthings-connector";

dotenv.config();
const { PORT } = process.env;

const app = express();
const port = PORT ? parseInt(PORT) : 3000;

/**
 * SmartThings callback endpoint
 */
app.post("/smartthings", smartThingsConnector.handleHttpCallback);

app.listen(port, () => {
  return console.log(`SmartThings Spotify server is listening on ${port}`);
});