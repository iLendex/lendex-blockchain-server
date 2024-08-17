import { ethers } from "ethers";
import fs from 'fs';
import dotenv from 'dotenv';
import { SubscriptionManager, SecretsManager } from '@chainlink/functions-toolkit';
import { borrowTokenParamType, FulfillResponseType, LendexEvent } from "../types";
import { getAbiForContract } from "../utils/ethereum-get-contract-abi";
import { Alchemy, AlchemyEventType, Utils } from "alchemy-sdk";
import { getEthereumNetwork } from "../utils/ethereum-network-mapping";
import { decodeERC721ReceivedEvent, decodeFulfillResponseEvent } from "../utils/ethereum-lendex-events";
import { getLoanByFliters, updateLoan } from "../db/queries";
import { loanStateEnum } from "../db/schema";

// Load environment variables from .env file
dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const signer = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY, provider);
const contractAddress = process.env.LENDEX_CONTRACT_ADDRESS;
const consumerAddress = process.env.CHAINLINK_CONSUMER_ADDRESS as string;
const subscriptionId = process.env.CHAINLINK_SUBSCRIPTION_ID as string;
const donId = process.env.CHAINLINK_DON_ID as string;
const routerAddress = process.env.CHAINLINK_FUNCTIONS_ROUTER as string;
const linkTokenAddress = process.env.CHAINLINK_TOKEN_ADDRESS as string;

const subscriptionManager = new SubscriptionManager({
  signer: signer,
  linkTokenAddress: linkTokenAddress,
  functionsRouterAddress: routerAddress,
});

const secretsManager = new SecretsManager({
  signer: signer,
  functionsRouterAddress: routerAddress,
  donId: donId,
});

const gatewayUrls = [
  "https://01.functions-gateway.testnet.chain.link/",
  "https://02.functions-gateway.testnet.chain.link/"
];
const slotIdNumber = 0;
const expirationTimeMinutes = 15;

const source = fs.readFileSync('./src/utils/source.js').toString();
const gasLimit = 300000;
let contractABI;

const alchemy = new Alchemy({
  apiKey: process.env.PROVIDER_API_KEY,
  network: getEthereumNetwork(process.env.NETWORK),
});

export async function getEthBalance(address: string): Promise<string> {
  const balance = await provider.getBalance(address);
  return ethers.utils.formatEther(balance);
}

export async function borrowToken(): Promise<borrowTokenParamType> {
  await subscriptionManager.initialize();
  await secretsManager.initialize();
  const gasPriceWei = (await signer.getGasPrice()).toBigInt();
  // const source = await fetchSourceFile();
  // console.log("Source file content:", source);
  const secrets = {
    apiKey: "preprodpLkt9N7JA00zp72yPwdSd2bHFla7z1s4",
  };

  //////// ESTIMATE REQUEST COSTS ////////

  console.log("\nEstimate function request costs...");

  const estimatedCostInJuels = await subscriptionManager.estimateFunctionsRequestCost({
    donId: donId,
    subscriptionId: subscriptionId,
    callbackGasLimit: gasLimit,
    gasPriceWei: gasPriceWei,
  });

  console.log(`Fulfillment function cost estimated to ${ethers.utils.formatEther(estimatedCostInJuels)} LINK`);

  console.log("\nMake request...");
  const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);
  const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
    encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
    gatewayUrls: gatewayUrls,
    slotId: slotIdNumber,
    minutesUntilExpiration: expirationTimeMinutes,
  });

  if (!uploadResult.success) {
    throw new Error(`Encrypted secrets not uploaded to ${gatewayUrls}`);
  }
  console.log(`\n✅ Secrets uploaded properly to gateways ${gatewayUrls}! Gateways response: `, uploadResult);

  const donHostedSecretsVersion = Number(uploadResult.version);
  if (!contractABI) {
    contractABI = await getAbiForContract(process.env.LENDEX_CONTRACT_ADDRESS);
  }
  const borrowTypeObject: borrowTokenParamType = {
    consumerAddress: consumerAddress,
    contractABI: contractABI,
    source: source,
    slotIdNumber,
    donHostedSecretsVersion
  };

  return borrowTypeObject;
}

export async function payDebt(): Promise<borrowTokenParamType> {
  await subscriptionManager.initialize();
  await secretsManager.initialize();
  const gasPriceWei = (await signer.getGasPrice()).toBigInt();
  const secrets = {
    apiKey: "preprodpLkt9N7JA00zp72yPwdSd2bHFla7z1s4",
  };

  console.log("\nEstimate function request costs...");
  const estimatedCostInJuels = await subscriptionManager.estimateFunctionsRequestCost({
    donId: donId,
    subscriptionId: subscriptionId,
    callbackGasLimit: gasLimit,
    gasPriceWei: gasPriceWei,
  });

  console.log(`Fulfillment function cost estimated to ${ethers.utils.formatEther(estimatedCostInJuels)} LINK`);

  console.log("\nPrepare pay debt request...");
  const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);
  const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
    encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
    gatewayUrls: gatewayUrls,
    slotId: slotIdNumber,
    minutesUntilExpiration: expirationTimeMinutes,
  });

  if (!uploadResult.success) {
    throw new Error(`Encrypted secrets not uploaded to ${gatewayUrls}`);
  }
  console.log(`\n✅ Secrets uploaded properly to gateways ${gatewayUrls}! Gateways response: `, uploadResult);

  const donHostedSecretsVersion = Number(uploadResult.version);
  if (!contractABI) {
    contractABI = await getAbiForContract(process.env.LENDEX_CONTRACT_ADDRESS);
  }
  const payDebtTypeObject: borrowTokenParamType = {
    consumerAddress: consumerAddress,
    contractABI: contractABI,
    source: source,
    slotIdNumber,
    donHostedSecretsVersion
  };

  return payDebtTypeObject;
}

export function listenLendexEvent(event: LendexEvent) {
  // Listen for all events from the contract
  const eventName: AlchemyEventType = { address: contractAddress }
  if (event) {
    eventName.topics = [Utils.id(event)];
  }
  console.log('Listening to Event:', eventName, event);

  alchemy.ws.on(eventName,
    async (log) => {
      console.log(`New ${event} event received:`, log);

      // Decode the event data
      switch (event) {
        case LendexEvent.ERC721Received: {
          const { contract, tokenId, refToken } = decodeERC721ReceivedEvent(log.data);
          console.log('ERC721Received: ', { contract, tokenId, refToken });
          const loan = await getLoanByFliters({
            'contractAddress': contract.toLowerCase(),
            'assetId': tokenId,
            'state': loanStateEnum.enumValues[7]
          });
          if (loan) {
            await updateLoan(loan.id, { state: loanStateEnum.enumValues[0], refToken, assetTxHash: log.transactionHash });
          }
          break;
        }
        case LendexEvent.FulfillResponse: {
          const { type, success, loanInfo } = decodeFulfillResponseEvent(log.data);
          if (success && type != FulfillResponseType.UNKNOWN) {
            const requestId = log.topics[1];
            console.log('FulfillResponse: ', { requestId, type, success, loanInfo });
            const state = type == FulfillResponseType.BORROW_CHECK ? loanStateEnum.enumValues[3] : loanStateEnum.enumValues[2];
            const loan = await getLoanByFliters({ 'acceptLoanRequestId': requestId });
            if (loan) {
              try {
                await updateLoan(loan.id, { state });
              } catch (error) {
                console.error(error);
              }
            }
            break
          }
        }

        default:
          break;
      }
    }
  );
}