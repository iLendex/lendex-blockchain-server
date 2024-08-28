import express from 'express';
import { borrowToken, getEthBalance, payDebt, uploadSecrets, getChainlinkSecretsObj } from '../services/ethereumService';

const ethRoutes = express.Router();

ethRoutes.get('/borrow', async (req, res) => {
  try {
    const borrowTypeObject = await borrowToken();
    return res.json(borrowTypeObject);
  } catch (error) {
    console.error("Error processing borrow request:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

ethRoutes.get('/pay-debt', async (req, res) => {
  try {
    const payDebtTypeObject = await payDebt();
    return res.json(payDebtTypeObject);
  } catch (error) {
    console.error("Error processing pay debt request:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

ethRoutes.get('/balance/:address', async (req, res) => {
  const address = req.params['address'];
  const balance = await getEthBalance(address);
  return res.json({ address, balance });
});

ethRoutes.get('/chainlink-secrets/:network/:version', async (req, res) => {
  const { network, version } = req.params;
  const secrets = await getChainlinkSecretsObj(network, parseInt(version));
  return res.json(secrets);
})

ethRoutes.post('/chainlink-secrets/:network/:version', async (req, res) => {
  const { network, version } = req.params;
  const { secrets } = req.body;
  const secretsUrl = await uploadSecrets(secrets, network, parseInt(version));
  return res.json(secretsUrl);
})

export { ethRoutes };