import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();


export async function getAbiForContract(address: string): Promise<any> {
  // Add known contract ABIs here or fetch dynamically as previously shown, Im not sure if we want to do this however as ideally the ABIs are available in our database through sync or from an API
  const abiRegistry: { [address: string]: any } = {
    // TODO: we should get the ABI from our DB since this is a well known piece of information
  };

  const lowerCaseAddress = address.toLowerCase();
  if (abiRegistry[lowerCaseAddress]) {
    return abiRegistry[lowerCaseAddress];
  }

  // Fetch ABI dynamically
  // TODO move this to backend call, currently its front end for testing
  const apiKey = process.env.ETHERSCAN_PREPROD_API_KEY;
  const url = `https://api-sepolia.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
  //Mainnet const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;

  const response = await fetch(url);
  const result = await response.json();
  if (result.status !== "1") {
    throw new Error(`Failed to fetch ABI: ${result.result}`);
  }

  const abi = JSON.parse(result.result);
  abiRegistry[lowerCaseAddress] = abi; // Cache ABI
  return abi;
}