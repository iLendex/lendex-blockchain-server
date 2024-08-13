import express from 'express';
import { borrowToken, getEthBalance, payDebt } from '../services/ethereumService';

const ethRoutes = express.Router()

ethRoutes.post('/borrow', async (req, res) => {
  try {
    const { loan, lenderAddress, tokenId } = req.body;
    const borrowTypeObject = await borrowToken(loan, lenderAddress, tokenId);
    return res.json(borrowTypeObject);
  } catch (error) {
    console.error("Error processing borrow request:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

ethRoutes.post('/pay-debt', async (req, res) => {
  try {
    const { contractAddress, tokenId, lenderAddress } = req.body;
    const payDebtTypeObject = await payDebt(contractAddress, tokenId, lenderAddress);
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

export { ethRoutes };