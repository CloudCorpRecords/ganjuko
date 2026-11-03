import {
  createHash,
  generateKeyPairSync,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify,
} from "node:crypto";
import { canonicalStringify } from "./hash.js";

// Layer 1 identity (TRUST-RELEASE-AND-FLAVOR-DESIGN §3.1): a per-install
// Ed25519 keypair is the whole account. Player ID = first 16 hex chars of
// SHA-256 over the raw 32-byte public key. There is no email, no password,
// no recovery — losing the key file is losing the ladder identity, by
// design (§3.1 says so in plain words).

export function playerIdFromPubkey(rawPubkey) {
  if (!Buffer.isBuffer(rawPubkey) || rawPubkey.length !== 32) {
    throw new Error("Ed25519 raw public key must be 32 bytes");
  }
  return createHash("sha256").update(rawPubkey).digest("hex").slice(0, 16);
}

// Node represents Ed25519 keys as KeyObjects; the wire format is the raw
// 32-byte public key, base64. SPKI DER for Ed25519 is a fixed 12-byte
// prefix followed by the raw key; PKCS8 likewise for the private key.
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

export function rawFromPublicKeyObject(keyObject) {
  const der = keyObject.export({ type: "spki", format: "der" });
  return Buffer.from(der.subarray(der.length - 32));
}

export function publicKeyObjectFromRaw(rawPubkey) {
  return createPublicKey({
    key: Buffer.concat([SPKI_PREFIX, rawPubkey]),
    format: "der",
    type: "spki",
  });
}

export function privateKeyObjectFromSeed(seed32) {
  return createPrivateKey({
    key: Buffer.concat([PKCS8_PREFIX, seed32]),
    format: "der",
    type: "pkcs8",
  });
}

// Used by the test-suite's simulated clients; the real client generates
// and stores its keypair locally on first Arena use (§3.1).
export function generateIdentity() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const rawPub = rawFromPublicKeyObject(publicKey);
  return {
    publicKey,
    privateKey,
    rawPubkey: rawPub,
    pubkeyB64: rawPub.toString("base64"),
    playerId: playerIdFromPubkey(rawPub),
  };
}

// The signed-payload canonical form. Every signed protocol message signs:
//   ganjuko-sign-v1|<type>|<matchId or "-">|<turn or "-">|<sha256 of body>
// where <body> is the canonical JSON of the message minus `type` and
// `sig`. One form for every message type keeps client implementations
// (and auditors) honest.
export function signPayload({ type, matchId, turn, body }) {
  const bodyHash = createHash("sha256")
    .update(canonicalStringify(body), "utf8")
    .digest("hex");
  return [
    "ganjuko-sign-v1",
    type,
    matchId == null ? "-" : String(matchId),
    turn == null ? "-" : String(turn),
    bodyHash,
  ].join("|");
}

export function signMessage(privateKey, fields) {
  const payload = signPayload(fields);
  return cryptoSign(null, Buffer.from(payload, "utf8"), privateKey).toString("base64");
}

export function verifyMessage(rawPubkey, fields, sigB64) {
  try {
    const payload = signPayload(fields);
    const key = publicKeyObjectFromRaw(rawPubkey);
    return cryptoVerify(
      null,
      Buffer.from(payload, "utf8"),
      key,
      Buffer.from(sigB64, "base64")
    );
  } catch {
    return false;
  }
}
