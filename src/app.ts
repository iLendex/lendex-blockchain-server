import express from 'express';
import cors from 'cors';
import { ethRoutes } from './routes/ethereum';
import dotenv from 'dotenv';
import { listenLendexEvent } from './services/ethereumService';
import { decodeFulfillResponseEvent, LendexEvent } from './utils/ethereum-lendex-events';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 8080;

// Enable CORS for all routes
app.use('/*', cors({
  origin: ['http://localhost:3000'], // Add any other origins you need
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Use the built-in JSON middleware
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Ethereum Node Server');
});

// Mount the ethRoutes
app.use('/eth', ethRoutes);

listenLendexEvent(LendexEvent.ERC721Received, (...data) => {
  console.log('ERC721Received: ', data);
});

listenLendexEvent(LendexEvent.FulfillResponse, (...data) => {
  console.log('FulfillResponse: ', data);
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
