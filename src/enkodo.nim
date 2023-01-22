import monocypher
import sysrandom
import flatty
import std/base64
import enkodo/types

#[
  helper function to convert bytes to string
]# 
proc toString*(bytes: seq[byte]): string =
  result = newString(bytes.len)
  copyMem(result[0].addr, bytes[0].unsafeAddr, bytes.len)

#[
  encrypts a message and returns a structure ready to be serialized and sent
]#
proc enc*( privateKey: Key, publicKey: Key, plaintext: seq[byte]): EncObj =
  #derive the shared key and material needed to encrypt
  let sharedKey = crypto_key_exchange(privateKey, publicKey)
  let nonce = getRandomBytes(sizeof(Nonce))
  #perform encryption
  let (mac, ciphertext) = crypto_lock(sharedKey, nonce, plaintext)
  #create the return object
  let myPubKey = crypto_key_exchange_public_key(privateKey)
  result = EncObj(publicKey: myPubKey,
                  nonce:nonce,
                  mac:mac,
                  cipherLen:cipherText.len,
                  cipherText:cipherText)
#[
  decrypts a message and returns a byte array
]#
proc dec*( privateKey: Key, encObj: EncObj): seq[byte] =
  #derive the shared key 
  let sharedKey = crypto_key_exchange(privateKey, encObj.publicKey)
  #perform decryption
  result = crypto_unlock( sharedKey, 
                          encObj.nonce, 
                          encObj.mac, 
                          encObj.ciphertext)

proc generateKeyPair*(): (Key, Key) =
  let privateKey = getRandomBytes(sizeof(Key))
  let publicKey = crypto_key_exchange_public_key(privateKey)
  return (privateKey, publicKey)