
/**
 * Aleo Wallet Integration
 * 
 * Handles connection to Leo Wallet or other Aleo wallets.
 * Supports Testnet Beta.
 */

import { useOverflowStore } from '../store';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { DecryptPermission, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';

let aleoAdapter: LeoWalletAdapter | null = null;

export const getAleoAdapter = () => {
    if (typeof window === 'undefined') return null;
    if (!aleoAdapter) {
        aleoAdapter = new LeoWalletAdapter({ appName: 'Bynomo' });
    }
    return aleoAdapter;
};

/**
 * Connect to Aleo wallet (e.g. Leo Wallet)
 * Returns the wallet address if successful
 */
export const connectAleoWallet = async (): Promise<string | null> => {
    try {
        const adapter = getAleoAdapter();

        if (!adapter) throw new Error('Adapter not initialized');

        // Check if the wallet is actually installed
        // The adapter might be readyState === 'Installed'

        await adapter.connect(DecryptPermission.AutoDecrypt, WalletAdapterNetwork.TestnetBeta);
        const address = adapter.publicKey;
        if (address) return address;
        throw new Error('No public key returned from adapter');
    } catch (error) {
        console.warn('Aleo connection failed, using temp address. Error:', error);

        // Generate a temporary random Aleo-like address for testnet play if not found
        // Real Aleo addresses start with 'aleo1...'
        const randomAddress = 'aleo1' + Array.from({ length: 58 }, () =>
            Math.random().toString(36).charAt(2)).join('');

        return randomAddress;
    }
};

/**
 * Get Aleo testnet balance
 * Note: Real Aleo balance fetching requires SDK or API call
 */
export const getAleoBalance = async (address: string): Promise<number> => {
    try {
        if (!address) return 0;

        // For testnet beta, we can use a mock or fetch from an Aleo explorer API
        // For now, return a mock balance to allow playing
        return 50.0; // 50 ALEO
    } catch (error) {
        console.error('Error fetching Aleo balance:', error);
        return 0;
    }
};
