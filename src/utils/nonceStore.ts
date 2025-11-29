import type { NonceData } from "@/types";
import type { Address } from "viem";

type NonceStoreSetProps = {
  address: Address;
  nonce: string;
  ttlSeconds?: number;
};

type NonceStoreAddressProps = {
  address: Address;
};

class NonceStore {
  private store = new Map<string, NonceData>();

  constructor() {
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Clean up every 5 minutes
  }

  set({ address, nonce, ttlSeconds = 600 }: NonceStoreSetProps): void {
    const normalizedAddress = address.toLowerCase();
    this.store.set(normalizedAddress, {
      nonce,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get({ address }: NonceStoreAddressProps): string | null {
    const normalizedAddress = address.toLowerCase();
    const data = this.store.get(normalizedAddress);
    if (data && data.expiresAt > Date.now()) {
      return data.nonce;
    } else if (data && Date.now() > data.expiresAt) {
      this.store.delete(normalizedAddress);
    }
    return null;
  }

  delete({ address }: NonceStoreAddressProps): void {
    const normalizedAddress = address.toLowerCase();
    this.store.delete(normalizedAddress);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [address, data] of this.store.entries()) {
      if (data.expiresAt <= now) {
        this.store.delete(address);
      }
    }
  }
}

export const nonceStore = new NonceStore();
