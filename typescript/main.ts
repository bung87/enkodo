import * as mod from "https://deno.land/std@0.166.0/crypto/mod.ts";

// import the nim generated code
import { createRequire } from "https://deno.land/std@0.103.0/node/module.ts";
const require = createRequire(import.meta.url);
const serialize = require("./serialize.js");

import {
  crypto_blake2b,
  crypto_key_exchange,
  crypto_unlock,
  crypto_lock,
  crypto_key_exchange_public_key,
} from "https://deno.land/x/monocypher@v3.1.2-4/mod.ts";

function splitMAC(encBuffer: Uint8Array): [Uint8Array, Uint8Array] {
  return [encBuffer.slice(0, MAC_LEN), encBuffer.slice(MAC_LEN)];
}

function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  return crypto.getRandomValues(buf);
}

const HASH_LEN = 64;
const KEY_LEN = 32;
const NONCE_LEN = 24;
const MAC_LEN = 16;
const SIG_LEN = 64;


//encryption helper function that mirrors the nim functionality
export function enc(
  privateKey: Uint8Array,
  publicKey: Uint8Array,
  data: Uint8Array
): any {
  const sharedKey = crypto_key_exchange(privateKey, publicKey);
  // console.log(data);
  const nonce = randomBytes(NONCE_LEN);
  const maccipher = crypto_lock(sharedKey, nonce, data);
  // console.log(maccipher);
  const [mac, cipher] = splitMAC(maccipher);
  // console.log(mac, cipher);
  const myPubKey = crypto_key_exchange_public_key(privateKey);
  return serialize.returnEncObj(myPubKey, nonce, mac, cipher.length, cipher);
}

//decryption helper function that mirrors the nim functionality
export function dec(
  privateKey: Uint8Array,
  encObj: any,
): Uint8Array | null {
  const sharedKey = crypto_key_exchange(privateKey, encObj.publicKey);

  const mac = new Uint8Array(encObj.mac);
  const cipher = new Uint8Array(encObj.cipherText);

  const maccipher = new Uint8Array([...mac, ...cipher]);
  // console.log(maccipher);
  const plain = crypto_unlock(sharedKey, encObj.nonce, maccipher);
  return plain;
}

export function generateKeyPair(): [Uint8Array, Uint8Array] {
  const privateKey = randomBytes(KEY_LEN);
  const publicKey = crypto_key_exchange_public_key(privateKey);
  return [privateKey, publicKey];
}

export function wrap(obj: any): string {
  return serialize.wrap(obj);
}

export function unwrap(wrappedObj: string): any {
  return serialize.unwrap(wrappedObj);
}