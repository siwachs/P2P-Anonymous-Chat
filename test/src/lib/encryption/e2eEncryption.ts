import { messageStorage } from "@/lib/db/messageStorage";

export class E2EEncryption {
  private static insance: E2EEncryption;
  private keyCache: Map<string, CryptoKeyPair> = new Map();

  private constructor() {}

  static getInstance(): E2EEncryption {
    if (!E2EEncryption.insance) {
      E2EEncryption.insance = new E2EEncryption();
    }

    return E2EEncryption.insance;
  }

  // Generate ECDH key pair for key exchange
  async generateKeyPair(): Promise<{
    publicKey: JsonWebKey;
    privateKey: CryptoKey;
  }> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-384",
      },
      true,
      ["deriveKey"],
    );

    const publikKeyJwk = await crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey,
    );

    return {
      publicKey: publikKeyJwk,
      privateKey: keyPair.privateKey,
    };
  }

  // Import public key from JWK format
  async importPublicKey(publikKeyJwk: JsonWebKey): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      "jwk",
      publikKeyJwk,
      {
        name: "ECDH",
        namedCurve: "P-384",
      },
      true,
      [],
    );
  }

  // Derived shared secret key using ECDH
  async deriveSharedKey(
    privateKey: CryptoKey,
    publicKey: CryptoKey,
  ): Promise<CryptoKey> {
    return await crypto.subtle.deriveKey(
      {
        name: "ECDH",
        public: publicKey,
      },
      privateKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"],
    );
  }

  // Encrypt data using AES-GCM
  async encryptData(
    message: string,
    sharedKey: CryptoKey,
  ): Promise<{ ciphertext: string; iv: string }> {
    const encoder = new TextEncoder();
    const encryptedData = encoder.encode(message);

    // generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      sharedKey,
      encryptedData,
    );

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv),
    };
  }

  // Decrypt data using AES-GCM
  async decryptData(
    ciphertext: string,
    iv: string,
    sharedKey: CryptoKey,
  ): Promise<string> {
    const decoder = new TextDecoder();

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: this.base64ToArrayBuffer(iv),
      },
      sharedKey,
      this.base64ToArrayBuffer(ciphertext),
    );

    return decoder.decode(decryptedData);
  }

  // Store encryption keys for a conversation
  async storeConversationKeys(
    conversationId: string,
    publicKey: JsonWebKey,
    privateKey: CryptoKey,
    peerPublicKey?: JsonWebKey,
  ): Promise<void> {
    const privateKeyJwk = await crypto.subtle.exportKey("jwk", privateKey);

    await messageStorage.saveEncryptionKey({
      id: `${conversationId}-${Date.now()}`,
      conversationId,
      publicKey: JSON.stringify(publicKey),
      privateKey: JSON.stringify(privateKeyJwk),
      sharedSecret: peerPublicKey ? JSON.stringify(peerPublicKey) : undefined,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1 * 24 * 60 * 60 * 1000, // 1 day
    });
  }

  // Get or create encryption keys for a conversation
  async getOrCreateKeys(conversationId: string): Promise<{
    publicKey: JsonWebKey;
    privateKey: CryptoKey;
    sharedKey?: CryptoKey;
  }> {
    if (this.keyCache.has(conversationId)) {
      const cached = this.keyCache.get(conversationId)!;
      const publicKeyJwk = await crypto.subtle.exportKey(
        "jwk",
        cached.publicKey,
      );

      return {
        publicKey: publicKeyJwk,
        privateKey: cached.privateKey,
        sharedKey: undefined,
      };
    }

    const storedKey = await messageStorage.getEncryptionKey(conversationId);

    if (storedKey) {
    }
  }
}
