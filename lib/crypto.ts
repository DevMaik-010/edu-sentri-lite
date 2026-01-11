// lib/crypto.ts

async function getKeyMaterial() {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(process.env.NEXT_PUBLIC_SECRET_KEY_MATERIAL),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
}

async function getKey(keyMaterial: CryptoKey, salt: Uint8Array) {
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data: any): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await getKeyMaterial();
  const key = await getKey(keyMaterial, salt);

  const enc = new TextEncoder();
  const encodedData = enc.encode(JSON.stringify(data));

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as any,
    },
    key,
    encodedData
  );

  // Combine salt + iv + ciphertext for storage
  // Format: Base64(salt) : Base64(iv) : Base64(ciphertext)

  const saltB64 = Buffer.from(salt).toString("base64");
  const ivB64 = Buffer.from(iv).toString("base64");
  const encryptedB64 = Buffer.from(new Uint8Array(encrypted)).toString(
    "base64"
  );

  return `${saltB64}:${ivB64}:${encryptedB64}`;
}

export async function decryptData(encryptedString: string): Promise<any> {
  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format");
  }

  const salt = new Uint8Array(Buffer.from(parts[0], "base64"));
  const iv = new Uint8Array(Buffer.from(parts[1], "base64"));
  const ciphertext = new Uint8Array(Buffer.from(parts[2], "base64"));

  const keyMaterial = await getKeyMaterial();
  const key = await getKey(keyMaterial, salt);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as any,
    },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted));
}
