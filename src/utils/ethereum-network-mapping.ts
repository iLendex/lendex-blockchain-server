import { Network } from "alchemy-sdk";

const EthereumNetworkMapping: {[key: string]: Network} = {
    [Network.ETH_MAINNET]: Network.ETH_MAINNET,
    [Network.ETH_GOERLI]: Network.ETH_GOERLI,
    [Network.ETH_SEPOLIA]: Network.ETH_SEPOLIA,
    [Network.OPT_MAINNET]: Network.OPT_MAINNET,
    [Network.OPT_GOERLI]: Network.OPT_GOERLI,
    [Network.OPT_SEPOLIA]: Network.OPT_SEPOLIA,
    [Network.ARB_MAINNET]: Network.ARB_MAINNET,
    [Network.ARB_GOERLI]: Network.ARB_GOERLI,
    [Network.ARB_SEPOLIA]: Network.ARB_SEPOLIA,
    [Network.MATIC_MAINNET]: Network.MATIC_MAINNET,
    [Network.MATIC_MUMBAI]: Network.MATIC_MUMBAI,
    [Network.MATIC_AMOY]: Network.MATIC_AMOY,
    [Network.ASTAR_MAINNET]: Network.ASTAR_MAINNET,
    [Network.POLYGONZKEVM_MAINNET]: Network.POLYGONZKEVM_MAINNET,
    [Network.POLYGONZKEVM_TESTNET]: Network.POLYGONZKEVM_TESTNET,
    [Network.BASE_MAINNET]: Network.BASE_MAINNET,
    [Network.BASE_GOERLI]: Network.BASE_GOERLI,
    [Network.BASE_SEPOLIA]: Network.BASE_SEPOLIA,
    [Network.ZKSYNC_MAINNET]: Network.ZKSYNC_MAINNET,
    [Network.ZKSYNC_SEPOLIA]: Network.ZKSYNC_SEPOLIA,
}

export function getEthereumNetwork(key: string) {
    const network = EthereumNetworkMapping[key];
    return network || Network.ETH_MAINNET;
}