import * as errors from "../errors";
import { Balance } from "../balance";
import { bigIntToBuffer } from "../smartcontracts/codec/utils";
import { Transaction } from "../transaction";
import { proto } from "./compiled";

/**
 * Hides away the serialization complexity, for each type of object (e.g. transactions).
 
 * The implementation is non-generic, but practical: there's a pair of `serialize` / `deserialize` method for each type of object.
 */
export class ProtoSerializer {
    /**
     * Serializes a Transaction object to a Buffer. Handles low-level conversion logic and field-mappings as well.
     */
    serializeTransaction(transaction: Transaction): Buffer {
        let protoTransaction = new proto.Transaction({
            Nonce: transaction.nonce.valueOf(),
            Value: this.serializeBalance(transaction.value),
            RcvAddr: transaction.receiver.pubkey(),
            RcvUserName: Buffer.alloc(0),
            SndAddr: transaction.sender.pubkey(),
            SndUserName: Buffer.alloc(0),
            GasPrice: transaction.gasPrice.valueOf(),
            GasLimit: transaction.gasLimit.valueOf(),
            Data: transaction.data.valueOf(),
            ChainID: Buffer.from(transaction.chainID.valueOf()),
            Version: transaction.version.valueOf(),
            Signature: Buffer.from(transaction.signature.hex(), "hex")
        });

        let encoded = proto.Transaction.encode(protoTransaction).finish();
        let buffer = Buffer.from(encoded);
        return buffer;
    }

    /**
     * Custom serialization, compatible with elrond-go.
     */
    private serializeBalance(balance: Balance): Buffer {
        let value = balance.valueOf();
        // Will retain the magnitude, as a buffer.
        let buffer = bigIntToBuffer(value);
        // We prepend the "positive" sign marker, in order to be compatible with Elrond Go's "sign & magnitude" proto-representation (a custom one).
        buffer = Buffer.concat([Buffer.from([0x00]), buffer]);
        return buffer;
    }

    deserializeTransaction(_buffer: Buffer): Transaction {
        return new Transaction();
    }
}
