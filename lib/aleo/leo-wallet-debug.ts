/**
 * Debug utility to inspect Leo Wallet structure
 * This helps us understand how Leo Wallet stores balance information
 */

export const debugLeoWallet = async () => {
    if (typeof window === 'undefined') {
        console.log('[Debug] Not in browser environment');
        return;
    }

    console.log('=== LEO WALLET DEBUG ===');
    
    // Check if Leo Wallet is installed
    const leoWallet = (window as any).leo;
    if (!leoWallet) {
        console.log('[Debug] Leo Wallet not found on window.leo');
        return;
    }

    console.log('[Debug] Leo Wallet found!');
    console.log('[Debug] Leo Wallet keys:', Object.keys(leoWallet));
    console.log('[Debug] Leo Wallet:', leoWallet);

    // Try to get all available methods and properties
    for (const key of Object.keys(leoWallet)) {
        const value = leoWallet[key];
        const type = typeof value;
        console.log(`[Debug] leo.${key}: ${type}`, type === 'function' ? '' : value);
    }

    // Try common wallet methods
    const methodsToTry = [
        'getAccount',
        'getAccounts', 
        'getBalance',
        'getPublicKey',
        'requestRecords',
        'requestTransaction',
        'connect',
        'disconnect'
    ];

    for (const method of methodsToTry) {
        if (typeof leoWallet[method] === 'function') {
            console.log(`[Debug] ✅ leo.${method}() is available`);
            
            // Try to call safe methods
            if (method === 'getAccount' || method === 'getAccounts' || method === 'getBalance' || method === 'getPublicKey') {
                try {
                    const result = await leoWallet[method]();
                    console.log(`[Debug] leo.${method}() result:`, result);
                } catch (e) {
                    console.log(`[Debug] leo.${method}() error:`, e);
                }
            }
        } else {
            console.log(`[Debug] ❌ leo.${method}() not available`);
        }
    }

    console.log('=== END DEBUG ===');
};
