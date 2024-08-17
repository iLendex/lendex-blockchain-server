import { ethers } from "ethers";
import { FulfilledResponse, FulfillResponseType, LoanInfo } from "../types";

const fulfillResponseTypes = [
    FulfillResponseType.UNKNOWN,
    FulfillResponseType.BORROW_CHECK,
    FulfillResponseType.PAY_DEBT_CHECK,
    FulfillResponseType.LENDER_CLAIM_CHECK,
    FulfillResponseType.BORROWER_CLAIM_CHECK,
]

export function decodeERC721ReceivedEvent(data: any): { contract: string, tokenId: string, refToken: string } {
    const [contract, tokenId, refToken] = ethers.utils.defaultAbiCoder.decode(
        ["address", "uint256", "uint256"],
        data
    );
    return { contract, tokenId: tokenId.toString(), refToken: refToken.toString() };
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