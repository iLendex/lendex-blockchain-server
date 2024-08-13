import { ethers } from "ethers";
import fs from 'fs';
import dotenv from 'dotenv';
import { SubscriptionManager, SecretsManager } from '@chainlink/functions-toolkit';
import { borrowTokenParamType, FulfillResponseType, LendexEvent } from "../types";
import { getAbiForContract } from "../utils/ethereum-get-contract-abi";
import { Alchemy, AlchemyEventType, Utils } from "alchemy-sdk";
import { getEthereumNetwork } from "../utils/ethereum-network-mapping";
import { decodeERC721ReceivedEvent, decodeFulfillResponseEvent } from "../utils/ethereum-lendex-events";

// Load environment variables from .env file
dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const signer = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY, provider);
const contractAddress = process.env.LENDEX_CONTRACT_ADDRESS;

const config = {
  apiKey: process.env.PROVIDER_API_KEY,
  network: getEthereumNetwork(process.env.NETWORK),
};

const alchemy = new Alchemy(config);

export async function getEthBalance(address: string): Promise<string> {
  const balance = await provider.getBalance(address);
  return ethers.utils.formatEther(balance);
}

export async function borrowToken(loan: any, lenderAddress: string, tokenId: string): Promise<borrowTokenParamType> {
  const consumerAddress = process.env.CHAINLINK_CONSUMER_ADDRESS as string;
  const subscriptionId = process.env.CHAINLINK_SUBSCRIPTION_ID as string;
  const routerAddress = process.env.CHAINLINK_FUNCTIONS_ROUTER as string;
  const linkTokenAddress = process.env.CHAINLINK_TOKEN_ADDRESS as string;
  const donId = process.env.CHAINLINK_DON_ID as string;
  const contractABI = await getAbiForContract(process.env.LENDEX_CONTRACT_ADDRESS as string);

  // const source = await fetchSourceFile();
  const source = fs.readFileSync('./src/utils/source.js').toString();
  // console.log("Source file content:", source);

  const args = ["borrow_check", tokenId.toString()];

  const secrets = {
    apiKey: "preprodpLkt9N7JA00zp72yPwdSd2bHFla7z1s4",
  };

  const gasLimit = 300000;

  //////// ESTIMATE REQUEST COSTS ////////

  console.log("\nEstimate function request costs...");
  const subscriptionManager = new SubscriptionManager({
    signer: signer,
    linkTokenAddress: linkTokenAddress,
    functionsRouterAddress: routerAddress,
  });
  await subscriptionManager.initialize();

  const gasPriceWei = await signer.getGasPrice();

  const estimatedCostInJuels = await subscriptionManager.estimateFunctionsRequestCost({
    donId: donId,
    subscriptionId: subscriptionId,
    callbackGasLimit: gasLimit,
    gasPriceWei: BigInt(gasPriceWei as any),
  });

  console.log(`Fulfillment function cost estimated to ${ethers.utils.formatEther(estimatedCostInJuels)} LINK`);

  console.log("\nMake request...");

  const secretsManager = new SecretsManager({
    signer: signer,
    functionsRouterAddress: routerAddress,
    donId: donId,
  });
  await secretsManager.initialize();
  const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);

  const gatewayUrls = [
    "https://01.functions-gateway.testnet.chain.link/",
    "https://02.functions-gateway.testnet.chain.link/"
  ];
  const slotIdNumber = 0;
  const expirationTimeMinutes = 15;

  const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
    encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
    gatewayUrls: gatewayUrls,
    slotId: slotIdNumber,
    minutesUntilExpiration: expirationTimeMinutes,
  });

  if (!uploadResult.success) {
    throw new Error(`Encrypted secrets not uploaded to ${gatewayUrls}`);
  }

  console.log(`\n✅ Secrets uploaded properly to gateways ${gatewayUrls}!`);

  const donHostedSecretsVersion = Number(uploadResult.version);

  const borrowTypeObject: borrowTokenParamType = {
    consumerAddress: consumerAddress,
    contractABI: contractABI,
    source: source,
    slotIdNumber,
    donHostedSecretsVersion
  };

  return borrowTypeObject;
}

export async function payDebt(contractAddress: string, tokenId: string, lenderAddress: string): Promise<borrowTokenParamType> {
  const consumerAddress = process.env.CHAINLINK_CONSUMER_ADDRESS as string;
  const subscriptionId = process.env.CHAINLINK_SUBSCRIPTION_ID as string;
  const routerAddress = process.env.CHAINLINK_FUNCTIONS_ROUTER as string;
  const linkTokenAddress = process.env.CHAINLINK_TOKEN_ADDRESS as string;
  const donId = process.env.CHAINLINK_DON_ID as string;
  const contractABI = await getAbiForContract(process.env.LENDEX_CONTRACT_ADDRESS as string);

  const source = fs.readFileSync('./src/utils/source.js').toString();
  console.log("Source file content:", source);

  const args = ["pay_debt_check", tokenId.toString()];

  const secrets = {
    apiKey: "preprodpLkt9N7JA00zp72yPwdSd2bHFla7z1s4",
  };

  const gasLimit = 300000;

  console.log("\nEstimate function request costs...");
  const subscriptionManager = new SubscriptionManager({
    signer: signer,
    linkTokenAddress: linkTokenAddress,
    functionsRouterAddress: routerAddress,
  });
  await subscriptionManager.initialize();

  const gasPriceWei = await signer.getGasPrice();

  const estimatedCostInJuels = await subscriptionManager.estimateFunctionsRequestCost({
    donId: donId,
    subscriptionId: subscriptionId,
    callbackGasLimit: gasLimit,
    gasPriceWei: BigInt(gasPriceWei as any),
  });

  console.log(`Fulfillment function cost estimated to ${ethers.utils.formatEther(estimatedCostInJuels)} LINK`);

  console.log("\nPrepare pay debt request...");

  const secretsManager = new SecretsManager({
    signer: signer,
    functionsRouterAddress: routerAddress,
    donId: donId,
  });

  await secretsManager.initialize();
  const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);

  const gatewayUrls = [
    "https://01.functions-gateway.testnet.chain.link/",
    "https://02.functions-gateway.testnet.chain.link/"
  ];
  const slotIdNumber = 0;
  const expirationTimeMinutes = 15;

  console.log(`Upload encrypted secret to gateways ${gatewayUrls}. slotId ${slotIdNumber}. Expiration in minutes: ${expirationTimeMinutes}`);
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

  const payDebtTypeObject: borrowTokenParamType = {
    consumerAddress: consumerAddress,
    contractABI: contractABI,
    source: source,
    slotIdNumber,
    donHostedSecretsVersion
  };

  return payDebtTypeObject;
}

export function listenLendexEvent(event: LendexEvent, cb: (...args: any) => void) {
  // Listen for all events from the contract
  const eventName: AlchemyEventType = { address: contractAddress }
  if (event) {
    eventName.topics = [Utils.id(event)];
  }
  console.log('Listening to Event:', eventName, event);
  
  alchemy.ws.on(eventName,
    (log) => {
      console.log(`New ${event} event received:`, log);

      // Decode the event data
      switch (event) {
        case LendexEvent.ERC721Received: {
          const {contract, tokenId} = decodeERC721ReceivedEvent(log.data);
          cb(contract, tokenId);
          break;
        }
        case LendexEvent.FulfillResponse: {
          const { type, success, loanInfo } = decodeFulfillResponseEvent(log.data);
          if (type != FulfillResponseType.UNKNOWN) {
            const requestId = log.topics[1];
            cb(requestId, type, success, loanInfo);
            break
          }
        }
      
        default:
          break;
      }
    } 
  );
}