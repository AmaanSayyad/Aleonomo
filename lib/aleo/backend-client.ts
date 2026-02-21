
/**
 * Aleo Backend Client
 * 
 * Handles treasury operations for the Aleo network.
 */

export async function transferALEOFromTreasury(toAddress: string, amount: number): Promise<string> {
    const privateKey = process.env.ALEO_TREASURY_PRIVATE_KEY;
    const treasuryAddress = process.env.NEXT_PUBLIC_ALEO_TREASURY_ADDRESS;
    const network = process.env.NEXT_PUBLIC_ALEO_NETWORK || 'testnet';
    const apiUrl = process.env.NEXT_PUBLIC_ALEO_API_URL || 'https://api.explorer.provable.com/v1';

    console.log(`[Aleo Backend] Transferring ${amount} ALEO to ${toAddress}...`);
    console.log('[Aleo Backend] Config:', { 
        hasPrivateKey: !!privateKey, 
        privateKeyLength: privateKey?.length,
        treasuryAddress, 
        network, 
        apiUrl 
    });

    if (!privateKey || !treasuryAddress) {
        throw new Error('Aleo treasury configuration missing');
    }

    try {
        // Import Aleo SDK
        const { Account, AleoNetworkClient, ProgramManager, AleoKeyProvider, NetworkRecordProvider } = await import('@provablehq/sdk');

        console.log('[Aleo Backend] Creating account from private key...');
        console.log('[Aleo Backend] Private key length:', privateKey.length);
        console.log('[Aleo Backend] Private key starts with:', privateKey.substring(0, 20));
        
        // Initialize account directly from private key string
        const account = new Account({ privateKey: privateKey });
        console.log('[Aleo Backend] Account created:', account.address().to_string());

        // Initialize network client
        const networkClient = new AleoNetworkClient(apiUrl);

        // Initialize key provider
        const keyProvider = new AleoKeyProvider();
        keyProvider.useCache(true);

        // Initialize record provider
        const recordProvider = new NetworkRecordProvider(account, networkClient);

        // Initialize program manager
        const programManager = new ProgramManager(apiUrl, keyProvider, recordProvider);
        programManager.setAccount(account);

        console.log('[Aleo Backend] Program manager initialized');
        console.log('[Aleo Backend] Calling transfer:', { amount, toAddress, type: 'transfer_public', fee: 0.5, privateFee: false });

        // Build and submit transfer transaction
        // Using transfer_public for public balance transfers
        // Parameters: amount (ALEO), recipient, transferType, priorityFee (ALEO), privateFee (boolean)
        const txId = await programManager.transfer(
            amount,
            toAddress,
            'transfer_public',
            0.5, // 0.5 ALEO priority fee
            false // privateFee = false (use public balance for fee)
        );

        console.log(`[Aleo Backend] Transfer successful. Transaction ID: ${txId}`);
        return txId;
    } catch (error) {
        console.error('[Aleo Backend] Transfer failed:', error);
        console.error('[Aleo Backend] Error details:', {
            message: error instanceof Error ? error.message : 'Unknown',
            name: error instanceof Error ? error.name : 'Unknown'
        });
        throw new Error(`Aleo transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
