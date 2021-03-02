"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
/*Transfer funds from one user to another in a transaction*/
class Transaction {
    /*Three properties:amount, payer,payee */
    constructor(amount, payer, payee) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    toString() {
        return JSON.stringify(this);
    }
}
/*Block is a container for multiple transactions */
class Block {
    constructor(prevHash, transaction, 
    /*Timestamp beacuse blocks are placed in chrnological order*/
    ts = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.ts = ts;
        //math challenge to solve
        this.nonce = Math.round(Math.random() * 999999999);
    }
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}
/*Linked List of Blocks*/
class Chain {
    constructor() {
        //this is the genesis block,this is the first chain
        //previous hash is '' beacuse there is nothing to link to
        this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))];
    }
    get lastBlock() {
        //Return last block
        return this.chain[this.chain.length - 1];
    }
    addBlock(transaction, senderPublicKey, signature) {
        //create verifier
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
    //attempt to find a number that when added to the nonce 
    //that will produce a hash that starts with four zeros
    mine(nonce) {
        let solution = 1;
        console.log('Mining 🔨🔨......');
        while (true) {
            //like sha256 but its 128 bits
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            if (attempt.substr(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }
}
//make singleton instance because there should only be one chain
Chain.instance = new Chain();
//allows people to securely send coin back and forth
class Wallet {
    constructor() {
        //generate a key pair using RSA
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }
    sendMoney(amount, payeePublicKey) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        //create signtaure using transaction data as the value
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        //sign with private key
        //identify yourself without actually exposing private key
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
//Example
const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();
satoshi.sendMoney(50, bob.publicKey);
alice.sendMoney(25, alice.publicKey);
alice.sendMoney(10, bob.publicKey);
console.log(Chain.instance);
