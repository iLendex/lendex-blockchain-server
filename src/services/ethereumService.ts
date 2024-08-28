import { ethers } from "ethers";
import fs from 'fs';
import dotenv from 'dotenv';
import { SubscriptionManager, SecretsManager } from '@chainlink/functions-toolkit';
import { borrowTokenParamType, FulfillResponseType, LendexEvent } from "../types";
import { getAbiForContract } from "../utils/ethereum-get-contract-abi";
import { Alchemy, AlchemyEventType, Utils } from "alchemy-sdk";
import { getEthereumNetwork } from "../utils/ethereum-network-mapping";
import { decodeERC721ReceivedEvent, decodeFulfillResponseEvent } from "../utils/ethereum-lendex-events";
import { getChainlinkSecrets, getLoanByFliters, insertChanlinkSecrets, updateLoan } from "../db/queries";
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
const chainlinkSecretsUrl = process.env.CHAINLINK_SECRETS_URL;
const chainlinkSecretsVersion = parseInt(process.env.CHAINLINK_SECRETS_VERSION);
const network = process.env.NETWORK;

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

const source = fs.readFileSync('./src/utils/source.js').toString();
const gasLimit = 300000;
let contractABI;

const alchemy = new Alchemy({
  apiKey: process.env.PROVIDER_API_KEY,
  network: getEthereumNetwork(process.env.NETWORK),
});

console.log("Alchemy config:", alchemy.config);

export async function getEthBalance(address: string): Promise<string> {
  const balance = await provider.getBalance(address);
  return ethers.utils.formatEther(balance);
}

export async function borrowToken(): Promise<borrowTokenParamType> {
  await subscriptionManager.initialize();
  const gasPriceWei = (await signer.getGasPrice()).toBigInt();

  //////// ESTIMATE REQUEST COSTS ////////

  console.log("\nEstimate function request costs...");

  const estimatedCostInJuels = await subscriptionManager.estimateFunctionsRequestCost({
    donId: donId,
    subscriptionId: subscriptionId,
    callbackGasLimit: gasLimit,
    gasPriceWei: gasPriceWei,
  });

  console.log(`Fulfillment function cost estimated to ${ethers.utils.formatEther(estimatedCostInJuels)} LINK`);

  console.log("Get secrets...");
  let secretsUrl = await getChainlinkSecretsUrl(network, chainlinkSecretsVersion);
  if (!secretsUrl) {
    throw new Error(`Encrypted secrets not uploaded for ${network} and version: ${chainlinkSecretsVersion}`);
  }
  console.log(`\n✅ Secrets uploaded properly to ${network} and version: ${chainlinkSecretsVersion}, url: ${secretsUrl}`);

  if (!contractABI) {
    contractABI = await getAbiForContract(process.env.LENDEX_CONTRACT_ADDRESS);
  }
  const borrowTypeObject: borrowTokenParamType = {
    consumerAddress: consumerAddress,
    contractABI: contractABI,
    source: source,
    encryptedSecretsUrl: secretsUrl
  };

  return borrowTypeObject;
}

export async function payDebt(): Promise<borrowTokenParamType> {
  await subscriptionManager.initialize();
  await secretsManager.initialize();
  const gasPriceWei = (await signer.getGasPrice()).toBigInt();

  console.log("\nEstimate function request costs...");
  const estimatedCostInJuels = await subscriptionManager.estimateFunctionsRequestCost({
    donId: donId,
    subscriptionId: subscriptionId,
    callbackGasLimit: gasLimit,
    gasPriceWei: gasPriceWei,
  });

  console.log(`Fulfillment function cost estimated to ${ethers.utils.formatEther(estimatedCostInJuels)} LINK`);

  let secretsUrl = await getChainlinkSecretsUrl(network, chainlinkSecretsVersion);
  if (!secretsUrl) {
    throw new Error(`Encrypted secrets not uploaded for ${network} and version: ${chainlinkSecretsVersion}`);
  }
  console.log(`\n✅ Secrets uploaded properly to ${network} and version: ${chainlinkSecretsVersion}, url: ${secretsUrl}`);
  if (!contractABI) {
    contractABI = await getAbiForContract(process.env.LENDEX_CONTRACT_ADDRESS);
  }
  const payDebtTypeObject: borrowTokenParamType = {
    consumerAddress: consumerAddress,
    contractABI: contractABI,
    source: source,
    encryptedSecretsUrl: secretsUrl
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
            await updateLoanRequest(type, requestId);
            break
          }
        }

        default:
          break;
      }
    }
  );
}

async function updateLoanRequest(type: FulfillResponseType, requestId: string,): Promise<void> {
  const { state, column } = type == FulfillResponseType.BORROW_CHECK ?
    { state: loanStateEnum.enumValues[3], column: "acceptLoanRequestId" } :
    { state: loanStateEnum.enumValues[2], column: "payDebtRequestId" };
  const loan = await getLoanByFliters({ [column]: requestId });
  if (loan) {
    try {
      await updateLoan(loan.id, { state });
    } catch (error) {
      console.error('Update Loan Request Error:', error);
    }
  }
}

async function getChainlinkSecretsUrl(network: string, version: number): Promise<string> {
  const secrets = await getChainlinkSecrets(network, version);
  return secrets?.encryptedUrl;
}

export async function uploadSecrets(secrets: Record<string, string>, network: string, version: number): Promise<string> {
  await secretsManager.initialize();
  const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);
  const secretsUrls = [`${chainlinkSecretsUrl}/${network}/${version}`];
  const encryptedSecretsUrls = await secretsManager.encryptSecretsUrls(
    secretsUrls
  );
  // add secrest object to db
  await insertChanlinkSecrets(JSON.stringify(encryptedSecretsObj), encryptedSecretsUrls, network, version);
  console.log(`\Secret URLs:`, secretsUrls);
  console.log(`\nEncrypted URLs:`, encryptedSecretsUrls);
  return encryptedSecretsUrls;
}

export async function getChainlinkSecretsObj(network: string, version: number): Promise<{ encryptedSecrets: string }> {
  const secrets = await getChainlinkSecrets(network, version);
  return secrets?.secrets ? JSON.parse(secrets?.secrets) : { encryptedSecrets: "" };
}