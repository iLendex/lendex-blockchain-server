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

export enum LendexEvent {
  ERC721Received = "ERC721Received(address,uint256)",
  FulfillResponse = "FulfillResponse(bytes32,uint8,bytes,bytes)",
}

export enum FulfillResponseType {
  UNKNOWN = "UNKNOWN",
  BORROW_CHECK = "BORROW_CHECK",
  PAY_DEBT_CHECK = "PAY_DEBT_CHECK",
  LENDER_CLAIM_CHECK = "LENDER_CLAIM_CHECK",
  BORROWER_CLAIM_CHECK = "BORROWER_CLAIM_CHECK",
}

export type LoanInfo = { 
  borrower: string, 
  loan: number, 
  apr: { n: number, d: number} 
}

export type FulfilledResponse = { 
  type: FulfillResponseType, 
  success: boolean, 
  loanInfo?: LoanInfo 
}