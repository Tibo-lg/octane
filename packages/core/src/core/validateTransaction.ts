import { Connection, Transaction, TransactionSignature, Keypair } from '@solana/web3.js';
import base58 from 'bs58';

// Check that a transaction is basically valid, sign it, and serialize it, verifying the signatures
// This function doesn't check if payer fee was transferred (instead, use validateTransfer) or
// instruction signatures do not include fee payer as a writable account (instead, use validateInstructions).
export async function validateTransaction(
    connection: Connection,
    transaction: Transaction,
    feePayer: Keypair,
    maxSignatures: number,
    lamportsPerSignature: number
): Promise<{ signature: TransactionSignature; rawTransaction: Buffer }> {
    console.log("validateTransaction(): transaction=" + transaction);
    console.log("validateTransaction(): transaction.signatures=" + transaction.signatures);
    // Check the fee payer and blockhash for basic validity
    if (!transaction.feePayer?.equals(feePayer.publicKey)) throw new Error('invalid fee payer');
    if (!transaction.recentBlockhash) throw new Error('missing recent blockhash');

    // TODO: handle nonce accounts?

    // Check Octane's RPC node for the blockhash to make sure it's synced and the fee is reasonable
    const feeCalculator = await connection.getFeeCalculatorForBlockhash(transaction.recentBlockhash);
    if (!feeCalculator.value) throw new Error('blockhash not found');
    if (feeCalculator.value.lamportsPerSignature > lamportsPerSignature) throw new Error('fee too high');

    // Check the signatures for length, the primary signature, and secondary signature(s)
    if (!transaction.signatures.length) throw new Error('no signatures');
    if (transaction.signatures.length > maxSignatures) throw new Error('too many signatures');

    const [primary, ...secondary] = transaction.signatures;
    console.log("validateTransaction(): primary=" + primary);
    console.log("validateTransaction(): secondary=" + secondary);
    if (!primary.publicKey.equals(feePayer.publicKey)) throw new Error('invalid fee payer pubkey');
    console.log("validateTransaction(): primary.publicKey=" + primary.publicKey);
    if (primary.signature) throw new Error('invalid fee payer signature');
    console.log("validateTransaction(): primary.signature=" + primary.signature);

    for (const signature of secondary) {
        console.log("validateTransaction(): signature=" + signature);
        if (!signature.publicKey) throw new Error('missing public key');
        console.log("validateTransaction(): signature.publicKey=" + signature.publicKey);
        if (!signature.signature) throw new Error('missing signature');
        console.log("validateTransaction(): signature.signature=" + signature.signature);
    }

    // Add the fee payer signature
    transaction.partialSign(feePayer);
    console.log("validateTransaction(): transaction.signature="+transaction.signature);

    // Serialize the transaction, verifying the signatures
    const rawTransaction = transaction.serialize();

    // Return the primary signature (aka txid) and serialized transaction
    return { signature: base58.encode(transaction.signature!), rawTransaction };
}
