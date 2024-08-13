import { Interface } from "ethers/lib/utils";


export type borrowTokenParamType = {
    consumerAddress: string;
    contractABI: Interface;
    source: string;
    slotIdNumber: number;
    donHostedSecretsVersion: number;
  
  }
  

  export interface payDebtParamType {
    consumerAddress: string;
    contractABI: any;
    source: string;
    contractAddress: string;
    tokenId: string;
    lenderAddress: string;
    slotIdNumber: number;
    donHostedSecretsVersion: number;
    args: string[];
  }