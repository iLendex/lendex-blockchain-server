import { ethers } from "ethers";

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

const fulfillResponseTypes = [
    FulfillResponseType.UNKNOWN,
    FulfillResponseType.BORROW_CHECK,
    FulfillResponseType.PAY_DEBT_CHECK,
    FulfillResponseType.LENDER_CLAIM_CHECK,
    FulfillResponseType.BORROWER_CLAIM_CHECK,
]

export type LoanInfo = { borrower: string, loan: number, apr: {n: number, d: number} };
export type FulfilledResponse = { type: FulfillResponseType, success: boolean, loanInfo?: LoanInfo };

export function decodeERC721ReceivedEvent(data: any): { contract: string, tokenId: number } {
    const [contract, tokenId] = ethers.utils.defaultAbiCoder.decode(
        ["address", "uint256"],
        data
    );
    return { contract, tokenId: tokenId.toNumber() };
}

export function decodeFulfillResponseEvent(data: any): FulfilledResponse {
    const [_type, response, error] = ethers.utils.defaultAbiCoder.decode(
        ['uint8', 'bytes', 'bytes'],
        data
    );
    const index = Number(_type);
    const type = fulfillResponseTypes[index];
    const success = !error || error == '0x';
    let loanInfo: LoanInfo;
    if (success) {
        const [borrower, loan, fee_n, fee_d] = ethers.utils.defaultAbiCoder.decode(
            ['string', 'int', 'int', 'int'],
            response
        );
        loanInfo = { borrower, loan: loan.toNumber(), apr: {n: fee_n.toNumber(), d: fee_d.toNumber()} }
    }
 
    return { type: type || FulfillResponseType.UNKNOWN, success, loanInfo };
}

