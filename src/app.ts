import express from 'express';
import cors from 'cors';
import { ethRoutes } from './routes/ethereum';
import dotenv from 'dotenv';
import { listenLendexEvent } from './services/ethereumService';
import { LendexEvent } from './types';
import { getAllLoans } from './db/queries';
// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3001;

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

app.get('/', async (req, res) => {
  res.send('Ethereum Node Server');
});

app.get('/loans', async (req, res) => {
  const loans = await getAllLoans();
  res.json(loans);
});


// Mount the ethRoutes
app.use('/eth', ethRoutes);

listenLendexEvent(LendexEvent.ERC721Received);
listenLendexEvent(LendexEvent.FulfillResponse);

app.listen(port, () => {
  return console.log(`Express is listening at port:${port}`);
});
