import { describe, it, expect } from 'vitest';
import * as db from './db';

describe('Admin & Whitelist System', () => {
  describe('Whitelist Database Functions', () => {
    const testWalletAddress = '0xTestWallet' + Date.now();
    let testEntryId: number | undefined;
    
    it('should add a wallet to whitelist', async () => {
      const result = await db.addToWhitelist({
        walletAddress: testWalletAddress,
        freeGenerations: 3,
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should check whitelist status correctly', async () => {
      const status = await db.checkWhitelistStatus(testWalletAddress);
      expect(status.isWhitelisted).toBe(true);
      expect(status.freeGenerations).toBe(3);
      expect(status.usedGenerations).toBe(0);
      expect(status.remainingGenerations).toBe(3);
      
      // Store entry id for later tests
      const entry = await db.getWhitelistByAddress(testWalletAddress);
      testEntryId = entry?.id;
    });

    it('should return not whitelisted for unknown wallet', async () => {
      const status = await db.checkWhitelistStatus('0xUnknownWallet' + Date.now());
      expect(status.isWhitelisted).toBe(false);
      expect(status.remainingGenerations).toBe(0);
    });

    it('should use whitelist generation correctly', async () => {
      const result = await db.useWhitelistGeneration(testWalletAddress);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.remainingGenerations).toBe(2);
    });

    it('should get all whitelist entries', async () => {
      const entries = await db.getAllWhitelist();
      expect(Array.isArray(entries)).toBe(true);
    });

    it('should delete whitelist entry', async () => {
      if (testEntryId) {
        await db.deleteWhitelistEntry(testEntryId);
        
        // Verify deletion
        const status = await db.checkWhitelistStatus(testWalletAddress);
        expect(status.isWhitelisted).toBe(false);
      }
    });
  });

  describe('Whitelist Batch Import', () => {
    it('should import multiple wallets', async () => {
      const timestamp = Date.now();
      const wallets = [
        { walletAddress: '0xBatch1' + timestamp, freeGenerations: 2 },
        { walletAddress: '0xBatch2' + timestamp, freeGenerations: 3 },
        { walletAddress: '0xBatch3' + timestamp, freeGenerations: 1 },
      ];
      
      const results = await db.bulkAddToWhitelist(wallets);
      expect(results.added + results.updated).toBe(3);
      expect(results.failed).toBe(0);
      
      // Cleanup - get ids and delete
      for (const wallet of wallets) {
        const entry = await db.getWhitelistByAddress(wallet.walletAddress);
        if (entry?.id) {
          await db.deleteWhitelistEntry(entry.id);
        }
      }
    });
  });
});
