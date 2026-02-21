
/**
 * Aleo Wallet Integration
 * 
 * Handles connection to Leo Wallet or other Aleo wallets.
 * Supports Testnet Beta.
 */

import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { DecryptPermission, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { AleoNetworkClient, Account } from '@provablehq/sdk';

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
 * Get Aleo testnet balance from the network using Provable SDK
 * Fetches PUBLIC balance from the credits.aleo account mapping
 */
export const getAleoBalance = async (address: string): Promise<number> => {
    try {
        if (!address) return 0;

        console.log(`[Aleo] Fetching PUBLIC balance for address: ${address}`);

        // Use Provable SDK's AleoNetworkClient to fetch public balance
        // According to docs: getProgramMappingValue("credits.aleo", "account", address)
        const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
        
        try {
            // Try testnet3 first
            const publicBalance = await networkClient.getProgramMappingValue(
                "credits.aleo",
                "account",
                address
            );

            if (publicBalance) {
                console.log(`[Aleo] Raw public balance from SDK: ${publicBalance}`);
                // Balance is returned as a string like "1000000u64" (in microcredits)
                // 1 ALEO = 1,000,000 microcredits
                const microcredits = publicBalance.replace(/u64|"/g, '').trim();
                const balance = parseInt(microcredits) / 1_000_000;
                console.log(`[Aleo] Public balance: ${balance} ALEO (${microcredits} microcredits)`);
                return balance;
            } else {
                console.log('[Aleo] getProgramMappingValue returned null - account has no public balance');
                return 0;
            }
        } catch (sdkError: any) {
            console.error('[Aleo] SDK getProgramMappingValue error:', sdkError);
            // If SDK fails, return 0 (account likely has no public balance)
            return 0;
        }
    } catch (error) {
        console.error('[Aleo] Error fetching balance:', error);
        return 0;
    }
};


/**
 * Get Aleo balance from Leo Wallet directly (includes private records)
 * This method queries BOTH public and private balances using Provable SDK
 * 
 * According to Aleo documentation:
 * - Public balance: stored in credits.aleo/account mapping (like Ethereum)
 * - Private balance: sum of unspent credits records (like Bitcoin UTXOs)
 */
export const getAleoBalanceFromWallet = async (): Promise<number> => {
    try {
        console.log('[Aleo] getAleoBalanceFromWallet called');
        const adapter = getAleoAdapter();
        
        if (!adapter || !adapter.publicKey) {
            console.log('[Aleo] Wallet adapter not available or not connected');
            return 0;
        }

        const address = adapter.publicKey;
        console.log(`[Aleo] Fetching balance for connected wallet: ${address}`);
        
        let totalBalance = 0;

        // Initialize Provable SDK NetworkClient
        const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");

        // STEP 1: Fetch PUBLIC balance using SDK
        // According to docs: getProgramMappingValue("credits.aleo", "account", address)
        try {
            console.log('[Aleo] Fetching PUBLIC balance using Provable SDK...');
            const publicBalance = await networkClient.getProgramMappingValue(
                "credits.aleo",
                "account",
                address
            );

            if (publicBalance) {
                console.log(`[Aleo] Raw public balance: ${publicBalance}`);
                // Balance is returned as "1000000u64" (microcredits)
                const microcredits = publicBalance.replace(/u64|"/g, '').trim();
                const balanceInAleo = parseInt(microcredits) / 1_000_000;
                console.log(`[Aleo] Public balance: ${balanceInAleo} ALEO`);
                totalBalance += balanceInAleo;
            } else {
                console.log('[Aleo] No public balance found (null returned)');
            }
        } catch (publicError) {
            console.error('[Aleo] Error fetching public balance:', publicError);
        }

        // STEP 2: Fetch PRIVATE balance from records using SDK
        // According to docs: findRecords() scans blockchain for unspent records
        // However, we need the current block height to search efficiently
        try {
            console.log('[Aleo] Fetching PRIVATE balance from records...');
            
            // Get latest block height first
            const latestHeight = await networkClient.getLatestHeight();
            console.log(`[Aleo] Latest block height: ${latestHeight}`);
            
            // Search last 10,000 blocks for records (adjust range as needed)
            const startHeight = Math.max(0, latestHeight - 10000);
            const endHeight = latestHeight;
            
            console.log(`[Aleo] Searching for records from block ${startHeight} to ${endHeight}...`);
            
            // Note: findRecords requires an Account object with private key
            // Since we only have the wallet adapter, we can't decrypt records
            // We'll need to use the wallet adapter's requestRecords method instead
            
            if (typeof adapter.requestRecords === 'function') {
                console.log('[Aleo] Using wallet adapter requestRecords...');
                const records: any = await adapter.requestRecords('credits.aleo');
                console.log('[Aleo] Records from wallet:', records);
                
                // Handle different response formats
                let recordsArray: any[] = [];
                if (Array.isArray(records)) {
                    recordsArray = records;
                } else if (records && Array.isArray(records.records)) {
                    recordsArray = records.records;
                }
                
                if (recordsArray.length > 0) {
                    console.log(`[Aleo] Found ${recordsArray.length} records`);
                    // Sum up all unspent credits records
                    let totalMicrocredits = 0;
                    recordsArray.forEach((record: any, index: number) => {
                        if (record && !record.spent && record.data && record.data.microcredits) {
                            const microcredits = parseInt(record.data.microcredits);
                            console.log(`[Aleo] Record ${index}: ${microcredits} microcredits`);
                            totalMicrocredits += microcredits;
                        }
                    });
                    
                    const privateBalance = totalMicrocredits / 1_000_000;
                    console.log(`[Aleo] Private balance: ${privateBalance} ALEO`);
                    totalBalance += privateBalance;
                } else {
                    console.log('[Aleo] No private records found');
                }
            } else {
                console.log('[Aleo] Wallet adapter does not support requestRecords');
            }
        } catch (privateError) {
            console.error('[Aleo] Error fetching private balance:', privateError);
        }

        console.log(`[Aleo] Total balance (public + private): ${totalBalance} ALEO`);
        return totalBalance;
    } catch (error) {
        console.error('[Aleo] Error in getAleoBalanceFromWallet:', error);
        return 0;
    }
};
